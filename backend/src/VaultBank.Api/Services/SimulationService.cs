using VaultBank.Api.Models.DTOs;

namespace VaultBank.Api.Services;

public class SimulationService
{
    public GrowthSimulationResponse SimulateGrowth(GrowthSimulationRequest request)
    {
        int frequency = request.CompoundingFrequency > 0 ? request.CompoundingFrequency : 4;
        decimal maturity = InterestCalculationEngine.CalculateMaturityAmount(
            request.PrincipalAmount, request.InterestRate, frequency, request.TenureMonths);
        decimal totalInterest = maturity - request.PrincipalAmount;

        // Effective Annual Rate (EAR) = (1 + r/n)^n - 1
        decimal r = request.InterestRate / 100m;
        decimal ear = (decimal)(Math.Pow((double)(1m + (r / frequency)), frequency) - 1.0) * 100m;

        var trajectory = InterestCalculationEngine.GenerateGrowthCurve(
            request.PrincipalAmount, request.InterestRate, frequency, request.TenureMonths);

        return new GrowthSimulationResponse
        {
            PrincipalAmount = request.PrincipalAmount,
            TenureMonths = request.TenureMonths,
            InterestRate = request.InterestRate,
            CompoundingFrequency = frequency,
            MaturityAmount = maturity,
            TotalInterestEarned = totalInterest,
            EffectiveAnnualYield = decimal.Round(ear, 2),
            Trajectory = trajectory
        };
    }

    public ScenarioCompareResponse CompareScenarios(ScenarioCompareRequest request)
    {
        var results = new List<ScenarioCompareResultItem>();

        foreach (var sc in request.Scenarios)
        {
            int frequency = sc.CompoundingFrequency > 0 ? sc.CompoundingFrequency : 4;
            decimal maturity = InterestCalculationEngine.CalculateMaturityAmount(
                sc.PrincipalAmount, sc.InterestRate, frequency, sc.TenureMonths);
            decimal totalInterest = maturity - sc.PrincipalAmount;
            decimal multiplier = sc.PrincipalAmount > 0 ? decimal.Round(maturity / sc.PrincipalAmount, 3) : 1m;

            var curve = InterestCalculationEngine.GenerateGrowthCurve(
                sc.PrincipalAmount, sc.InterestRate, frequency, sc.TenureMonths);

            results.Add(new ScenarioCompareResultItem
            {
                Name = sc.Name,
                PrincipalAmount = sc.PrincipalAmount,
                TenureMonths = sc.TenureMonths,
                InterestRate = sc.InterestRate,
                MaturityAmount = maturity,
                TotalInterest = totalInterest,
                ReturnMultiplier = multiplier,
                Trajectory = curve
            });
        }

        var bestNominal = results.OrderByDescending(r => r.MaturityAmount).FirstOrDefault();
        string bestName = bestNominal?.Name ?? "Scenario";

        string explanation =
            $"While '{bestName}' yields the highest total nominal maturity (₹{bestNominal?.MaturityAmount:N2}), " +
            "investors must weigh capital commitment duration and interim liquidity requirements. Shorter tenures provide flexibility to redeploy capital in rising interest environments.";

        return new ScenarioCompareResponse
        {
            Results = results,
            BestReturnScenario = bestName,
            TradeoffSummary = explanation
        };
    }

    public FDLadderResponse BuildLadder(FDLadderRequest request)
    {
        int tranchesCount = Math.Clamp(request.NumberOfTranches, 2, 6);
        decimal perTrancheCapital = decimal.Round(request.TotalCapital / tranchesCount, 2);

        var tranches = new List<FDLadderTranche>();
        decimal runningTotalMaturity = 0m;
        var now = DateTime.UtcNow;

        for (int i = 1; i <= tranchesCount; i++)
        {
            // Yield curve premium: each additional year adds 0.25% - 0.35%
            decimal trancheRate = request.BaseInterestRate + ((i - 1) * 0.30m);
            int tenureYears = i;
            int tenureMonths = tenureYears * 12;

            decimal maturity = InterestCalculationEngine.CalculateMaturityAmount(
                perTrancheCapital, trancheRate, 4, tenureMonths);

            runningTotalMaturity += maturity;

            tranches.Add(new FDLadderTranche
            {
                TrancheIndex = i,
                TenureYears = tenureYears,
                AllocatedPrincipal = perTrancheCapital,
                ApplicableRate = trancheRate,
                MaturityValue = maturity,
                EstimatedMaturityDate = now.AddYears(tenureYears)
            });
        }

        string ladderExplanation =
            $"Your ₹{request.TotalCapital:N2} capital is partitioned into {tranchesCount} equal tranches across 1 to {tranchesCount} years. " +
            "This strategy guarantees that a tranche matures annually, providing continuous liquidity or the opportunity to reinvest at prevailing market rates.";

        return new FDLadderResponse
        {
            TotalInvestedPrincipal = perTrancheCapital * tranchesCount,
            CombinedProjectedMaturity = runningTotalMaturity,
            Tranches = tranches,
            StrategyExplanation = ladderExplanation
        };
    }
}
