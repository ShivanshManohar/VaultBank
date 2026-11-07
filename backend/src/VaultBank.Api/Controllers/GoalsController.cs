using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class GoalsController : BaseApiController
{
    private readonly GoalService _goalService;

    public GoalsController(GoalService goalService)
    {
        _goalService = goalService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<GoalResponse>>>> GetGoals()
    {
        var customerId = GetAuthenticatedCustomerId();
        var goals = await _goalService.GetGoalsAsync(customerId);
        return Ok(ApiResponse<List<GoalResponse>>.Ok(goals));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GoalResponse>>> CreateGoal([FromBody] CreateGoalRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var goal = await _goalService.CreateGoalAsync(customerId, request);
        return Ok(ApiResponse<GoalResponse>.Ok(goal, "Savings goal established with virtual earmark."));
    }

    [HttpPost("{id}/allocate")]
    public async Task<ActionResult<ApiResponse<GoalResponse>>> AllocateFunds(Guid id, [FromBody] AllocateGoalRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var goal = await _goalService.AllocateFundsAsync(id, customerId, request);
        return Ok(ApiResponse<GoalResponse>.Ok(goal, "Funds virtually earmarked for goal. Available balance updated."));
    }

    [HttpPost("{id}/release")]
    public async Task<ActionResult<ApiResponse<GoalResponse>>> ReleaseFunds(Guid id, [FromQuery] decimal amount)
    {
        var customerId = GetAuthenticatedCustomerId();
        var goal = await _goalService.ReleaseFundsAsync(id, customerId, amount);
        return Ok(ApiResponse<GoalResponse>.Ok(goal, "Virtual funds released back to available balance."));
    }
}
