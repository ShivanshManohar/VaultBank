using System.ComponentModel.DataAnnotations;

namespace VaultBank.Api.Models.DTOs;

public class CreateGoalRequest
{
    [Required]
    public Guid AccountId { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = "Emergency Fund";

    [Required]
    [Range(1000.0, 50000000.0)]
    public decimal TargetAmount { get; set; }

    [Range(0.0, 50000000.0)]
    public decimal InitialAllocation { get; set; } = 0.00m;

    [Required]
    public DateTime TargetDate { get; set; }
}

public class AllocateGoalRequest
{
    [Required]
    [Range(100.0, 50000000.0, ErrorMessage = "Allocation must be at least ₹100.")]
    public decimal Amount { get; set; }

    public string Notes { get; set; } = "Virtual goal reservation";
}

public class GoalResponse
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal AllocatedAmount { get; set; }
    public decimal RemainingAmount => Math.Max(0m, TargetAmount - AllocatedAmount);
    public double ProgressPercentage => TargetAmount > 0 ? Math.Min(100.0, Math.Round((double)(AllocatedAmount / TargetAmount) * 100.0, 1)) : 0.0;
    public DateTime TargetDate { get; set; }
    public string Status { get; set; } = "InProgress";
    public DateTime CreatedAt { get; set; }
}

public class FinancialOverviewResponse
{
    public decimal TotalSavingsBalance { get; set; }
    public decimal TotalAvailableBalance { get; set; }
    public decimal TotalEarmarkedGoals { get; set; }
    public decimal TotalActiveFDPrincipal { get; set; }
    public decimal TotalProjectedFDMaturity { get; set; }
    public decimal TotalAccruedInterest { get; set; }
    public decimal NetWorth => TotalSavingsBalance + TotalActiveFDPrincipal;
    public int ActiveAccountsCount { get; set; }
    public int ActiveFDsCount { get; set; }
    public int ActiveGoalsCount { get; set; }
    public DateTime? NextMaturityDate { get; set; }
    public decimal? NextMaturityPayout { get; set; }
}

public class MonthlyPulseResponse
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalDeposits { get; set; }
    public decimal TotalWithdrawals { get; set; }
    public decimal NetSavings => TotalDeposits - TotalWithdrawals;
    public decimal SavingsRatePercentage => TotalDeposits > 0 ? Math.Round((NetSavings / TotalDeposits) * 100m, 2) : 0m;
    public string EditorialNarrative { get; set; } = string.Empty;
}

public class CategorySpendingResponse
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public int TransactionCount { get; set; }
}

public class FinancialAlertResponse
{
    public Guid Id { get; set; }
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WealthJournalSnapshotResponse
{
    public int SnapshotYear { get; set; }
    public int SnapshotMonth { get; set; }
    public decimal OpeningSavings { get; set; }
    public decimal ClosingSavings { get; set; }
    public decimal TotalFDPrincipal { get; set; }
    public decimal TotalAccruedInterest { get; set; }
    public decimal TotalDeposits { get; set; }
    public decimal TotalWithdrawals { get; set; }
    public decimal MonthlySavingsRate { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class AiChatRequest
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Prompt { get; set; } = string.Empty;

    public string ActiveRoute { get; set; } = "/dashboard";

    public string? ActiveEntityId { get; set; }
}

public class AiChatResponse
{
    public string Reply { get; set; } = string.Empty;
    public string? SuggestedNavigationRoute { get; set; }
    public string? SuggestedActionLabel { get; set; }
    public List<string> FollowUpSuggestions { get; set; } = new();
    public string ModelUsed { get; set; } = "gemini-2.5-flash-lite";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
