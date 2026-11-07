using VaultBank.Api.Models.Entities;
using VaultBank.Api.Services;

namespace VaultBank.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(VaultBankDbContext context)
    {
        // Check if database is already seeded
        if (context.Users.Any())
        {
            return;
        }

        // 1. Seed Bank Policies
        var penaltyPolicy = new BankPolicy
        {
            PolicyKey = "PrematureWithdrawalPenaltyRate",
            PolicyValue = "1.00",
            Description = "Percentage deducted from contractual interest rate upon premature liquidation.",
            EffectiveFrom = DateTime.UtcNow.AddYears(-1)
        };
        var minFDAmountPolicy = new BankPolicy
        {
            PolicyKey = "MinFixedDepositPrincipal",
            PolicyValue = "5000.00",
            Description = "Minimum principal threshold to create a Fixed Deposit contract.",
            EffectiveFrom = DateTime.UtcNow.AddYears(-1)
        };
        context.BankPolicies.AddRange(penaltyPolicy, minFDAmountPolicy);

        // 2. Seed FD Products
        var fdProducts = new List<FDProduct>
        {
            new() { Name = "Vault Apex 12M", MinTenureMonths = 12, MaxTenureMonths = 12, MinPrincipal = 5000m, InterestRate = 6.80m, CompoundingFrequency = "Quarterly", IsActive = true },
            new() { Name = "Vault Sovereign 24M", MinTenureMonths = 24, MaxTenureMonths = 24, MinPrincipal = 10000m, InterestRate = 7.25m, CompoundingFrequency = "Quarterly", IsActive = true },
            new() { Name = "Vault Dynasty 36M", MinTenureMonths = 36, MaxTenureMonths = 36, MinPrincipal = 15000m, InterestRate = 7.50m, CompoundingFrequency = "Quarterly", IsActive = true },
            new() { Name = "Vault Century 60M", MinTenureMonths = 60, MaxTenureMonths = 60, MinPrincipal = 25000m, InterestRate = 7.75m, CompoundingFrequency = "Quarterly", IsActive = true }
        };
        context.FDProducts.AddRange(fdProducts);

        // 3. Seed Administrator
        string adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("VaultAdmin@2026!");
        var adminUser = new User
        {
            Username = "marcus.admin",
            Email = "marcus.admin@vaultbank.com",
            PasswordHash = adminPasswordHash,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow.AddMonths(-6)
        };
        context.Users.Add(adminUser);

        // 4. Seed Primary Demo Customer (Alex Morgan)
        string customerPasswordHash = BCrypt.Net.BCrypt.HashPassword("Vault@2026!");
        var alexUser = new User
        {
            Username = "alex.morgan",
            Email = "alex.morgan@vaultbank.com",
            PasswordHash = customerPasswordHash,
            Role = "Customer",
            CreatedAt = DateTime.UtcNow.AddMonths(-5)
        };
        context.Users.Add(alexUser);

        var alexCustomer = new Customer
        {
            User = alexUser,
            CustomerNumber = "VB-CUST-104921",
            FullName = "Alex Morgan",
            Email = "alex.morgan@vaultbank.com",
            PhoneNumber = "+91 98765 43210",
            KYCStatus = "Verified",
            CreatedAt = DateTime.UtcNow.AddMonths(-5)
        };
        context.Customers.Add(alexCustomer);

        // Alex's Savings Accounts
        var primaryAccount = new SavingsAccount
        {
            Customer = alexCustomer,
            AccountNumber = "VB-SAV-88029144",
            AccountType = "Premium Tier Reserve",
            Balance = 185000.00m,
            AvailableBalance = 160000.00m, // 25,000 earmarked for emergency goal
            Currency = "INR",
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddMonths(-5)
        };

        var highYieldAccount = new SavingsAccount
        {
            Customer = alexCustomer,
            AccountNumber = "VB-SAV-88029199",
            AccountType = "High-Yield Liquid Flex",
            Balance = 75000.00m,
            AvailableBalance = 75000.00m,
            Currency = "INR",
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddMonths(-3)
        };
        context.SavingsAccounts.AddRange(primaryAccount, highYieldAccount);

        // Alex's Realistic Transaction History
        var now = DateTime.UtcNow;
        var transactions = new List<Transaction>
        {
            new() { Account = primaryAccount, TransactionReference = "TXN-20260101-01", Type = "Deposit", Amount = 150000m, BalanceAfter = 150000m, Category = "Salary", Description = "Executive Remuneration", TransactionDate = now.AddDays(-60) },
            new() { Account = primaryAccount, TransactionReference = "TXN-20260105-02", Type = "Withdrawal", Amount = 12500m, BalanceAfter = 137500m, Category = "Shopping", Description = "Harrods London Boutique", TransactionDate = now.AddDays(-50) },
            new() { Account = primaryAccount, TransactionReference = "TXN-20260112-03", Type = "Withdrawal", Amount = 4800m, BalanceAfter = 132700m, Category = "Food", Description = "Bespoke Dining Experience", TransactionDate = now.AddDays(-42) },
            new() { Account = primaryAccount, TransactionReference = "TXN-20260128-04", Type = "Withdrawal", Amount = 7200m, BalanceAfter = 125500m, Category = "Utilities", Description = "High-Speed Fiber & Cloud Hosting", TransactionDate = now.AddDays(-30) },
            new() { Account = primaryAccount, TransactionReference = "TXN-20260201-05", Type = "Deposit", Amount = 85000m, BalanceAfter = 210500m, Category = "Salary", Description = "Direct Advisory Dividend", TransactionDate = now.AddDays(-20) },
            new() { Account = primaryAccount, TransactionReference = "TXN-20260215-06", Type = "Withdrawal", Amount = 25500m, BalanceAfter = 185000m, Category = "Travel", Description = "First Class Regional Flight", TransactionDate = now.AddDays(-7) }
        };
        context.Transactions.AddRange(transactions);

        // Alex's Fixed Deposits
        // FD 1: ₹50,000 for 24 months @ 7.25% (Created 6 months ago, matures in 18 months)
        decimal fd1Principal = 50000m;
        decimal fd1Rate = 7.25m;
        int fd1Tenure = 24;
        decimal fd1Maturity = InterestCalculationEngine.CalculateMaturityAmount(fd1Principal, fd1Rate, 4, fd1Tenure);

        var fd1 = new FixedDeposit
        {
            Customer = alexCustomer,
            SourceAccount = primaryAccount,
            FDNumber = "VB-FD-770142",
            PrincipalAmount = fd1Principal,
            InterestRate = fd1Rate,
            CompoundingFrequency = "Quarterly",
            TenureMonths = fd1Tenure,
            StartDate = now.AddMonths(-6),
            MaturityDate = now.AddMonths(18),
            ExpectedMaturityAmount = fd1Maturity,
            AccruedInterest = InterestCalculationEngine.CalculateTotalInterest(fd1Principal, fd1Rate, 4, 6),
            Status = "Active"
        };

        // FD 2: ₹100,000 for 36 months @ 7.50% (Created 12 months ago, matures in 24 months)
        decimal fd2Principal = 100000m;
        decimal fd2Rate = 7.50m;
        int fd2Tenure = 36;
        decimal fd2Maturity = InterestCalculationEngine.CalculateMaturityAmount(fd2Principal, fd2Rate, 4, fd2Tenure);

        var fd2 = new FixedDeposit
        {
            Customer = alexCustomer,
            SourceAccount = primaryAccount,
            FDNumber = "VB-FD-770198",
            PrincipalAmount = fd2Principal,
            InterestRate = fd2Rate,
            CompoundingFrequency = "Quarterly",
            TenureMonths = fd2Tenure,
            StartDate = now.AddMonths(-12),
            MaturityDate = now.AddMonths(24),
            ExpectedMaturityAmount = fd2Maturity,
            AccruedInterest = InterestCalculationEngine.CalculateTotalInterest(fd2Principal, fd2Rate, 4, 12),
            Status = "Active"
        };
        context.FixedDeposits.AddRange(fd1, fd2);

        // Alex's Savings Goals (Virtual Earmarks)
        var goal1 = new SavingsGoal
        {
            Customer = alexCustomer,
            Account = primaryAccount,
            Title = "Emergency Liquidity Shield",
            Category = "Emergency Fund",
            TargetAmount = 100000.00m,
            AllocatedAmount = 25000.00m,
            TargetDate = now.AddMonths(6),
            Status = "InProgress",
            CreatedAt = now.AddMonths(-3)
        };
        var goal1Allocation = new GoalAllocation
        {
            Goal = goal1,
            Amount = 25000.00m,
            AllocationDate = now.AddMonths(-3),
            Notes = "Initial capital reserve allocation"
        };
        context.SavingsGoals.Add(goal1);
        context.GoalAllocations.Add(goal1Allocation);

        // Alex's Wealth Snapshots (Journal)
        var snapshotPrev1 = new WealthSnapshot
        {
            Customer = alexCustomer,
            SnapshotYear = now.Year,
            SnapshotMonth = Math.Max(1, now.Month - 1),
            OpeningSavings = 160000m,
            ClosingSavings = 185000m,
            TotalFDPrincipal = 150000m,
            TotalAccruedInterest = 12450m,
            TotalDeposits = 85000m,
            TotalWithdrawals = 37500m,
            MonthlySavingsRate = 55.88m,
            GeneratedAt = now.AddDays(-15)
        };
        context.WealthSnapshots.Add(snapshotPrev1);

        // Alex's Financial Alerts
        var alert1 = new FinancialAlert
        {
            Customer = alexCustomer,
            AlertType = "MaturityUpcoming",
            Severity = "Info",
            Title = "Fixed Deposit Semi-Annual Progress",
            Message = "Your deposit VB-FD-770142 has completed 6 months of compounding. Accrued yield: ₹1,834.00.",
            IsRead = false,
            CreatedAt = now.AddDays(-3)
        };
        context.FinancialAlerts.Add(alert1);

        // 5. Seed External Macroeconomic Data Cache
        var rbiCache = new ExternalDataCache
        {
            Source = "RBI",
            Key = "MacroEconomicIndicators",
            DataPayloadJson = "{\"repoRate\": 6.50, \"inflationRate\": 4.85, \"reverseRepoRate\": 3.35, \"source\": \"Reserve Bank of India Bulletin\", \"lastUpdated\": \"" + now.ToString("yyyy-MM-ddTHH:mm:ssZ") + "\"}",
            RetrievedAt = now,
            ExpiresAt = now.AddHours(24)
        };
        context.ExternalDataCache.Add(rbiCache);

        await context.SaveChangesAsync();
    }
}
