using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;

namespace VaultBank.Api.Services;

public class FinancialIntelligenceService
{
    private readonly VaultBankDbContext _context;

    public FinancialIntelligenceService(VaultBankDbContext context)
    {
        _context = context;
    }

    public async Task<FinancialOverviewResponse> GetOverviewAsync(Guid customerId)
    {
        var accounts = await _context.SavingsAccounts
            .Where(a => a.CustomerId == customerId && a.Status == "Active")
            .ToListAsync();

        var activeFDs = await _context.FixedDeposits
            .Where(f => f.CustomerId == customerId && f.Status == "Active")
            .OrderBy(f => f.MaturityDate)
            .ToListAsync();

        var goals = await _context.SavingsGoals
            .Where(g => g.CustomerId == customerId)
            .ToListAsync();

        decimal totalSavings = accounts.Sum(a => a.Balance);
        decimal totalAvailable = accounts.Sum(a => a.AvailableBalance);
        decimal totalEarmarked = totalSavings - totalAvailable;

        decimal totalFDPrincipal = activeFDs.Sum(f => f.PrincipalAmount);
        decimal totalProjectedMaturity = activeFDs.Sum(f => f.ExpectedMaturityAmount);
        decimal totalAccruedInterest = activeFDs.Sum(f => f.AccruedInterest);

        var nextFD = activeFDs.FirstOrDefault();

        return new FinancialOverviewResponse
        {
            TotalSavingsBalance = totalSavings,
            TotalAvailableBalance = totalAvailable,
            TotalEarmarkedGoals = totalEarmarked,
            TotalActiveFDPrincipal = totalFDPrincipal,
            TotalProjectedFDMaturity = totalProjectedMaturity,
            TotalAccruedInterest = totalAccruedInterest,
            ActiveAccountsCount = accounts.Count,
            ActiveFDsCount = activeFDs.Count,
            ActiveGoalsCount = goals.Count,
            NextMaturityDate = nextFD?.MaturityDate,
            NextMaturityPayout = nextFD?.ExpectedMaturityAmount
        };
    }

    public async Task<MonthlyPulseResponse> GetMonthlyPulseAsync(Guid customerId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var accountIds = await _context.SavingsAccounts
            .Where(a => a.CustomerId == customerId)
            .Select(a => a.Id)
            .ToListAsync();

        var monthTxns = await _context.Transactions
            .Where(t => accountIds.Contains(t.AccountId) && t.TransactionDate >= startOfMonth)
            .ToListAsync();

        decimal totalDeposits = monthTxns.Where(t => t.Type == "Deposit" || t.Type == "InterestCredit").Sum(t => t.Amount);
        decimal totalWithdrawals = monthTxns.Where(t => t.Type == "Withdrawal").Sum(t => t.Amount);
        decimal netSavings = totalDeposits - totalWithdrawals;

        decimal savingsRate = totalDeposits > 0 ? decimal.Round((netSavings / totalDeposits) * 100m, 2) : 0m;

        string narrative = savingsRate switch
        {
            >= 40m => $"Exceptional liquidity discipline this month with a net savings rate of {savingsRate:N1}%. Wealth is compounding on schedule.",
            >= 20m => $"Healthy savings rate of {savingsRate:N1}%. Total monthly inflow of ₹{totalDeposits:N2} comfortably outpaces operational expenses.",
            >= 0m => $"Balanced cashflow. Net capital retention stands at ₹{netSavings:N2}. Consider locking idle liquid balances into higher-yielding term deposits.",
            _ => "Expenditures exceeded monthly inflows. Review discretionary spending or allocate upcoming matured deposits to rebuild reserve cushions."
        };

        return new MonthlyPulseResponse
        {
            Month = now.Month,
            Year = now.Year,
            TotalDeposits = totalDeposits,
            TotalWithdrawals = totalWithdrawals,
            EditorialNarrative = narrative
        };
    }

    public async Task<List<CategorySpendingResponse>> GetSpendingBreakdownAsync(Guid customerId)
    {
        var accountIds = await _context.SavingsAccounts
            .Where(a => a.CustomerId == customerId)
            .Select(a => a.Id)
            .ToListAsync();

        var withdrawals = await _context.Transactions
            .Where(t => accountIds.Contains(t.AccountId) && t.Type == "Withdrawal")
            .ToListAsync();

        decimal totalSpent = withdrawals.Sum(t => t.Amount);
        if (totalSpent == 0) return new List<CategorySpendingResponse>();

        var grouped = withdrawals
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Category) ? "Other" : t.Category)
            .Select(g => new CategorySpendingResponse
            {
                Category = g.Key,
                Amount = g.Sum(x => x.Amount),
                Percentage = Math.Round((double)(g.Sum(x => x.Amount) / totalSpent) * 100.0, 1),
                TransactionCount = g.Count()
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return grouped;
    }

    public async Task<List<FinancialAlertResponse>> GetAlertsAsync(Guid customerId)
    {
        var alerts = await _context.FinancialAlerts
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToListAsync();

        return alerts.Select(a => new FinancialAlertResponse
        {
            Id = a.Id,
            AlertType = a.AlertType,
            Severity = a.Severity,
            Title = a.Title,
            Message = a.Message,
            IsRead = a.IsRead,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<List<WealthJournalSnapshotResponse>> GetJournalAsync(Guid customerId)
    {
        var snapshots = await _context.WealthSnapshots
            .Where(s => s.CustomerId == customerId)
            .OrderByDescending(s => s.SnapshotYear)
            .ThenByDescending(s => s.SnapshotMonth)
            .Take(12)
            .ToListAsync();

        return snapshots.Select(s => new WealthJournalSnapshotResponse
        {
            SnapshotYear = s.SnapshotYear,
            SnapshotMonth = s.SnapshotMonth,
            OpeningSavings = s.OpeningSavings,
            ClosingSavings = s.ClosingSavings,
            TotalFDPrincipal = s.TotalFDPrincipal,
            TotalAccruedInterest = s.TotalAccruedInterest,
            TotalDeposits = s.TotalDeposits,
            TotalWithdrawals = s.TotalWithdrawals,
            MonthlySavingsRate = s.MonthlySavingsRate,
            GeneratedAt = s.GeneratedAt
        }).ToList();
    }
}
