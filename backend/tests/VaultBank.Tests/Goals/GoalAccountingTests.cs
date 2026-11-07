using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Models.Entities;
using VaultBank.Api.Services;
using Xunit;

namespace VaultBank.Tests.Goals;

public class GoalAccountingTests
{
    private static VaultBankDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<VaultBankDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new VaultBankDbContext(options);
    }

    [Fact]
    public async Task VirtualGoalEarmark_ReservesAvailableBalanceWithoutMutatingActualBalance()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var customerId = Guid.NewGuid();
        var account = new SavingsAccount
        {
            CustomerId = customerId,
            AccountNumber = "VB-TEST-001",
            Balance = 50000.00m,
            AvailableBalance = 50000.00m,
            Status = "Active"
        };
        context.SavingsAccounts.Add(account);
        await context.SaveChangesAsync();

        var goalService = new GoalService(context);

        // Act 1: Create a goal with an initial virtual earmark of 20,000
        var createGoalRequest = new CreateGoalRequest
        {
            AccountId = account.Id,
            Title = "Emergency Reserve",
            TargetAmount = 40000.00m,
            InitialAllocation = 20000.00m,
            TargetDate = DateTime.UtcNow.AddMonths(12)
        };
        var goal = await goalService.CreateGoalAsync(customerId, createGoalRequest);

        // Assert 1: Invariant check
        var refreshedAccount = await context.SavingsAccounts.FindAsync(account.Id);
        Assert.NotNull(refreshedAccount);
        Assert.Equal(50000.00m, refreshedAccount.Balance); // Actual balance MUST remain 50,000!
        Assert.Equal(30000.00m, refreshedAccount.AvailableBalance); // Available balance MUST be 30,000!
        Assert.Equal(20000.00m, goal.AllocatedAmount);

        // Verify NO fake transactions were generated in ledger
        var transactionsCount = await context.Transactions.CountAsync(t => t.AccountId == account.Id);
        Assert.Equal(0, transactionsCount);

        // Act 2: Over-allocation beyond available balance MUST throw
        var overAllocateRequest = new AllocateGoalRequest
        {
            Amount = 35000.00m // Exceeds available 30,000!
        };
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            goalService.AllocateFundsAsync(goal.Id, customerId, overAllocateRequest));

        // Act 3: Release 5,000 back to available balance
        await goalService.ReleaseFundsAsync(goal.Id, customerId, 5000.00m);

        // Assert 3: Restored available balance
        var finalAccount = await context.SavingsAccounts.FindAsync(account.Id);
        Assert.NotNull(finalAccount);
        Assert.Equal(50000.00m, finalAccount.Balance); // Still untouched
        Assert.Equal(35000.00m, finalAccount.AvailableBalance); // Restored from 30k to 35k
    }
}
