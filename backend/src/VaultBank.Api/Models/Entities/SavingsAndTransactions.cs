using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaultBank.Api.Models.Entities;

[Table("SavingsAccounts")]
public class SavingsAccount
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [Required]
    [MaxLength(30)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AccountType { get; set; } = "Standard Savings"; // Standard Savings, High-Yield Reserve

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; } = 0.00m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal AvailableBalance { get; set; } = 0.00m;

    [Required]
    [MaxLength(10)]
    public string Currency { get; set; } = "INR"; // ₹

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Frozen, Closed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public virtual ICollection<FixedDeposit> FundedFixedDeposits { get; set; } = new List<FixedDeposit>();
    public virtual ICollection<SavingsGoal> EarmarkedGoals { get; set; } = new List<SavingsGoal>();
}

[Table("Transactions")]
public class Transaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid AccountId { get; set; }

    [ForeignKey(nameof(AccountId))]
    public virtual SavingsAccount? Account { get; set; }

    [Required]
    [MaxLength(50)]
    public string TransactionReference { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Type { get; set; } = "Deposit"; // Deposit, Withdrawal, FDFunding, FDSettlement, FDPenalty, InterestCredit

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "Other"; // Food, Shopping, Travel, Entertainment, Education, Utilities, Salary, Transfers, Other

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Completed"; // Completed, Failed, Reversed
}
