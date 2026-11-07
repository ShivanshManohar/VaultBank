using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class FixedDepositsController : BaseApiController
{
    private readonly FixedDepositService _fdService;

    public FixedDepositsController(FixedDepositService fdService)
    {
        _fdService = fdService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<FixedDepositResponse>>>> GetFixedDeposits()
    {
        var customerId = GetAuthenticatedCustomerId();
        var fds = await _fdService.GetCustomerFDsAsync(customerId);
        return Ok(ApiResponse<List<FixedDepositResponse>>.Ok(fds));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<FixedDepositResponse>>> GetFDById(Guid id)
    {
        var customerId = GetAuthenticatedCustomerId();
        var fd = await _fdService.GetFDByIdAsync(id, customerId);
        if (fd == null)
        {
            return NotFound(ApiResponse<FixedDepositResponse>.Fail("Fixed deposit not found."));
        }
        return Ok(ApiResponse<FixedDepositResponse>.Ok(fd));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FixedDepositResponse>>> CreateFixedDeposit([FromBody] CreateFDRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var fd = await _fdService.CreateFixedDepositAsync(customerId, request);
        return Ok(ApiResponse<FixedDepositResponse>.Ok(fd, "Fixed deposit successfully booked and funded."));
    }

    [HttpGet("{id}/premature-preview")]
    public async Task<ActionResult<ApiResponse<PrematureWithdrawalPreviewResponse>>> PreviewPrematureLiquidation(Guid id)
    {
        var customerId = GetAuthenticatedCustomerId();
        var preview = await _fdService.PreviewPrematureWithdrawalAsync(id, customerId);
        return Ok(ApiResponse<PrematureWithdrawalPreviewResponse>.Ok(preview));
    }

    [HttpPost("{id}/premature-withdraw")]
    public async Task<ActionResult<ApiResponse<FixedDepositResponse>>> ExecutePrematureLiquidation(Guid id)
    {
        var customerId = GetAuthenticatedCustomerId();
        var fd = await _fdService.ExecutePrematureWithdrawalAsync(id, customerId);
        return Ok(ApiResponse<FixedDepositResponse>.Ok(fd, "Fixed deposit liquidated prematurely. Net proceeds credited to reserve account."));
    }
}
