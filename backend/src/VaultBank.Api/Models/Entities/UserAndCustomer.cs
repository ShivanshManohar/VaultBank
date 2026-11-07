using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaultBank.Api.Models.Entities;

[Table("Users")]
public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "Customer"; // Customer or Admin

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Customer? Customer { get; set; }
}

[Table("Customers")]
public class Customer
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }

    [Required]
    [MaxLength(20)]
    public string CustomerNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string KYCStatus { get; set; } = "Verified";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<SavingsAccount> SavingsAccounts { get; set; } = new List<SavingsAccount>();
    public virtual ICollection<FixedDeposit> FixedDeposits { get; set; } = new List<FixedDeposit>();
    public virtual ICollection<SavingsGoal> SavingsGoals { get; set; } = new List<SavingsGoal>();
    public virtual ICollection<WealthSnapshot> WealthSnapshots { get; set; } = new List<WealthSnapshot>();
    public virtual ICollection<FinancialAlert> FinancialAlerts { get; set; } = new List<FinancialAlert>();
}
