# VaultBank — API Documentation Specification

All API endpoints reside under `/api` and adhere to REST conventions. Standardized response envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "errors": null,
  "timestamp": "2026-11-07T10:15:30Z"
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer account with initial customer profile. |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns JWT token, roles, and profile. |
| `GET` | `/api/auth/me` | Bearer | Retrieve current authenticated user profile. |

### Request: `POST /api/auth/login`
```json
{
  "usernameOrEmail": "alex.morgan@vaultbank.com",
  "password": "SecurePassword123!"
}
```

---

## 2. Savings Accounts (`/api/accounts`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/accounts` | Customer | List all savings accounts for the authenticated customer. |
| `GET` | `/api/accounts/{id}` | Customer | Get account details, current balance, and available balance. |
| `GET` | `/api/accounts/{id}/transactions` | Customer | Retrieve paginated transactions with optional category filter. |
| `POST` | `/api/accounts/{id}/deposit` | Customer | Deposit simulated money into account (atomic ledger entry). |
| `POST` | `/api/accounts/{id}/withdraw` | Customer | Withdraw money with available balance verification. |

### Request: `POST /api/accounts/{id}/deposit`
```json
{
  "amount": 25000.00,
  "category": "Salary",
  "description": "Monthly payroll credit"
}
```

---

## 3. Fixed Deposits (`/api/fds`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/fds` | Customer | List active, matured, and closed FDs for customer. |
| `GET` | `/api/fds/{id}` | Customer | Retrieve specific FD schedule, accrued interest, and terms. |
| `POST` | `/api/fds` | Customer | Create fixed deposit (debits source account, creates FD contract). |
| `POST` | `/api/fds/{id}/preview-premature-withdrawal` | Customer | Preview penalty deductions, adjusted interest, and net payout. |
| `POST` | `/api/fds/{id}/premature-withdrawal` | Customer | Execute premature liquidation and credit net proceeds to account. |
| `GET` | `/api/fds/maturities` | Customer | Retrieve upcoming maturity schedule for calendar visualization. |

### Request: `POST /api/fds`
```json
{
  "sourceAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "principalAmount": 50000.00,
  "tenureMonths": 24,
  "interestRate": 7.10,
  "compoundingFrequency": "Quarterly"
}
```

---

## 4. Growth & What-If Simulation (`/api/simulation`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/simulation/fd-growth` | Public/Auth | Compute dynamic growth curve, yearly projections, and breakdown. |
| `POST` | `/api/simulation/compare` | Public/Auth | Compare 2 to 4 scenarios with superimposed growth curves. |
| `POST` | `/api/simulation/fd-ladder` | Public/Auth | Generate multi-tranche FD ladder strategy and maturity timeline. |

### Request: `POST /api/simulation/compare`
```json
{
  "scenarios": [
    { "name": "Conservative 2-Year", "principal": 50000, "tenureMonths": 24, "interestRate": 6.75 },
    { "name": "Growth 5-Year", "principal": 50000, "tenureMonths": 60, "interestRate": 7.50 }
  ]
}
```

---

## 5. Goals & Virtual Earmarks (`/api/goals`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/goals` | Customer | List all savings goals and virtual allocation totals. |
| `POST` | `/api/goals` | Customer | Create savings goal with target date and amount. |
| `POST` | `/api/goals/{id}/allocate` | Customer | Allocate virtual funds (decreases available balance, actual unchanged). |
| `POST` | `/api/goals/{id}/release` | Customer | Release virtual funds back to available balance. |

---

## 6. Financial Intelligence & Journal (`/api/intelligence`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/intelligence/overview` | Customer | Get high-level 4-question summary and wealth distribution. |
| `GET` | `/api/intelligence/monthly-pulse`| Customer | Monthly deposits, withdrawals, net savings, and category trends. |
| `GET` | `/api/intelligence/alerts` | Customer | Retrieve rule-based financial anomaly notifications. |
| `GET` | `/api/intelligence/journal` | Customer | Retrieve monthly historical wealth snapshots. |

---

## 7. VAULT AI Assistant (`/api/ai`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Customer | Stream or return context-aware natural language response. |
| `GET` | `/api/ai/suggestions` | Customer | Context-sensitive suggested prompts for current view. |

### Request: `POST /api/ai/chat`
```json
{
  "prompt": "How much interest will my 50k FD generate, and when does it mature?",
  "activeRoute": "/fixed-deposits",
  "activeEntityId": "optional-fd-id"
}
```

---

## 8. External Financial Data (`/api/external`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/external/indicators` | Public/Auth | Cached public macroeconomic indicators (RBI rates, inflation). |

---

## 9. Administration (`/api/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/overview` | Admin | Aggregate bank metrics, customer count, total balances. |
| `GET` | `/api/admin/customers` | Admin | List all customers with consolidated account balances. |
| `GET` | `/api/admin/policies` | Admin | Get current bank policies and penalty rates. |
| `PUT` | `/api/admin/policies` | Admin | Update product rates and premature penalty formulas. |
| `POST` | `/api/admin/processing/accrue-interest` | Admin | Manually trigger idempotent batch interest accrual. |
| `POST` | `/api/admin/processing/settle-maturities` | Admin | Manually trigger idempotent batch maturity settlements. |
