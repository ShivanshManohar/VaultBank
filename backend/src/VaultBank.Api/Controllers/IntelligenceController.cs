using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class IntelligenceController : BaseApiController
{
    private readonly FinancialIntelligenceService _intelligenceService;
    private readonly ExternalFinancialDataService _externalDataService;

    public IntelligenceController(
        FinancialIntelligenceService intelligenceService,
        ExternalFinancialDataService externalDataService)
    {
        _intelligenceService = intelligenceService;
        _externalDataService = externalDataService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<FinancialOverviewResponse>>> GetOverview()
    {
        var customerId = GetAuthenticatedCustomerId();
        var overview = await _intelligenceService.GetOverviewAsync(customerId);
        return Ok(ApiResponse<FinancialOverviewResponse>.Ok(overview));
    }

    [HttpGet("monthly-pulse")]
    public async Task<ActionResult<ApiResponse<MonthlyPulseResponse>>> GetMonthlyPulse()
    {
        var customerId = GetAuthenticatedCustomerId();
        var pulse = await _intelligenceService.GetMonthlyPulseAsync(customerId);
        return Ok(ApiResponse<MonthlyPulseResponse>.Ok(pulse));
    }

    [HttpGet("spending")]
    public async Task<ActionResult<ApiResponse<List<CategorySpendingResponse>>>> GetSpendingBreakdown()
    {
        var customerId = GetAuthenticatedCustomerId();
        var spending = await _intelligenceService.GetSpendingBreakdownAsync(customerId);
        return Ok(ApiResponse<List<CategorySpendingResponse>>.Ok(spending));
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<List<FinancialAlertResponse>>>> GetAlerts()
    {
        var customerId = GetAuthenticatedCustomerId();
        var alerts = await _intelligenceService.GetAlertsAsync(customerId);
        return Ok(ApiResponse<List<FinancialAlertResponse>>.Ok(alerts));
    }

    [HttpGet("journal")]
    public async Task<ActionResult<ApiResponse<List<WealthJournalSnapshotResponse>>>> GetJournal()
    {
        var customerId = GetAuthenticatedCustomerId();
        var journal = await _intelligenceService.GetJournalAsync(customerId);
        return Ok(ApiResponse<List<WealthJournalSnapshotResponse>>.Ok(journal));
    }

    [AllowAnonymous]
    [HttpGet("macro-indicators")]
    public async Task<ActionResult<ApiResponse<MacroIndicatorsDto>>> GetMacroIndicators()
    {
        var indicators = await _externalDataService.GetMacroIndicatorsAsync();
        return Ok(ApiResponse<MacroIndicatorsDto>.Ok(indicators));
    }
}
