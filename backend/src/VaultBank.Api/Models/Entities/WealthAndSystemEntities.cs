using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaultBank.Api.Models.Entities;

[Table("SavingsGoals")]
public class SavingsGoal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [Required]
    public Guid AccountId { get; set; }

    [ForeignKey(nameof(AccountId))]
    public virtual SavingsAccount? Account { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "General"; // Emergency Fund, Travel, Tech, Education, Vehicle, Home

    [Column(TypeName = "decimal(18,2)")]
    public decimal TargetAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocatedAmount { get; set; } = 0.00m;

    public DateTime TargetDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "InProgress"; // InProgress, Achieved, Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GoalAllocation> Allocations { get; set; } = new List<GoalAllocation>();
}

[Table("GoalAllocations")]
public class GoalAllocation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid GoalId { get; set; }

    [ForeignKey(nameof(GoalId))]
    public virtual SavingsGoal? Goal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateTime AllocationDate { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    public string Notes { get; set; } = string.Empty;
}

[Table("WealthSnapshots")]
public class WealthSnapshot
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    public int SnapshotYear { get; set; }

    public int SnapshotMonth { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningSavings { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ClosingSavings { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalFDPrincipal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAccruedInterest { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalDeposits { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalWithdrawals { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal MonthlySavingsRate { get; set; } // e.g. 24.50%

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

[Table("BankPolicies")]
public class BankPolicy
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string PolicyKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PolicyValue { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("FDProducts")]
public class FDProduct
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int MinTenureMonths { get; set; } = 6;

    public int MaxTenureMonths { get; set; } = 120;

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinPrincipal { get; set; } = 5000m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal InterestRate { get; set; } = 7.00m;

    [Required]
    [MaxLength(20)]
    public string CompoundingFrequency { get; set; } = "Quarterly";

    public bool IsActive { get; set; } = true;
}

[Table("FinancialAlerts")]
public class FinancialAlert
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [Required]
    [MaxLength(50)]
    public string AlertType { get; set; } = "Anomaly"; // Anomaly, Milestone, MaturityUpcoming, GoalAchieved

    [Required]
    [MaxLength(20)]
    public string Severity { get; set; } = "Info"; // Info, Warning, Critical

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("ExternalDataCache")]
public class ExternalDataCache
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string Source { get; set; } = "RBI"; // RBI, Macro, Govt

    [Required]
    [MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string DataPayloadJson { get; set; } = string.Empty;

    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
}

[Table("ProcessingLogs")]
public class ProcessingLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string JobName { get; set; } = string.Empty; // InterestAccrual, MaturitySettlement, SnapshotGeneration

    [Required]
    [MaxLength(20)]
    public string TriggerType { get; set; } = "Automated"; // Automated, ManualAdmin

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Success"; // Success, Failed, Partial

    public int RecordsProcessed { get; set; } = 0;

    public string DetailsJson { get; set; } = string.Empty;

    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
}
