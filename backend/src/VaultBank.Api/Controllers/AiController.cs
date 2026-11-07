using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AiController : BaseApiController
{
    private readonly VaultAiService _aiService;

    public AiController(VaultAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<ApiResponse<AiChatResponse>>> Chat([FromBody] AiChatRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var response = await _aiService.ProcessChatAsync(customerId, request);
        return Ok(ApiResponse<AiChatResponse>.Ok(response));
    }
}
