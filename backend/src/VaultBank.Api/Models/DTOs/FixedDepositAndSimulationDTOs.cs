using System.ComponentModel.DataAnnotations;
using VaultBank.Api.Services;

namespace VaultBank.Api.Models.DTOs;

public class CreateFDRequest
{
    [Required]
    public Guid SourceAccountId { get; set; }

    [Required]
    [Range(5000.0, 50000000.0, ErrorMessage = "Principal must be at least ₹5,000.")]
    public decimal PrincipalAmount { get; set; }

    [Required]
    [Range(1, 180, ErrorMessage = "Tenure must be between 1 and 180 months.")]
    public int TenureMonths { get; set; }

    [Required]
    [Range(1.0, 20.0, ErrorMessage = "Interest rate must be between 1.0% and 20.0%.")]
    public decimal InterestRate { get; set; }

    public string CompoundingFrequency { get; set; } = "Quarterly";
}

public class FixedDepositResponse
{
    public Guid Id { get; set; }
    public string FDNumber { get; set; } = string.Empty;
    public Guid SourceAccountId { get; set; }
    public string SourceAccountNumber { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public decimal InterestRate { get; set; }
    public string CompoundingFrequency { get; set; } = "Quarterly";
    public int TenureMonths { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime MaturityDate { get; set; }
    public decimal ExpectedMaturityAmount { get; set; }
    public decimal ExpectedTotalInterest => ExpectedMaturityAmount - PrincipalAmount;
    public decimal AccruedInterest { get; set; }
    public decimal ActualSettledAmount { get; set; }
    public decimal PenaltyDeducted { get; set; }
    public string Status { get; set; } = "Active";
    public double ProgressPercentage
    {
        get
        {
            var totalDays = (MaturityDate - StartDate).TotalDays;
            if (totalDays <= 0) return 100.0;
            var elapsedDays = (DateTime.UtcNow - StartDate).TotalDays;
            return Math.Clamp(Math.Round((elapsedDays / totalDays) * 100.0, 1), 0.0, 100.0);
        }
    }
}

public class PrematureWithdrawalPreviewResponse
{
    public Guid FDId { get; set; }
    public string FDNumber { get; set; } = string.Empty;
    public decimal Principal { get; set; }
    public decimal ContractRate { get; set; }
    public decimal PenaltyRate { get; set; }
    public decimal EffectiveRate { get; set; }
    public int ElapsedMonths { get; set; }
    public decimal StandardGrossInterest { get; set; }
    public decimal PenaltyDeduction { get; set; }
    public decimal NetPayableProceeds { get; set; }
}

public class GrowthSimulationRequest
{
    [Required]
    [Range(1000.0, 50000000.0)]
    public decimal PrincipalAmount { get; set; } = 50000m;

    [Required]
    [Range(1, 180)]
    public int TenureMonths { get; set; } = 36;

    [Required]
    [Range(1.0, 25.0)]
    public decimal InterestRate { get; set; } = 7.25m;

    public int CompoundingFrequency { get; set; } = 4; // 4 = Quarterly
}

public class GrowthSimulationResponse
{
    public decimal PrincipalAmount { get; set; }
    public int TenureMonths { get; set; }
    public decimal InterestRate { get; set; }
    public int CompoundingFrequency { get; set; }
    public decimal MaturityAmount { get; set; }
    public decimal TotalInterestEarned { get; set; }
    public decimal EffectiveAnnualYield { get; set; }
    public List<GrowthTrajectoryPoint> Trajectory { get; set; } = new();
}

public class ScenarioCompareItem
{
    public string Name { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public int TenureMonths { get; set; }
    public decimal InterestRate { get; set; }
    public int CompoundingFrequency { get; set; } = 4;
}

public class ScenarioCompareRequest
{
    [Required]
    [MinLength(2)]
    public List<ScenarioCompareItem> Scenarios { get; set; } = new();
}

public class ScenarioCompareResultItem
{
    public string Name { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public int TenureMonths { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MaturityAmount { get; set; }
    public decimal TotalInterest { get; set; }
    public decimal ReturnMultiplier { get; set; }
    public List<GrowthTrajectoryPoint> Trajectory { get; set; } = new();
}

public class ScenarioCompareResponse
{
    public List<ScenarioCompareResultItem> Results { get; set; } = new();
    public string BestReturnScenario { get; set; } = string.Empty;
    public string TradeoffSummary { get; set; } = string.Empty;
}

public class FDLadderRequest
{
    [Required]
    [Range(10000.0, 50000000.0)]
    public decimal TotalCapital { get; set; } = 100000m;

    [Range(2, 6)]
    public int NumberOfTranches { get; set; } = 4;

    public decimal BaseInterestRate { get; set; } = 6.50m;
}

public class FDLadderTranche
{
    public int TrancheIndex { get; set; }
    public int TenureYears { get; set; }
    public int TenureMonths => TenureYears * 12;
    public decimal AllocatedPrincipal { get; set; }
    public decimal ApplicableRate { get; set; }
    public decimal MaturityValue { get; set; }
    public decimal InterestEarned => MaturityValue - AllocatedPrincipal;
    public DateTime EstimatedMaturityDate { get; set; }
}

public class FDLadderResponse
{
    public decimal TotalInvestedPrincipal { get; set; }
    public decimal CombinedProjectedMaturity { get; set; }
    public decimal TotalProjectedInterest => CombinedProjectedMaturity - TotalInvestedPrincipal;
    public List<FDLadderTranche> Tranches { get; set; } = new();
    public string StrategyExplanation { get; set; } = string.Empty;
}
