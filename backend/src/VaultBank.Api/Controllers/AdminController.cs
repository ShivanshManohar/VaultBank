using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultBank.Api.BackgroundJobs;
using VaultBank.Api.Common;
using VaultBank.Api.Data;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly VaultBankDbContext _context;

    public AdminController(VaultBankDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<object>>> GetBankOverview()
    {
        var totalCustomers = await _context.Customers.CountAsync();
        var totalSavingsAccounts = await _context.SavingsAccounts.CountAsync();
        var totalSavingsLiabilities = await _context.SavingsAccounts.SumAsync(a => a.Balance);
        var totalActiveFDs = await _context.FixedDeposits.CountAsync(f => f.Status == "Active");
        var totalFDPrincipal = await _context.FixedDeposits.Where(f => f.Status == "Active").SumAsync(f => f.PrincipalAmount);
        var totalProjectedMaturity = await _context.FixedDeposits.Where(f => f.Status == "Active").SumAsync(f => f.ExpectedMaturityAmount);

        var overview = new
        {
            totalCustomers,
            totalSavingsAccounts,
            totalSavingsLiabilities,
            totalActiveFDs,
            totalFDPrincipal,
            totalProjectedMaturity,
            bankReserveRatio = "14.2%"
        };

        return Ok(ApiResponse<object>.Ok(overview));
    }

    [HttpGet("customers")]
    public async Task<ActionResult<ApiResponse<object>>> GetAllCustomers()
    {
        var customers = await _context.Customers
            .Include(c => c.SavingsAccounts)
            .Include(c => c.FixedDeposits)
            .Select(c => new
            {
                c.Id,
                c.CustomerNumber,
                c.FullName,
                c.Email,
                c.PhoneNumber,
                c.KYCStatus,
                TotalSavings = c.SavingsAccounts.Sum(a => a.Balance),
                TotalFDPrincipal = c.FixedDeposits.Where(f => f.Status == "Active").Sum(f => f.PrincipalAmount),
                AccountCount = c.SavingsAccounts.Count,
                ActiveFDCount = c.FixedDeposits.Count(f => f.Status == "Active"),
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(customers));
    }

    [HttpGet("policies")]
    public async Task<ActionResult<ApiResponse<List<BankPolicy>>>> GetPolicies()
    {
        var policies = await _context.BankPolicies.ToListAsync();
        return Ok(ApiResponse<List<BankPolicy>>.Ok(policies));
    }

    [HttpPut("policies/{key}")]
    public async Task<ActionResult<ApiResponse<BankPolicy>>> UpdatePolicy(string key, [FromBody] UpdatePolicyRequest request)
    {
        var policy = await _context.BankPolicies.FirstOrDefaultAsync(p => p.PolicyKey == key);
        if (policy == null)
        {
            return NotFound(ApiResponse<BankPolicy>.Fail("Policy not found."));
        }

        policy.PolicyValue = request.Value;
        policy.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<BankPolicy>.Ok(policy, "Bank policy updated successfully."));
    }

    [HttpPost("processing/settle-maturities")]
    public async Task<ActionResult<ApiResponse<object>>> TriggerMaturityBatch()
    {
        int settledCount = await InterestAccrualBackgroundService.ProcessMaturitiesAsync(_context, triggerType: "ManualAdmin");
        return Ok(ApiResponse<object>.Ok(new { settledContracts = settledCount }, $"Batch completed. {settledCount} matured contracts processed."));
    }

    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponse<List<ProcessingLog>>>> GetProcessingLogs()
    {
        var logs = await _context.ProcessingLogs
            .OrderByDescending(l => l.ExecutedAt)
            .Take(25)
            .ToListAsync();

        return Ok(ApiResponse<List<ProcessingLog>>.Ok(logs));
    }
}

public class UpdatePolicyRequest
{
    public string Value { get; set; } = string.Empty;
}
