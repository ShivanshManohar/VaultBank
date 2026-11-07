using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace VaultBank.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected Guid GetAuthenticatedCustomerId()
    {
        var claim = User.FindFirst("CustomerId")?.Value;
        if (Guid.TryParse(claim, out var customerId) && customerId != Guid.Empty)
        {
            return customerId;
        }

        throw new UnauthorizedAccessException("Customer identity claim missing or invalid.");
    }
}
