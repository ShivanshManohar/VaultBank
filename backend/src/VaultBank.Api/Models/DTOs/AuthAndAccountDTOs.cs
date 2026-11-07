using System.ComponentModel.DataAnnotations;

namespace VaultBank.Api.Models.DTOs;

public class RegisterRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CustomerNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
}

public class SavingsAccountResponse
{
    public Guid Id { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal EarmarkedAmount => Balance - AvailableBalance;
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}

public class DepositRequest
{
    [Required]
    [Range(1.0, 10000000.0, ErrorMessage = "Deposit amount must be positive and within valid range.")]
    public decimal Amount { get; set; }

    public string Category { get; set; } = "Salary";

    [StringLength(255)]
    public string Description { get; set; } = "Simulated deposit";
}

public class WithdrawalRequest
{
    [Required]
    [Range(1.0, 10000000.0, ErrorMessage = "Withdrawal amount must be positive and within valid range.")]
    public decimal Amount { get; set; }

    public string Category { get; set; } = "Other";

    [StringLength(255)]
    public string Description { get; set; } = "Simulated withdrawal";
}

public class TransactionResponse
{
    public Guid Id { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
