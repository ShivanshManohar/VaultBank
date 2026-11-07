# VaultBank — System Architecture Document

## 1. Architectural Philosophy
VaultBank is engineered as a **Clean Layered Monolith**. It avoids unnecessary microservice complexity, message brokers, or distributed infrastructure, while strictly adhering to separation of concerns, domain-driven boundaries, and single-responsibility principles.

```text
                                  +-----------------------------+
                                  |   CLIENT BROWSING CLIENTS   |
                                  |    (Desktop / Mobile Web)   |
                                  +--------------+--------------+
                                                 |
                                     HTTPS / JSON / JWT Bearer
                                                 |
                                                 v
+-------------------------------------------------------------------------------------------------+
|                                 REACT + TYPESCRIPT FRONTEND (Vite)                              |
|                                                                                                 |
|   +-------------------+  +--------------------+  +--------------------+  +------------------+   |
|   |   Design System   |  |   Core Banking UI  |  | Wealth Growth Sim  |  |  VAULT AI Drawer |   |
|   | (Obsidian & Gold) |  | (Accounts/FD/Goal) |  | (Curves/Ladder/All)|  |  (Context Aware) |   |
|   +-------------------+  +--------------------+  +--------------------+  +------------------+   |
|                                                                                                 |
|   State & API Layer: Axios Central Client | React Router v6 | Auth Context | Charting Engine   |
+------------------------------------------------+------------------------------------------------+
                                                 |
                                      RESTful API Endpoints
                                                 |
                                                 v
+-------------------------------------------------------------------------------------------------+
|                                 ASP.NET CORE 8 WEB API MONOLITH                                 |
|                                                                                                 |
|  [Presentation Layer]                                                                           |
|   - AuthController            - AccountsController         - FixedDepositsController           |
|   - SimulationController      - GoalsController            - IntelligenceController            |
|   - AiController              - ExternalDataController     - AdminController                   |
|   - Global Exception Handling Middleware & JWT Authentication Filter                            |
|                                                                                                 |
|  [Business Logic / Services Layer]                                                              |
|   - BankingService            - FixedDepositService        - InterestCalculationEngine         |
|   - SimulationService         - GoalService                - FinancialIntelligenceService      |
|   - VaultAiService            - ExternalDataService        - AdminAuditService                 |
|                                                                                                 |
|  [Background Automation]                                                                        |
|   - InterestAccrualBackgroundService (Idempotent Daily/Hourly Schedule & Manual Admin Triggers)|
|                                                                                                 |
|  [Data Access Layer (EF Core)]                                                                  |
|   - VaultBankDbContext (Entity Configurations, Relational Mappings, Audit Shadows)             |
|   - Dual-Provider Support: MS SQL Server (Production/AWS) & SQLite (Zero-Config Local Dev/CI)  |
+------------------------------------------------+------------------------------------------------+
                                                 |
                                      ADO.NET / EF Core Driver
                                                 |
                                                 v
+-------------------------------------------------------------------------------------------------+
|                                     RELATIONAL DATABASE                                         |
|                               (Microsoft SQL Server / SQLite)                                   |
|                                                                                                 |
|  - Users                      - Customers                  - SavingsAccounts                    |
|  - Transactions               - FixedDeposits              - InterestAccruals                   |
|  - SavingsGoals               - GoalAllocations            - WealthSnapshots                    |
|  - BankPolicies               - FDProducts                 - FinancialAlerts                    |
|  - ExternalDataCache          - ProcessingLogs                                                  |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Layer Responsibilities

### 2.1 Presentation Layer (Controllers & Middleware)
- Accepts incoming HTTP requests, enforces JWT Bearer authentication, and verifies claim-based authorizations (`Role = Admin` or `Role = Customer`).
- Maps incoming request DTOs, triggers fluent model validations, and delegates business workflows to services.
- Never directly accesses the database or executes raw SQL queries.
- Translates business results into standardized API responses (`ApiResponse<T>`).
- Centralized `GlobalExceptionMiddleware` intercepts unhandled exceptions, sanitizes error responses for security, and logs detailed diagnostic context.

### 2.2 Service & Business Logic Layer
- Implements core financial rules:
  - Account balance sufficiency verification prior to withdrawals.
  - Quarterly compound interest calculation via `InterestCalculationEngine`.
  - Premature withdrawal penalty computation based on bank policies stored at FD inception.
  - Virtual goal allocations ensuring `AvailableBalance = ActualBalance - TotalGoalAllocations`.
- Enforces strict data ownership: customers can only inspect and transact on accounts belonging to their authenticated identity.

### 2.3 Data Access Layer (Entity Framework Core)
- Implements code-first entities with explicit Fluent API mappings (`OnModelCreating`).
- Uses `DECIMAL(18,2)` precision for all currency fields.
- Implements optimistic concurrency where appropriate to prevent race conditions during simultaneous transactions.
- Uses database transactions (`IDbContextTransaction`) for multi-step atomic operations (e.g., deducting savings balance, creating fixed deposit, logging transaction).

### 2.4 Background Automation Layer
- Hosted background worker `InterestAccrualBackgroundService` implementing `BackgroundService`.
- Executes scheduled checks for eligible compounding periods and matured deposits.
- Guarantees idempotency via unique period keys in `InterestAccruals` and strict state transition checks on `FixedDeposits`.

---

## 3. VAULT AI Architecture & Controlled Tool Execution

VAULT AI operates under a strict **Model-in-the-Loop Read-Only Pattern**. The LLM never communicates with the database directly, never issues financial transactions, and is completely isolated from sensitive credentials.

```text
[Customer Chat Prompt]
         |
         v
[AiController (Extracts Authenticated CustomerId from JWT)]
         |
         v
[VaultAiService (Assembles System Prompt, Page Context & Tool Definitions)]
         |
         v
[Google Gemini API: gemini-2.5-flash-lite]
         |
         +--> [Tool Call Requested: e.g., "GetSavingsSummary", "GetFDPortfolio"]
         |           |
         |           v
         |    [Authorized Tool Execution Engine]
         |    (Fetches customer-scoped sanitized DTOs from BankingService)
         |           |
         |           v
         |    [Sanitized Tool Result returned to Gemini]
         |           |
         |<----------+
         |
         v
[Gemini Generates Final Natural Language Response]
         |
         v
[Response Sanitizer / Validation]
         |
         v
[React UI Chat Drawer (Formatted Markdown, Navigation Actions, Disclaimer)]
```

### Safety & Guardrail Rules
1. **Zero Financial Mutation**: Tools provided to Gemini are strictly read-only (`GetSavingsSummary`, `GetRecentTransactions`, `GetFDPortfolio`, `GetUpcomingMaturities`, `GetGoalProgress`, `GetMonthlyInsights`, `CompareFDScenarios`).
2. **Deterministic Banking Integrity**: The LLM is never tasked with performing compounding math. Financial numbers are supplied by authoritative backend services.
3. **Privacy**: Account numbers are masked (e.g., `•••• 4821`), passwords/tokens/PII are omitted from prompt contexts.
4. **Resilience**: If Gemini is unreachable or exhausts quotas, the service returns a polite fallback message; zero banking workflows are blocked.

---

## 4. Visual Design System Architecture

The frontend visual identity is codified into design tokens:

| Token Name | Value | Purpose |
|---|---|---|
| `bg-obsidian` | `#171717` | Primary dark surface / background |
| `surface-charcoal`| `#292929` | Elevated card & modal backgrounds |
| `text-ivory` | `#E8DFCF` | Primary high-contrast light typography |
| `accent-gold` | `#C5A46D` | Restrained Champagne Gold accent & active states |
| `text-muted` | `#77736B` | Secondary labels & subtle timestamps |
| `status-success`| `#477A60` | Positive yields, deposits, completed goals |
| `status-burgundy`| `#873F4B` | Penalties, withdrawals, critical alerts |

Typographic hierarchy couples an editorial serif (`Playfair Display` / `Cinzel` / `Cormorant Garamond`) for hero statements and monetary figures with a geometric sans-serif (`Inter` / `Plus Jakarta Sans`) for interface controls and data grids.
