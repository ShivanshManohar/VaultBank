using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaultBank.Api.Models.Entities;

[Table("FixedDeposits")]
public class FixedDeposit
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [Required]
    public Guid SourceAccountId { get; set; }

    [ForeignKey(nameof(SourceAccountId))]
    public virtual SavingsAccount? SourceAccount { get; set; }

    public Guid? PayoutAccountId { get; set; }

    [ForeignKey(nameof(PayoutAccountId))]
    public virtual SavingsAccount? PayoutAccount { get; set; }

    [Required]
    [MaxLength(30)]
    public string FDNumber { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrincipalAmount { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal InterestRate { get; set; } // e.g. 7.10 for 7.10%

    [Required]
    [MaxLength(20)]
    public string CompoundingFrequency { get; set; } = "Quarterly"; // Quarterly, Monthly, Annually

    public int TenureMonths { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime MaturityDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExpectedMaturityAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualSettledAmount { get; set; } = 0.00m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal AccruedInterest { get; set; } = 0.00m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PenaltyDeducted { get; set; } = 0.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal PenaltyRateApplied { get; set; } = 0.00m;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active"; // Active, Matured, Settled, PrematurelyClosed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SettledAt { get; set; }

    public virtual ICollection<InterestAccrual> InterestAccruals { get; set; } = new List<InterestAccrual>();
}

[Table("InterestAccruals")]
public class InterestAccrual
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid FixedDepositId { get; set; }

    [ForeignKey(nameof(FixedDepositId))]
    public virtual FixedDeposit? FixedDeposit { get; set; }

    public DateTime AccrualDate { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal AccrualAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CumulativeInterest { get; set; }

    public int PeriodIndex { get; set; }

    public bool IsSettled { get; set; } = false;

    public DateTime? SettledDate { get; set; }
}
