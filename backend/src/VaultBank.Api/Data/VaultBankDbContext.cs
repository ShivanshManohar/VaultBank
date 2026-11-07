using Microsoft.EntityFrameworkCore;
using VaultBank.Api.Models.Entities;

namespace VaultBank.Api.Data;

public class VaultBankDbContext : DbContext
{
    public VaultBankDbContext(DbContextOptions<VaultBankDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<FixedDeposit> FixedDeposits => Set<FixedDeposit>();
    public DbSet<InterestAccrual> InterestAccruals => Set<InterestAccrual>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<GoalAllocation> GoalAllocations => Set<GoalAllocation>();
    public DbSet<WealthSnapshot> WealthSnapshots => Set<WealthSnapshot>();
    public DbSet<BankPolicy> BankPolicies => Set<BankPolicy>();
    public DbSet<FDProduct> FDProducts => Set<FDProduct>();
    public DbSet<FinancialAlert> FinancialAlerts => Set<FinancialAlert>();
    public DbSet<ExternalDataCache> ExternalDataCache => Set<ExternalDataCache>();
    public DbSet<ProcessingLog> ProcessingLogs => Set<ProcessingLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Users & Customers ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(c => c.CustomerNumber).IsUnique();
            entity.HasOne(c => c.User)
                  .WithOne(u => u.Customer)
                  .HasForeignKey<Customer>(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Savings Accounts & Transactions ---
        modelBuilder.Entity<SavingsAccount>(entity =>
        {
            entity.HasIndex(a => a.AccountNumber).IsUnique();
            entity.Property(a => a.Balance).HasPrecision(18, 2);
            entity.Property(a => a.AvailableBalance).HasPrecision(18, 2);

            entity.HasOne(a => a.Customer)
                  .WithMany(c => c.SavingsAccounts)
                  .HasForeignKey(a => a.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasIndex(t => t.TransactionReference).IsUnique();
            entity.HasIndex(t => new { t.AccountId, t.TransactionDate });
            entity.Property(t => t.Amount).HasPrecision(18, 2);
            entity.Property(t => t.BalanceAfter).HasPrecision(18, 2);

            entity.HasOne(t => t.Account)
                  .WithMany(a => a.Transactions)
                  .HasForeignKey(t => t.AccountId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Fixed Deposits & Interest Accruals ---
        modelBuilder.Entity<FixedDeposit>(entity =>
        {
            entity.HasIndex(fd => fd.FDNumber).IsUnique();
            entity.HasIndex(fd => new { fd.CustomerId, fd.Status });
            entity.HasIndex(fd => new { fd.Status, fd.MaturityDate });

            entity.Property(fd => fd.PrincipalAmount).HasPrecision(18, 2);
            entity.Property(fd => fd.InterestRate).HasPrecision(5, 2);
            entity.Property(fd => fd.ExpectedMaturityAmount).HasPrecision(18, 2);
            entity.Property(fd => fd.ActualSettledAmount).HasPrecision(18, 2);
            entity.Property(fd => fd.AccruedInterest).HasPrecision(18, 2);
            entity.Property(fd => fd.PenaltyDeducted).HasPrecision(18, 2);
            entity.Property(fd => fd.PenaltyRateApplied).HasPrecision(5, 2);

            entity.HasOne(fd => fd.Customer)
                  .WithMany(c => c.FixedDeposits)
                  .HasForeignKey(fd => fd.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(fd => fd.SourceAccount)
                  .WithMany(a => a.FundedFixedDeposits)
                  .HasForeignKey(fd => fd.SourceAccountId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(fd => fd.PayoutAccount)
                  .WithMany()
                  .HasForeignKey(fd => fd.PayoutAccountId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InterestAccrual>(entity =>
        {
            entity.Property(ia => ia.AccrualAmount).HasPrecision(18, 2);
            entity.Property(ia => ia.CumulativeInterest).HasPrecision(18, 2);
            entity.HasIndex(ia => new { ia.FixedDepositId, ia.PeriodIndex }).IsUnique();

            entity.HasOne(ia => ia.FixedDeposit)
                  .WithMany(fd => fd.InterestAccruals)
                  .HasForeignKey(ia => ia.FixedDepositId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Savings Goals & Allocations ---
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.Property(g => g.TargetAmount).HasPrecision(18, 2);
            entity.Property(g => g.AllocatedAmount).HasPrecision(18, 2);

            entity.HasOne(g => g.Customer)
                  .WithMany(c => c.SavingsGoals)
                  .HasForeignKey(g => g.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(g => g.Account)
                  .WithMany(a => a.EarmarkedGoals)
                  .HasForeignKey(g => g.AccountId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoalAllocation>(entity =>
        {
            entity.Property(ga => ga.Amount).HasPrecision(18, 2);

            entity.HasOne(ga => ga.Goal)
                  .WithMany(g => g.Allocations)
                  .HasForeignKey(ga => ga.GoalId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Wealth Snapshots ---
        modelBuilder.Entity<WealthSnapshot>(entity =>
        {
            entity.HasIndex(ws => new { ws.CustomerId, ws.SnapshotYear, ws.SnapshotMonth }).IsUnique();
            entity.Property(ws => ws.OpeningSavings).HasPrecision(18, 2);
            entity.Property(ws => ws.ClosingSavings).HasPrecision(18, 2);
            entity.Property(ws => ws.TotalFDPrincipal).HasPrecision(18, 2);
            entity.Property(ws => ws.TotalAccruedInterest).HasPrecision(18, 2);
            entity.Property(ws => ws.TotalDeposits).HasPrecision(18, 2);
            entity.Property(ws => ws.TotalWithdrawals).HasPrecision(18, 2);
            entity.Property(ws => ws.MonthlySavingsRate).HasPrecision(5, 2);

            entity.HasOne(ws => ws.Customer)
                  .WithMany(c => c.WealthSnapshots)
                  .HasForeignKey(ws => ws.CustomerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Bank Policies & Products ---
        modelBuilder.Entity<BankPolicy>(entity =>
        {
            entity.HasIndex(bp => bp.PolicyKey).IsUnique();
        });

        modelBuilder.Entity<FDProduct>(entity =>
        {
            entity.Property(p => p.MinPrincipal).HasPrecision(18, 2);
            entity.Property(p => p.InterestRate).HasPrecision(5, 2);
        });

        // --- External Data & Logs ---
        modelBuilder.Entity<ExternalDataCache>(entity =>
        {
            entity.HasIndex(ed => ed.Key).IsUnique();
        });
    }
}
