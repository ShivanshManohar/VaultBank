using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Services;

public class BankingService
{
    private readonly VaultBankDbContext _context;

    public BankingService(VaultBankDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavingsAccountResponse>> GetCustomerAccountsAsync(Guid customerId)
    {
        var accounts = await _context.SavingsAccounts
            .Where(a => a.CustomerId == customerId && a.Status == "Active")
            .OrderByDescending(a => a.Balance)
            .ToListAsync();

        return accounts.Select(MapAccountToDto).ToList();
    }

    public async Task<SavingsAccountResponse?> GetAccountByIdAsync(Guid accountId, Guid customerId)
    {
        var account = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.CustomerId == customerId);

        return account == null ? null : MapAccountToDto(account);
    }

    public async Task<TransactionResponse> DepositAsync(Guid accountId, Guid customerId, DepositRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Deposit amount must be strictly greater than zero.");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var account = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.CustomerId == customerId);

        if (account == null)
        {
            throw new InvalidOperationException("Savings account not found or access unauthorized.");
        }

        account.Balance += request.Amount;
        account.AvailableBalance += request.Amount;
        account.UpdatedAt = DateTime.UtcNow;

        var txn = new Transaction
        {
            AccountId = account.Id,
            TransactionReference = "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-" + Guid.NewGuid().ToString()[..6].ToUpper(),
            Type = "Deposit",
            Amount = request.Amount,
            BalanceAfter = account.Balance,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Deposit" : request.Category,
            Description = request.Description,
            TransactionDate = DateTime.UtcNow,
            Status = "Completed"
        };

        _context.Transactions.Add(txn);
        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return MapTransactionToDto(txn);
    }

    public async Task<TransactionResponse> WithdrawAsync(Guid accountId, Guid customerId, WithdrawalRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Withdrawal amount must be strictly greater than zero.");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var account = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.CustomerId == customerId);

        if (account == null)
        {
            throw new InvalidOperationException("Savings account not found or access unauthorized.");
        }

        if (account.AvailableBalance < request.Amount)
        {
            throw new InvalidOperationException(
                $"Insufficient available balance. Available: ₹{account.AvailableBalance:N2}, Requested: ₹{request.Amount:N2}. Note: Earmarked funds in savings goals reserve available balance.");
        }

        account.Balance -= request.Amount;
        account.AvailableBalance -= request.Amount;
        account.UpdatedAt = DateTime.UtcNow;

        var txn = new Transaction
        {
            AccountId = account.Id,
            TransactionReference = "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-" + Guid.NewGuid().ToString()[..6].ToUpper(),
            Type = "Withdrawal",
            Amount = request.Amount,
            BalanceAfter = account.Balance,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Other" : request.Category,
            Description = request.Description,
            TransactionDate = DateTime.UtcNow,
            Status = "Completed"
        };

        _context.Transactions.Add(txn);
        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return MapTransactionToDto(txn);
    }

    public async Task<List<TransactionResponse>> GetAccountTransactionsAsync(Guid accountId, Guid customerId, int limit = 50, string? category = null)
    {
        var account = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.CustomerId == customerId);

        if (account == null)
        {
            throw new InvalidOperationException("Account not found or access unauthorized.");
        }

        var query = _context.Transactions
            .Where(t => t.AccountId == accountId);

        if (!string.IsNullOrWhiteSpace(category) && category != "All")
        {
            query = query.Where(t => t.Category == category);
        }

        var transactions = await query
            .OrderByDescending(t => t.TransactionDate)
            .Take(limit)
            .ToListAsync();

        return transactions.Select(MapTransactionToDto).ToList();
    }

    private static SavingsAccountResponse MapAccountToDto(SavingsAccount a) => new()
    {
        Id = a.Id,
        AccountNumber = a.AccountNumber,
        AccountType = a.AccountType,
        Balance = a.Balance,
        AvailableBalance = a.AvailableBalance,
        Currency = a.Currency,
        Status = a.Status,
        CreatedAt = a.CreatedAt
    };

    private static TransactionResponse MapTransactionToDto(Transaction t) => new()
    {
        Id = t.Id,
        TransactionReference = t.TransactionReference,
        Type = t.Type,
        Amount = t.Amount,
        BalanceAfter = t.BalanceAfter,
        Category = t.Category,
        Description = t.Description,
        TransactionDate = t.TransactionDate,
        Status = t.Status
    };
}
