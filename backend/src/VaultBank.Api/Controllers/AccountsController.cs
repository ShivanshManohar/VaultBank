using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultBank.Api.Common;
using VaultBank.Api.Models.DTOs;
using VaultBank.Api.Services;

namespace VaultBank.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AccountsController : BaseApiController
{
    private readonly BankingService _bankingService;

    public AccountsController(BankingService bankingService)
    {
        _bankingService = bankingService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SavingsAccountResponse>>>> GetAccounts()
    {
        var customerId = GetAuthenticatedCustomerId();
        var accounts = await _bankingService.GetCustomerAccountsAsync(customerId);
        return Ok(ApiResponse<List<SavingsAccountResponse>>.Ok(accounts));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SavingsAccountResponse>>> GetAccountById(Guid id)
    {
        var customerId = GetAuthenticatedCustomerId();
        var account = await _bankingService.GetAccountByIdAsync(id, customerId);
        if (account == null)
        {
            return NotFound(ApiResponse<SavingsAccountResponse>.Fail("Account not found."));
        }
        return Ok(ApiResponse<SavingsAccountResponse>.Ok(account));
    }

    [HttpPost("{id}/deposit")]
    public async Task<ActionResult<ApiResponse<TransactionResponse>>> Deposit(Guid id, [FromBody] DepositRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var txn = await _bankingService.DepositAsync(id, customerId, request);
        return Ok(ApiResponse<TransactionResponse>.Ok(txn, "Simulated deposit credited successfully."));
    }

    [HttpPost("{id}/withdraw")]
    public async Task<ActionResult<ApiResponse<TransactionResponse>>> Withdraw(Guid id, [FromBody] WithdrawalRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var txn = await _bankingService.WithdrawAsync(id, customerId, request);
        return Ok(ApiResponse<TransactionResponse>.Ok(txn, "Simulated withdrawal processed successfully."));
    }

    [HttpGet("{id}/transactions")]
    public async Task<ActionResult<ApiResponse<List<TransactionResponse>>>> GetTransactions(
        Guid id,
        [FromQuery] int limit = 50,
        [FromQuery] string? category = null)
    {
        var customerId = GetAuthenticatedCustomerId();
        var txns = await _bankingService.GetAccountTransactionsAsync(id, customerId, limit, category);
        return Ok(ApiResponse<List<TransactionResponse>>.Ok(txns));
    }
}
