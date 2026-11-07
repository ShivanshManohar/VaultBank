using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Data;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.BackgroundJobs;

public class InterestAccrualBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InterestAccrualBackgroundService> _logger;

    public InterestAccrualBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<InterestAccrualBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VaultBank Interest Accrual and Settlement Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<VaultBankDbContext>();

                await ProcessMaturitiesAsync(context, triggerType: "AutomatedSchedule");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during automated interest and maturity batch cycle.");
            }

            // Runs every 4 hours in production; delay 1 hour for background check
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    public static async Task<int> ProcessMaturitiesAsync(VaultBankDbContext context, string triggerType = "ManualAdmin")
    {
        var now = DateTime.UtcNow;

        // Idempotency: Query strictly selects Active deposits whose maturity date is in the past
        var eligibleFDs = await context.FixedDeposits
            .Include(f => f.SourceAccount)
            .Where(f => f.Status == "Active" && f.MaturityDate <= now)
            .ToListAsync();

        if (eligibleFDs.Count == 0)
        {
            return 0;
        }

        int processedCount = 0;

        foreach (var fd in eligibleFDs)
        {
            using var tx = await context.Database.BeginTransactionAsync();

            var account = fd.SourceAccount ?? await context.SavingsAccounts.FirstOrDefaultAsync(a => a.Id == fd.SourceAccountId);
            if (account == null)
            {
                continue;
            }

            // Credit principal + compounded interest
            account.Balance += fd.ExpectedMaturityAmount;
            account.AvailableBalance += fd.ExpectedMaturityAmount;
            account.UpdatedAt = now;

            // Transition state to prevent duplicate processing
            fd.Status = "Matured";
            fd.ActualSettledAmount = fd.ExpectedMaturityAmount;
            fd.SettledAt = now;

            // Log settlement transaction in customer ledger
            var settlementTxn = new Transaction
            {
                AccountId = account.Id,
                TransactionReference = "TXN-" + now.ToString("yyyyMMddHHmmss") + "-MAT" + fd.FDNumber[^4..],
                Type = "FDSettlement",
                Amount = fd.ExpectedMaturityAmount,
                BalanceAfter = account.Balance,
                Category = "Transfers",
                Description = $"Contractual Maturity Settlement for FD {fd.FDNumber}",
                TransactionDate = now,
                Status = "Completed"
            };
            context.Transactions.Add(settlementTxn);

            await context.SaveChangesAsync();
            await tx.CommitAsync();

            processedCount++;
        }

        // Record audit processing log
        var log = new ProcessingLog
        {
            JobName = "MaturitySettlement",
            TriggerType = triggerType,
            Status = "Success",
            RecordsProcessed = processedCount,
            DetailsJson = $"{{\"maturedContractsSettled\": {processedCount}, \"processedAt\": \"{now:O}\"}}",
            ExecutedAt = now
        };
        context.ProcessingLogs.Add(log);
        await context.SaveChangesAsync();

        return processedCount;
    }
}
