using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly SimulationService _simulationService;

    public SimulationController(SimulationService simulationService)
    {
        _simulationService = simulationService;
    }

    [HttpPost("fd-growth")]
    public ActionResult<ApiResponse<GrowthSimulationResponse>> SimulateGrowth([FromBody] GrowthSimulationRequest request)
    {
        var response = _simulationService.SimulateGrowth(request);
        return Ok(ApiResponse<GrowthSimulationResponse>.Ok(response));
    }

    [HttpPost("compare")]
    public ActionResult<ApiResponse<ScenarioCompareResponse>> CompareScenarios([FromBody] ScenarioCompareRequest request)
    {
        var response = _simulationService.CompareScenarios(request);
        return Ok(ApiResponse<ScenarioCompareResponse>.Ok(response));
    }

    [HttpPost("fd-ladder")]
    public ActionResult<ApiResponse<FDLadderResponse>> BuildLadder([FromBody] FDLadderRequest request)
    {
        var response = _simulationService.BuildLadder(request);
        return Ok(ApiResponse<FDLadderResponse>.Ok(response));
    }
}
