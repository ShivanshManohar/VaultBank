using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VaultBank.Api.Common;
using VaultBank.Api.Data;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly VaultBankDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(VaultBankDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Username == request.UsernameOrEmail || u.Email == request.UsernameOrEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(ApiResponse<AuthResponse>.Fail("Invalid credentials provided."));
        }

        if (!user.IsActive)
        {
            return StatusCode(403, ApiResponse<AuthResponse>.Fail("User account is currently deactivated."));
        }

        string token = GenerateJwtToken(user);

        var response = new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            FullName = user.Customer?.FullName ?? user.Username,
            CustomerNumber = user.Customer?.CustomerNumber ?? "ADMIN",
            Role = user.Role,
            CustomerId = user.Customer?.Id ?? Guid.Empty
        };

        return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successful."));
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(ApiResponse<AuthResponse>.Fail("Username is already taken."));
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(ApiResponse<AuthResponse>.Fail("Email is already registered."));
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);

        var customer = new Customer
        {
            User = user,
            CustomerNumber = "VB-CUST-" + Random.Shared.Next(100000, 999999),
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            KYCStatus = "Verified",
            CreatedAt = DateTime.UtcNow
        };
        _context.Customers.Add(customer);

        // Create standard primary savings account with starting balance
        var primaryAccount = new SavingsAccount
        {
            Customer = customer,
            AccountNumber = "VB-SAV-" + Random.Shared.Next(10000000, 99999999),
            AccountType = "Standard Savings Reserve",
            Balance = 50000.00m,
            AvailableBalance = 50000.00m,
            Currency = "INR",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _context.SavingsAccounts.Add(primaryAccount);

        var initialTxn = new Transaction
        {
            Account = primaryAccount,
            TransactionReference = "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-INIT",
            Type = "Deposit",
            Amount = 50000.00m,
            BalanceAfter = 50000.00m,
            Category = "Salary",
            Description = "Welcome promotional deposit",
            TransactionDate = DateTime.UtcNow,
            Status = "Completed"
        };
        _context.Transactions.Add(initialTxn);

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        string token = GenerateJwtToken(user);

        var response = new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            FullName = customer.FullName,
            CustomerNumber = customer.CustomerNumber,
            Role = user.Role,
            CustomerId = customer.Id
        };

        return Ok(ApiResponse<AuthResponse>.Ok(response, "Registration successful. Welcome to VaultBank."));
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSecret = _config["JWT:Key"] ?? "VaultBank_UltraSecure_SuperSecretMasterKey_2026!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("CustomerId", user.Customer?.Id.ToString() ?? string.Empty)
        };

        var token = new JwtSecurityToken(
            issuer: _config["JWT:Issuer"] ?? "VaultBank",
            audience: _config["JWT:Audience"] ?? "VaultBankClients",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
