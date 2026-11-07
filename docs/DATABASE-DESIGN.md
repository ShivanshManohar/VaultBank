# VaultBank — Relational Database Design Specification

## 1. Schema Overview & Entity Relationships

The VaultBank database is designed for **Microsoft SQL Server** using **Entity Framework Core**, with `DECIMAL(18,2)` precision for all financial figures.

```mermaid
erDiagram
    USERS ||--|| CUSTOMERS : "authenticates"
    CUSTOMERS ||--o{ SAVINGS_ACCOUNTS : "owns"
    CUSTOMERS ||--o{ FIXED_DEPOSITS : "holds"
    CUSTOMERS ||--o{ SAVINGS_GOALS : "defines"
    CUSTOMERS ||--o{ WEALTH_SNAPSHOTS : "snapshots"
    CUSTOMERS ||--o{ FINANCIAL_ALERTS : "receives"
    
    SAVINGS_ACCOUNTS ||--o{ TRANSACTIONS : "logs"
    SAVINGS_ACCOUNTS ||--o{ FIXED_DEPOSITS : "funds / settles"
    SAVINGS_ACCOUNTS ||--o{ SAVINGS_GOALS : "earmarks"
    
    FIXED_DEPOSITS ||--o{ INTEREST_ACCRUALS : "accrues"
    SAVINGS_GOALS ||--o{ GOAL_ALLOCATIONS : "allocates"
    
    USERS {
        guid Id PK
        string Username UK
        string Email UK
        string PasswordHash
        string Role
        datetime CreatedAt
        bool IsActive
    }

    CUSTOMERS {
        guid Id PK
        guid UserId FK, UK
        string CustomerNumber UK
        string FullName
        string Email
        string PhoneNumber
        string KYCStatus
        datetime CreatedAt
    }

    SAVINGS_ACCOUNTS {
        guid Id PK
        guid CustomerId FK
        string AccountNumber UK
        string AccountType
        decimal Balance
        decimal AvailableBalance
        string Currency
        string Status
        datetime CreatedAt
        datetime UpdatedAt
    }

    TRANSACTIONS {
        guid Id PK
        guid AccountId FK
        string TransactionReference UK
        string Type
        decimal Amount
        decimal BalanceAfter
        string Category
        string Description
        datetime TransactionDate
        string Status
    }

    FIXED_DEPOSITS {
        guid Id PK
        guid CustomerId FK
        guid SourceAccountId FK
        guid PayoutAccountId FK
        string FDNumber UK
        decimal PrincipalAmount
        decimal InterestRate
        string CompoundingFrequency
        int TenureMonths
        datetime StartDate
        datetime MaturityDate
        decimal ExpectedMaturityAmount
        decimal ActualSettledAmount
        decimal AccruedInterest
        decimal PenaltyDeducted
        string Status
        datetime CreatedAt
        datetime ClosedAt
    }

    INTEREST_ACCRUALS {
        guid Id PK
        guid FixedDepositId FK
        datetime AccrualDate
        decimal AccrualAmount
        decimal CumulativeInterest
        int PeriodIndex
        bool IsSettled
        datetime SettledDate
    }

    SAVINGS_GOALS {
        guid Id PK
        guid CustomerId FK
        guid AccountId FK
        string Title
        string Category
        decimal TargetAmount
        decimal AllocatedAmount
        datetime TargetDate
        string Status
        datetime CreatedAt
    }

    GOAL_ALLOCATIONS {
        guid Id PK
        guid GoalId FK
        decimal Amount
        datetime AllocationDate
        string Notes
    }

    WEALTH_SNAPSHOTS {
        guid Id PK
        guid CustomerId FK
        int SnapshotYear
        int SnapshotMonth
        decimal OpeningSavings
        decimal ClosingSavings
        decimal TotalFDPrincipal
        decimal TotalAccruedInterest
        decimal TotalDeposits
        decimal TotalWithdrawals
        decimal MonthlySavingsRate
        datetime GeneratedAt
    }

    BANK_POLICIES {
        guid Id PK
        string PolicyKey UK
        string PolicyValue
        string Description
        datetime EffectiveFrom
        datetime UpdatedAt
    }

    FD_PRODUCTS {
        guid Id PK
        string Name
        int MinTenureMonths
        int MaxTenureMonths
        decimal MinPrincipal
        decimal InterestRate
        string CompoundingFrequency
        bool IsActive
    }

    FINANCIAL_ALERTS {
        guid Id PK
        guid CustomerId FK
        string AlertType
        string Severity
        string Title
        string Message
        bool IsRead
        datetime CreatedAt
    }

    PROCESSING_LOGS {
        guid Id PK
        string JobName
        string TriggerType
        string Status
        int RecordsProcessed
        string DetailsJson
        datetime ExecutedAt
    }

    EXTERNAL_DATA_CACHE {
        guid Id PK
        string Source
        string Key UK
        string DataPayloadJson
        datetime RetrievedAt
        datetime ExpiresAt
    }
```

---

## 2. Table Schemas & Constraints

### 2.1 USERS & CUSTOMERS
- `Users.Role`: Constrained to `'Customer'` or `'Admin'`.
- `Customers.CustomerNumber`: Formatted as `VB-CUST-XXXXXX`, indexed and unique.

### 2.2 SAVINGS_ACCOUNTS & TRANSACTIONS
- `Balance`: Must satisfy `Balance >= 0.00` check constraint.
- `AvailableBalance`: Computed or maintained as `Balance - SUM(Active Goal Allocations)`.
- `Transactions.Type`: Enum/String: `'Deposit'`, `'Withdrawal'`, `'InterestCredit'`, `'FDFunding'`, `'FDSettlement'`, `'FDPenalty'`.
- Index on `(AccountId, TransactionDate DESC)` for fast ledger queries.

### 2.3 FIXED_DEPOSITS
- `Status`: Enforced state transitions: `'Active'` -> `'Matured'` -> `'Settled'` or `'PrematurelyClosed'`.
- `PrincipalAmount`: Minimum investment validation constraint (e.g., $\ge ₹1,000$).
- Index on `(CustomerId, Status)` and `(Status, MaturityDate)` for rapid settlement batch lookups.

---

## 3. High-Performance SQL Queries

### 3.1 Customer-Wise Deposit & Wealth Summary
```sql
SELECT 
    c.Id AS CustomerId,
    c.CustomerNumber,
    c.FullName,
    ISNULL(SUM(sa.Balance), 0.00) AS TotalSavingsBalance,
    ISNULL(SUM(sa.AvailableBalance), 0.00) AS TotalAvailableBalance,
    ISNULL(fd.TotalFDPrincipal, 0.00) AS TotalActiveFDPrincipal,
    ISNULL(fd.TotalExpectedMaturity, 0.00) AS ProjectedFDMaturityValue,
    ISNULL(SUM(sa.Balance), 0.00) + ISNULL(fd.TotalFDPrincipal, 0.00) AS TotalNetWorth
FROM Customers c
LEFT JOIN SavingsAccounts sa ON c.Id = sa.CustomerId AND sa.Status = 'Active'
LEFT JOIN (
    SELECT 
        CustomerId,
        SUM(PrincipalAmount) AS TotalFDPrincipal,
        SUM(ExpectedMaturityAmount) AS TotalExpectedMaturity
    FROM FixedDeposits
    WHERE Status = 'Active'
    GROUP BY CustomerId
) fd ON c.Id = fd.CustomerId
GROUP BY c.Id, c.CustomerNumber, c.FullName, fd.TotalFDPrincipal, fd.TotalExpectedMaturity;
```

### 3.2 Monthly Spending Category Breakdown
```sql
SELECT 
    t.Category,
    COUNT(t.Id) AS TransactionCount,
    SUM(t.Amount) AS TotalSpent,
    ROUND(SUM(t.Amount) * 100.0 / SUM(SUM(t.Amount)) OVER(), 2) AS PercentageOfTotal
FROM Transactions t
INNER JOIN SavingsAccounts sa ON t.AccountId = sa.Id
WHERE sa.CustomerId = @CustomerId
  AND t.Type = 'Withdrawal'
  AND t.TransactionDate >= @MonthStart
  AND t.TransactionDate < @MonthEnd
GROUP BY t.Category
ORDER BY TotalSpent DESC;
```

### 3.3 Upcoming FD Maturity Payouts
```sql
SELECT 
    fd.Id AS FDId,
    fd.FDNumber,
    c.FullName AS CustomerName,
    fd.PrincipalAmount,
    fd.InterestRate,
    fd.MaturityDate,
    fd.ExpectedMaturityAmount,
    DATEDIFF(day, GETUTCDATE(), fd.MaturityDate) AS DaysUntilMaturity
FROM FixedDeposits fd
INNER JOIN Customers c ON fd.CustomerId = c.Id
WHERE fd.Status = 'Active'
  AND fd.MaturityDate >= GETUTCDATE()
ORDER BY fd.MaturityDate ASC;
```
