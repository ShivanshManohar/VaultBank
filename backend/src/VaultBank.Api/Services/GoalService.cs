using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Services;

public class GoalService
{
    private readonly VaultBankDbContext _context;

    public GoalService(VaultBankDbContext context)
    {
        _context = context;
    }

    public async Task<List<GoalResponse>> GetGoalsAsync(Guid customerId)
    {
        var goals = await _context.SavingsGoals
            .Include(g => g.Account)
            .Where(g => g.CustomerId == customerId)
            .OrderBy(g => g.TargetDate)
            .ToListAsync();

        return goals.Select(MapGoalToDto).ToList();
    }

    public async Task<GoalResponse> CreateGoalAsync(Guid customerId, CreateGoalRequest request)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var account = await _context.SavingsAccounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.CustomerId == customerId);

        if (account == null)
        {
            throw new InvalidOperationException("Linked savings account not found or access unauthorized.");
        }

        if (request.InitialAllocation > 0)
        {
            if (account.AvailableBalance < request.InitialAllocation)
            {
                throw new InvalidOperationException(
                    $"Insufficient available balance for initial goal earmark. Available: ₹{account.AvailableBalance:N2}, Requested: ₹{request.InitialAllocation:N2}.");
            }

            // Reserve available balance (Actual Balance remains untouched)
            account.AvailableBalance -= request.InitialAllocation;
            account.UpdatedAt = DateTime.UtcNow;
        }

        var goal = new SavingsGoal
        {
            CustomerId = customerId,
            AccountId = account.Id,
            Title = request.Title,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category,
            TargetAmount = request.TargetAmount,
            AllocatedAmount = request.InitialAllocation,
            TargetDate = request.TargetDate,
            Status = request.InitialAllocation >= request.TargetAmount ? "Achieved" : "InProgress",
            CreatedAt = DateTime.UtcNow
        };

        _context.SavingsGoals.Add(goal);

        if (request.InitialAllocation > 0)
        {
            var allocation = new GoalAllocation
            {
                Goal = goal,
                Amount = request.InitialAllocation,
                AllocationDate = DateTime.UtcNow,
                Notes = "Initial goal earmark allocation"
            };
            _context.GoalAllocations.Add(allocation);
        }

        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        goal.Account = account;
        return MapGoalToDto(goal);
    }

    public async Task<GoalResponse> AllocateFundsAsync(Guid goalId, Guid customerId, AllocateGoalRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Allocation amount must be greater than zero.");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var goal = await _context.SavingsGoals
            .Include(g => g.Account)
            .FirstOrDefaultAsync(g => g.Id == goalId && g.CustomerId == customerId);

        if (goal == null)
        {
            throw new InvalidOperationException("Savings goal not found.");
        }

        var account = goal.Account ?? await _context.SavingsAccounts.FirstAsync(a => a.Id == goal.AccountId);

        if (account.AvailableBalance < request.Amount)
        {
            throw new InvalidOperationException(
                $"Insufficient available funds to earmark for goal. Available: ₹{account.AvailableBalance:N2}, Requested: ₹{request.Amount:N2}.");
        }

        // Virtual Earmark Invariant:
        // Decreases available balance, leaves actual balance intact, logs goal allocation (no fake bank transaction).
        account.AvailableBalance -= request.Amount;
        account.UpdatedAt = DateTime.UtcNow;

        goal.AllocatedAmount += request.Amount;
        if (goal.AllocatedAmount >= goal.TargetAmount)
        {
            goal.Status = "Achieved";
        }

        var allocation = new GoalAllocation
        {
            GoalId = goal.Id,
            Amount = request.Amount,
            AllocationDate = DateTime.UtcNow,
            Notes = request.Notes
        };
        _context.GoalAllocations.Add(allocation);

        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return MapGoalToDto(goal);
    }

    public async Task<GoalResponse> ReleaseFundsAsync(Guid goalId, Guid customerId, decimal amount)
    {
        if (amount <= 0)
        {
            throw new InvalidOperationException("Release amount must be greater than zero.");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        var goal = await _context.SavingsGoals
            .Include(g => g.Account)
            .FirstOrDefaultAsync(g => g.Id == goalId && g.CustomerId == customerId);

        if (goal == null)
        {
            throw new InvalidOperationException("Savings goal not found.");
        }

        if (goal.AllocatedAmount < amount)
        {
            throw new InvalidOperationException($"Cannot release ₹{amount:N2} as only ₹{goal.AllocatedAmount:N2} is currently allocated.");
        }

        var account = goal.Account ?? await _context.SavingsAccounts.FirstAsync(a => a.Id == goal.AccountId);

        // Restore Available Balance on the account
        account.AvailableBalance += amount;
        account.UpdatedAt = DateTime.UtcNow;

        goal.AllocatedAmount -= amount;
        if (goal.Status == "Achieved" && goal.AllocatedAmount < goal.TargetAmount)
        {
            goal.Status = "InProgress";
        }

        var allocation = new GoalAllocation
        {
            GoalId = goal.Id,
            Amount = -amount,
            AllocationDate = DateTime.UtcNow,
            Notes = "Released virtual earmark back to available balance"
        };
        _context.GoalAllocations.Add(allocation);

        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return MapGoalToDto(goal);
    }

    private static GoalResponse MapGoalToDto(SavingsGoal g) => new()
    {
        Id = g.Id,
        AccountId = g.AccountId,
        AccountNumber = g.Account?.AccountNumber ?? string.Empty,
        Title = g.Title,
        Category = g.Category,
        TargetAmount = g.TargetAmount,
        AllocatedAmount = g.AllocatedAmount,
        TargetDate = g.TargetDate,
        Status = g.Status,
        CreatedAt = g.CreatedAt
    };
}
