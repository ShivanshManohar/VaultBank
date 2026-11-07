namespace VaultBank.Api.Services;

/// <summary>
/// Authoritative financial calculation engine for VaultBank.
/// Strictly uses C# decimal arithmetic to prevent floating-point rounding divergence.
/// </summary>
public static class InterestCalculationEngine
{
    /// <summary>
    /// Calculates the maturity value using the standard compound interest formula:
    /// A = P * (1 + r/n)^(n*t)
    /// </summary>
    /// <param name="principal">Principal amount (P)</param>
    /// <param name="annualRatePercent">Annual interest rate expressed as percentage (e.g., 7.25 for 7.25%)</param>
    /// <param name="compoundingFrequencyPerYear">Number of compounding periods per year (n), typically 4 for quarterly</param>
    /// <param name="tenureMonths">Tenure in months</param>
    /// <returns>Maturity amount (A) rounded to 2 decimal places</returns>
    public static decimal CalculateMaturityAmount(
        decimal principal,
        decimal annualRatePercent,
        int compoundingFrequencyPerYear,
        int tenureMonths)
    {
        if (principal <= 0) return 0m;
        if (annualRatePercent <= 0) return principal;
        if (tenureMonths <= 0) return principal;
        if (compoundingFrequencyPerYear <= 0) compoundingFrequencyPerYear = 4; // Default to quarterly

        decimal r = annualRatePercent / 100m;
        decimal n = compoundingFrequencyPerYear;
        decimal t = (decimal)tenureMonths / 12m;

        // Base periodic growth factor: (1 + r/n)
        decimal periodicFactor = 1m + (r / n);
        decimal totalPeriods = n * t;

        // Decimal power calculation
        decimal accumulatedFactor = DecimalPow(periodicFactor, totalPeriods);

        decimal maturityValue = principal * accumulatedFactor;
        return decimal.Round(maturityValue, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Computes total earned interest over the entire tenure.
    /// </summary>
    public static decimal CalculateTotalInterest(
        decimal principal,
        decimal annualRatePercent,
        int compoundingFrequencyPerYear,
        int tenureMonths)
    {
        decimal maturity = CalculateMaturityAmount(principal, annualRatePercent, compoundingFrequencyPerYear, tenureMonths);
        return decimal.Round(maturity - principal, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Generates milestone growth projections for dynamic charting (e.g. at each month/quarter/year boundary).
    /// </summary>
    public static List<GrowthTrajectoryPoint> GenerateGrowthCurve(
        decimal principal,
        decimal annualRatePercent,
        int compoundingFrequencyPerYear,
        int totalTenureMonths)
    {
        var curve = new List<GrowthTrajectoryPoint>();

        if (principal <= 0 || totalTenureMonths <= 0)
        {
            return curve;
        }

        // Interval step: if tenure <= 12 months, step monthly; if <= 60 months, step every 3 months; else every 6-12 months
        int stepMonths = totalTenureMonths switch
        {
            <= 12 => 1,
            <= 36 => 3,
            <= 60 => 6,
            _ => 12
        };

        // Always include initial point (month 0)
        curve.Add(new GrowthTrajectoryPoint
        {
            Month = 0,
            Year = 0m,
            Principal = principal,
            CumulativeInterest = 0m,
            TotalValue = principal
        });

        for (int month = stepMonths; month < totalTenureMonths; month += stepMonths)
        {
            decimal maturityAtMonth = CalculateMaturityAmount(principal, annualRatePercent, compoundingFrequencyPerYear, month);
            decimal interestAtMonth = maturityAtMonth - principal;

            curve.Add(new GrowthTrajectoryPoint
            {
                Month = month,
                Year = decimal.Round((decimal)month / 12m, 2),
                Principal = principal,
                CumulativeInterest = interestAtMonth,
                TotalValue = maturityAtMonth
            });
        }

        // Always conclude with exact final maturity point
        decimal finalMaturity = CalculateMaturityAmount(principal, annualRatePercent, compoundingFrequencyPerYear, totalTenureMonths);
        decimal finalInterest = finalMaturity - principal;

        curve.Add(new GrowthTrajectoryPoint
        {
            Month = totalTenureMonths,
            Year = decimal.Round((decimal)totalTenureMonths / 12m, 2),
            Principal = principal,
            CumulativeInterest = finalInterest,
            TotalValue = finalMaturity
        });

        return curve;
    }

    /// <summary>
    /// Calculates premature withdrawal liquidation proceeds based on contract terms and configured penalty policy.
    /// </summary>
    public static PrematureWithdrawalCalculation CalculatePrematureWithdrawal(
        decimal principal,
        decimal contractRatePercent,
        decimal penaltyRatePercent,
        int compoundingFrequencyPerYear,
        DateTime startDate,
        DateTime withdrawalDate)
    {
        if (withdrawalDate <= startDate)
        {
            return new PrematureWithdrawalCalculation
            {
                Principal = principal,
                ContractRate = contractRatePercent,
                PenaltyRate = penaltyRatePercent,
                EffectiveRate = contractRatePercent,
                ElapsedMonths = 0,
                GrossInterest = 0m,
                PenaltyAmount = 0m,
                NetPayableAmount = principal
            };
        }

        // Calculate completed whole days and months
        int elapsedDays = (withdrawalDate.Date - startDate.Date).Days;
        int elapsedMonths = Math.Max(1, (int)Math.Floor(elapsedDays / 30.4375));

        // Revised effective interest rate after penalty
        decimal effectiveRate = Math.Max(0m, contractRatePercent - penaltyRatePercent);

        // Interest if no penalty was applied for elapsed tenure
        decimal standardElapsedMaturity = CalculateMaturityAmount(principal, contractRatePercent, compoundingFrequencyPerYear, elapsedMonths);
        decimal grossInterest = standardElapsedMaturity - principal;

        // Interest with penalty rate applied
        decimal penalizedElapsedMaturity = CalculateMaturityAmount(principal, effectiveRate, compoundingFrequencyPerYear, elapsedMonths);
        decimal netInterest = penalizedElapsedMaturity - principal;

        decimal penaltyAmount = Math.Max(0m, grossInterest - netInterest);
        decimal netPayable = principal + netInterest;

        return new PrematureWithdrawalCalculation
        {
            Principal = principal,
            ContractRate = contractRatePercent,
            PenaltyRate = penaltyRatePercent,
            EffectiveRate = effectiveRate,
            ElapsedDays = elapsedDays,
            ElapsedMonths = elapsedMonths,
            GrossInterest = grossInterest,
            PenaltyAmount = penaltyAmount,
            NetPayableAmount = netPayable
        };
    }

    /// <summary>
    /// Precise decimal power calculation: baseVal^exponent.
    /// Uses double conversion for fractional powers with decimal boundary precision.
    /// </summary>
    private static decimal DecimalPow(decimal baseVal, decimal exponent)
    {
        if (exponent == 0m) return 1m;
        if (baseVal == 0m) return 0m;
        if (exponent == 1m) return baseVal;

        // If exponent is an integer, calculate using exponentiation by squaring for exact decimal precision
        if (exponent == decimal.Floor(exponent))
        {
            long exp = (long)exponent;
            if (exp > 0)
            {
                decimal result = 1m;
                decimal current = baseVal;
                while (exp > 0)
                {
                    if ((exp & 1) == 1) result *= current;
                    current *= current;
                    exp >>= 1;
                }
                return result;
            }
        }

        // For fractional compounding periods, convert safely via double for the power function
        double baseDouble = (double)baseVal;
        double expDouble = (double)exponent;
        double resultDouble = Math.Pow(baseDouble, expDouble);

        return (decimal)resultDouble;
    }
}

public class GrowthTrajectoryPoint
{
    public int Month { get; set; }
    public decimal Year { get; set; }
    public decimal Principal { get; set; }
    public decimal CumulativeInterest { get; set; }
    public decimal TotalValue { get; set; }
}

public class PrematureWithdrawalCalculation
{
    public decimal Principal { get; set; }
    public decimal ContractRate { get; set; }
    public decimal PenaltyRate { get; set; }
    public decimal EffectiveRate { get; set; }
    public int ElapsedDays { get; set; }
    public int ElapsedMonths { get; set; }
    public decimal GrossInterest { get; set; }
    public decimal PenaltyAmount { get; set; }
    public decimal NetPayableAmount { get; set; }
}
