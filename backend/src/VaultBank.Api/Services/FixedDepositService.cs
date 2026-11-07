using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Services;

public class FixedDepositService
{
    private readonly VaultBankDbContext _context;

    public FixedDepositService(VaultBankDbContext context)
    {
        _context = context;
    }

    public async Task<List<FixedDepositResponse>> GetCustomerFDsAsync(Guid customerId)
    {
        var fds = await _context.FixedDeposits
            .Include(f => f.SourceAccount)
            .Where(f => f.CustomerId == customerId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return fds.Select(MapFDToDto).ToList();
    }

    public async Task<FixedDepositResponse?> GetFDByIdAsync(Guid fdId, Guid customerId)
    {
        var fd = await _context.FixedDeposits
            .Include(f => f.SourceAccount)
            .FirstOrDefaultAsync(f => f.Id == fdId && f.CustomerId == customerId);

        return fd == null ? null : MapFDToDto(fd);
    }

    public async Task<FixedDepositResponse> CreateFixedDepositAsync(Guid customerId, CreateFDRequest request)
    {
        // 1. Fetch policy for minimum FD principal
        var minPolicy = await _context.BankPolicies
            .FirstOrDefaultAsync(p => p.PolicyKey == "MinFixedDepositPrincipal");
        decimal minPrincipal = minPolicy != null && decimal.TryParse(minPolicy.PolicyValue, out var val) ? val : 5000m;

        if (request.PrincipalAmount < minPrincipal)
        {
            throw new InvalidOperationException($"Minimum principal required for a Fixed Deposit is ₹{minPrincipal:N2}.");
        }

        if (request.TenureMonths < 1 || request.TenureMonths > 180)
        {
            throw new InvalidOperationException("Investment tenure must be between 1 and 180 months.");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        // 2. Validate source savings account
        var sourceAccount = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == request.SourceAccountId && a.CustomerId == customerId);

        if (sourceAccount == null)
        {
            throw new InvalidOperationException("Source savings account not found or unauthorized.");
        }

        if (sourceAccount.AvailableBalance < request.PrincipalAmount)
        {
            throw new InvalidOperationException(
                $"Insufficient available balance to fund Fixed Deposit. Available: ₹{sourceAccount.AvailableBalance:N2}, Required: ₹{request.PrincipalAmount:N2}.");
        }

        // 3. Deduct principal from source savings account
        sourceAccount.Balance -= request.PrincipalAmount;
        sourceAccount.AvailableBalance -= request.PrincipalAmount;
        sourceAccount.UpdatedAt = DateTime.UtcNow;

        // 4. Calculate authoritative maturity amount and dates
        int frequency = request.CompoundingFrequency?.ToLower() switch
        {
            "monthly" => 12,
            "annually" => 1,
            _ => 4 // default Quarterly
        };

        decimal expectedMaturity = InterestCalculationEngine.CalculateMaturityAmount(
            request.PrincipalAmount, request.InterestRate, frequency, request.TenureMonths);

        var startDate = DateTime.UtcNow;
        var maturityDate = startDate.AddMonths(request.TenureMonths);
        var fdNumber = "VB-FD-" + Random.Shared.Next(100000, 999999);

        var fd = new FixedDeposit
        {
            CustomerId = customerId,
            SourceAccountId = sourceAccount.Id,
            FDNumber = fdNumber,
            PrincipalAmount = request.PrincipalAmount,
            InterestRate = request.InterestRate,
            CompoundingFrequency = frequency switch { 12 => "Monthly", 1 => "Annually", _ => "Quarterly" },
            TenureMonths = request.TenureMonths,
            StartDate = startDate,
            MaturityDate = maturityDate,
            ExpectedMaturityAmount = expectedMaturity,
            AccruedInterest = 0m,
            Status = "Active",
            CreatedAt = startDate
        };

        _context.FixedDeposits.Add(fd);

        // 5. Log funding ledger transaction on source account
        var txn = new Transaction
        {
            AccountId = sourceAccount.Id,
            TransactionReference = "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-FD" + fdNumber[^4..],
            Type = "FDFunding",
            Amount = request.PrincipalAmount,
            BalanceAfter = sourceAccount.Balance,
            Category = "Transfers",
            Description = $"Capital allocation for Term Deposit {fdNumber}",
            TransactionDate = DateTime.UtcNow,
            Status = "Completed"
        };
        _context.Transactions.Add(txn);

        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        fd.SourceAccount = sourceAccount;
        return MapFDToDto(fd);
    }

    public async Task<PrematureWithdrawalPreviewResponse> PreviewPrematureWithdrawalAsync(Guid fdId, Guid customerId)
    {
        var fd = await _context.FixedDeposits
            .FirstOrDefaultAsync(f => f.Id == fdId && f.CustomerId == customerId);

        if (fd == null)
        {
            throw new InvalidOperationException("Fixed deposit contract not found.");
        }

        if (fd.Status != "Active")
        {
            throw new InvalidOperationException($"Cannot liquidate FD with status '{fd.Status}'. Only Active deposits are eligible.");
        }

        // Fetch current policy penalty rate
        var penaltyPolicy = await _context.BankPolicies
            .FirstOrDefaultAsync(p => p.PolicyKey == "PrematureWithdrawalPenaltyRate");
        decimal penaltyRate = penaltyPolicy != null && decimal.TryParse(penaltyPolicy.PolicyValue, out var val) ? val : 1.00m;

        int frequency = fd.CompoundingFrequency == "Monthly" ? 12 : (fd.CompoundingFrequency == "Annually" ? 1 : 4);

        var calculation = InterestCalculationEngine.CalculatePrematureWithdrawal(
            fd.PrincipalAmount,
            fd.InterestRate,
            penaltyRate,
            frequency,
            fd.StartDate,
            DateTime.UtcNow);

        return new PrematureWithdrawalPreviewResponse
        {
            FDId = fd.Id,
            FDNumber = fd.FDNumber,
            Principal = fd.PrincipalAmount,
            ContractRate = fd.InterestRate,
            PenaltyRate = penaltyRate,
            EffectiveRate = calculation.EffectiveRate,
            ElapsedMonths = calculation.ElapsedMonths,
            StandardGrossInterest = calculation.GrossInterest,
            PenaltyDeduction = calculation.PenaltyAmount,
            NetPayableProceeds = calculation.NetPayableAmount
        };
    }

    public async Task<FixedDepositResponse> ExecutePrematureWithdrawalAsync(Guid fdId, Guid customerId)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var fd = await _context.FixedDeposits
            .Include(f => f.SourceAccount)
            .FirstOrDefaultAsync(f => f.Id == fdId && f.CustomerId == customerId);

        if (fd == null)
        {
            throw new InvalidOperationException("Fixed deposit not found.");
        }

        if (fd.Status != "Active")
        {
            throw new InvalidOperationException($"Deposit {fd.FDNumber} is currently '{fd.Status}' and cannot be liquidated.");
        }

        var preview = await PreviewPrematureWithdrawalAsync(fdId, customerId);

        // Credit proceeds back to source savings account
        var account = fd.SourceAccount ?? await _context.SavingsAccounts.FirstAsync(a => a.Id == fd.SourceAccountId);
        account.Balance += preview.NetPayableProceeds;
        account.AvailableBalance += preview.NetPayableProceeds;
        account.UpdatedAt = DateTime.UtcNow;

        // Update FD State
        fd.Status = "PrematurelyClosed";
        fd.ActualSettledAmount = preview.NetPayableProceeds;
        fd.PenaltyDeducted = preview.PenaltyDeduction;
        fd.PenaltyRateApplied = preview.PenaltyRate;
        fd.SettledAt = DateTime.UtcNow;

        // Log Settlement Transaction
        var settlementTxn = new Transaction
        {
            AccountId = account.Id,
            TransactionReference = "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-SETTLE",
            Type = "FDSettlement",
            Amount = preview.NetPayableProceeds,
            BalanceAfter = account.Balance,
            Category = "Transfers",
            Description = $"Premature Liquidation of FD {fd.FDNumber} (Net Proceeds after {preview.PenaltyRate}% penalty)",
            TransactionDate = DateTime.UtcNow,
            Status = "Completed"
        };
        _context.Transactions.Add(settlementTxn);

        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return MapFDToDto(fd);
    }

    private static FixedDepositResponse MapFDToDto(FixedDeposit f) => new()
    {
        Id = f.Id,
        FDNumber = f.FDNumber,
        SourceAccountId = f.SourceAccountId,
        SourceAccountNumber = f.SourceAccount?.AccountNumber ?? string.Empty,
        PrincipalAmount = f.PrincipalAmount,
        InterestRate = f.InterestRate,
        CompoundingFrequency = f.CompoundingFrequency,
        TenureMonths = f.TenureMonths,
        StartDate = f.StartDate,
        MaturityDate = f.MaturityDate,
        ExpectedMaturityAmount = f.ExpectedMaturityAmount,
        AccruedInterest = f.AccruedInterest,
        ActualSettledAmount = f.ActualSettledAmount,
        PenaltyDeducted = f.PenaltyDeducted,
        Status = f.Status
    };
}
