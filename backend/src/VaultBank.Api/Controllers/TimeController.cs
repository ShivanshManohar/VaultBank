using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;

namespace VaultBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeController : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<SystemTimeResponse>> GetSystemTime()
    {
        var utcNow = DateTime.UtcNow;
        var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        var istTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, istZone);

        var response = new SystemTimeResponse
        {
            UtcTime = utcNow,
            LocalIstTime = istTime,
            FormattedDate = istTime.ToString("dddd, dd MMMM yyyy"),
            IsoDate = utcNow.ToString("yyyy-MM-dd"),
            UnixEpochSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            FinancialYear = istTime.Month >= 4 ? $"FY{istTime.Year}-{istTime.Year + 1}" : $"FY{istTime.Year - 1}-{istTime.Year}",
            ActiveQuarter = (istTime.Month - 1) / 3 + 1,
            MarketSession = istTime.Hour >= 9 && (istTime.Hour < 15 || (istTime.Hour == 15 && istTime.Minute <= 30))
                ? "Open (Active Trading & Clearing)"
                : "Closed (After-Hours Vault Compounding)"
        };

        return Ok(ApiResponse<SystemTimeResponse>.Ok(response));
    }
}

public class SystemTimeResponse
{
    public DateTime UtcTime { get; set; }
    public DateTime LocalIstTime { get; set; }
    public string FormattedDate { get; set; } = string.Empty;
    public string IsoDate { get; set; } = string.Empty;
    public long UnixEpochSeconds { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public int ActiveQuarter { get; set; }
    public string MarketSession { get; set; } = string.Empty;
}
