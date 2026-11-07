using VaultBank.Api.Services;
using Xunit;

namespace VaultBank.Tests.Calculations;

public class InterestCalculationEngineTests
{
    [Fact]
    public void CalculateMaturityAmount_OneYearQuarterlyCompounding_ComputesCorrectMaturity()
    {
        // Arrange
        // P = 100,000, r = 8%, n = 4, t = 1 yr (12 months)
        // A = 100,000 * (1 + 0.08/4)^4 = 100,000 * (1.02)^4 = 108,243.22
        decimal principal = 100000m;
        decimal rate = 8.0m;
        int frequency = 4;
        int tenureMonths = 12;

        // Act
        decimal maturity = InterestCalculationEngine.CalculateMaturityAmount(principal, rate, frequency, tenureMonths);
        decimal interest = InterestCalculationEngine.CalculateTotalInterest(principal, rate, frequency, tenureMonths);

        // Assert
        Assert.Equal(108243.22m, maturity);
        Assert.Equal(8243.22m, interest);
    }

    [Fact]
    public void CalculateMaturityAmount_FiveYearQuarterlyCompounding_ComputesCorrectMaturity()
    {
        // Arrange
        // P = 50,000, r = 7%, n = 4, t = 5 yrs (60 months)
        // A = 50,000 * (1 + 0.07/4)^20 = 50,000 * (1.0175)^20 = 70,738.91
        decimal principal = 50000m;
        decimal rate = 7.0m;
        int frequency = 4;
        int tenureMonths = 60;

        // Act
        decimal maturity = InterestCalculationEngine.CalculateMaturityAmount(principal, rate, frequency, tenureMonths);

        // Assert
        Assert.Equal(70738.91m, maturity);
    }

    [Fact]
    public void CalculateMaturityAmount_ZeroPrincipalOrTenure_ReturnsExpectedBaseline()
    {
        Assert.Equal(0m, InterestCalculationEngine.CalculateMaturityAmount(0m, 7.5m, 4, 12));
        Assert.Equal(10000m, InterestCalculationEngine.CalculateMaturityAmount(10000m, 7.5m, 4, 0));
        Assert.Equal(10000m, InterestCalculationEngine.CalculateMaturityAmount(10000m, 0m, 4, 24));
    }

    [Fact]
    public void GenerateGrowthCurve_MonotonicallyIncreasesAndEndsAtFinalMaturity()
    {
        // Arrange
        decimal principal = 100000m;
        decimal rate = 7.5m;
        int frequency = 4;
        int tenureMonths = 36;

        // Act
        var curve = InterestCalculationEngine.GenerateGrowthCurve(principal, rate, frequency, tenureMonths);

        // Assert
        Assert.NotEmpty(curve);
        Assert.Equal(0, curve.First().Month);
        Assert.Equal(principal, curve.First().TotalValue);
        Assert.Equal(0m, curve.First().CumulativeInterest);

        Assert.Equal(tenureMonths, curve.Last().Month);
        decimal expectedFinalMaturity = InterestCalculationEngine.CalculateMaturityAmount(principal, rate, frequency, tenureMonths);
        Assert.Equal(expectedFinalMaturity, curve.Last().TotalValue);

        // Verify values are strictly non-decreasing
        for (int i = 1; i < curve.Count; i++)
        {
            Assert.True(curve[i].TotalValue >= curve[i - 1].TotalValue, "Maturity values must be monotonically non-decreasing over time.");
            Assert.True(curve[i].CumulativeInterest >= curve[i - 1].CumulativeInterest, "Cumulative interest must increase over time.");
        }
    }

    [Fact]
    public void CalculatePrematureWithdrawal_AppliesPenaltyRateCorrectly()
    {
        // Arrange
        decimal principal = 100000m;
        decimal contractRate = 8.0m;
        decimal penaltyRate = 1.0m; // Effective rate: 7.0%
        int frequency = 4;
        var startDate = new DateTime(2025, 1, 1);
        var withdrawalDate = new DateTime(2026, 1, 1); // 12 months elapsed

        // Act
        var result = InterestCalculationEngine.CalculatePrematureWithdrawal(
            principal, contractRate, penaltyRate, frequency, startDate, withdrawalDate);

        // Assert
        Assert.Equal(7.0m, result.EffectiveRate);
        Assert.True(result.PenaltyAmount > 0m, "Penalty amount must be deducted from standard gross interest.");
        Assert.True(result.NetPayableAmount >= principal, "Customer must receive at least their initial principal.");
        Assert.True(result.NetPayableAmount < InterestCalculationEngine.CalculateMaturityAmount(principal, contractRate, frequency, 12),
            "Premature payout must be strictly less than unpenalized full-term contract return.");
    }
}
