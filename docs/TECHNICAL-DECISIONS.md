# VaultBank — Technical Architecture Decisions (ADRs)

## ADR-001: Architectural Pattern — Clean Layered Monolith
- **Status:** Accepted
- **Context:** VaultBank is an educational digital banking and wealth intelligence application targeting high code quality, clear domain logic, and seamless local developer experience within a 2-week timeline.
- **Decision:** Build as an ASP.NET Core 8 Web API Clean Layered Monolith (Presentation -> Application/Services -> Domain/Entities -> Infrastructure/EF Core) coupled to a modern React + TypeScript single-page application.
- **Rationale:** Avoids the operational overhead, network latency, distributed transaction failure modes, and deployment complexity of microservices (Kafka, service meshes, Kubernetes) while preserving strict modular boundaries and maintainability.

---

## ADR-002: Monetary Precision & Arithmetic Safety
- **Status:** Accepted
- **Context:** Financial applications must avoid IEEE 754 floating-point rounding inaccuracies (e.g., `0.1 + 0.2 != 0.3`).
- **Decision:** Strictly enforce C# `decimal` across all backend services, DTOs, and calculation engines. In the database, all monetary columns are defined as `DECIMAL(18,2)`.
- **Consequences:** Eliminates cumulative rounding errors in compounding, interest accrual, penalty calculations, and balance reconciliations.

---

## ADR-003: Fixed Deposit Compounding Engine & Invariant
- **Status:** Accepted
- **Context:** Fixed deposits calculate interest using compound formulas that can vary by institution. A canonical standard is required.
- **Decision:** Standardize on quarterly compounding ($n=4$) as the default commercial banking baseline:
  $$A = P \left(1 + \frac{r}{n}\right)^{nt}$$
  Where:
  - $P$ = Principal (`decimal`)
  - $r$ = Annual interest rate in decimal form (e.g., $0.07$ for $7.0\%$)
  - $n$ = Compounding frequency per year ($4$ for quarterly)
  - $t$ = Tenure in fractional years ($\text{TenureMonths} / 12.0$)
  - $A$ = Projected maturity value
- **Rule:** The calculation engine lives purely on the backend. The frontend simulator calls the backend calculation API or executes identical verified math for instant feedback, but all confirmed FD contracts are computed authoritatively by the backend.

---

## ADR-004: Virtual Goal Allocations vs. Ledger Sub-Accounts
- **Status:** Accepted
- **Context:** Users desire goal tracking (Emergency Fund, Travel, Laptop), but creating physical bank ledger transfers for virtual allocations introduces accounting confusion and balance inflation risks.
- **Decision:** Model goal allocations as **virtual earmarks** against an actual savings account balance:
  $$\text{Actual Balance} = \text{Verified Ledger Sum (Deposits} - \text{Withdrawals)}$$
  $$\text{Allocated Balance} = \sum \text{Active Goal Allocations}$$
  $$\text{Available Balance} = \text{Actual Balance} - \text{Allocated Balance}$$
- **Invariant:** Creating or modifying a goal allocation never creates fake deposits or withdrawals. The actual bank balance remains unchanged. Over-allocation beyond available balance is rejected.

---

## ADR-005: Database Multi-Target Strategy (MS SQL Server & SQLite Local Dev)
- **Status:** Accepted
- **Context:** The production and AWS target is Microsoft SQL Server with Entity Framework Core. However, developers or test environments may lack a local Microsoft SQL Server instance (or `sqllocaldb`).
- **Decision:** Architect the EF Core `VaultBankDbContext` to support both SQL Server (default/production) and SQLite (zero-config local development and automated xUnit integration testing) toggled via `appsettings.json` or `DATABASE_PROVIDER` environment variable.
- **Rationale:** Ensures immediate out-of-the-box local execution and testing without blocking on host-level SQL Server installation or administrative privileges, while maintaining 100% relational schema and migration parity with Microsoft SQL Server.

---

## ADR-006: Read-Only AI Architecture with Gemini (`gemini-2.5-flash-lite`)
- **Status:** Accepted
- **Context:** Integrating generative AI into banking presents hallucination, unauthorized action, and security risks.
- **Decision:**
  1. Use Google Gemini model `gemini-2.5-flash-lite` configured securely via `GEMINI_API_KEY` and `GEMINI_MODEL` environment variables.
  2. The LLM is restricted to an authenticated, read-only tool allowlist (`GetSavingsSummary`, `GetFDPortfolio`, `GetUpcomingMaturities`, etc.).
  3. The LLM is strictly prohibited from executing financial transactions (deposits, withdrawals, FD creations/liquidations). It must instruct the user to complete actions via confirmed UI workflows.
  4. The LLM never receives database connection strings, auth tokens, passwords, or full unmasked account identifiers.
  5. The application functions uninterrupted if Gemini API is unreachable or rate-limited.

---

## ADR-007: Idempotent Interest Processing & State Transitions
- **Status:** Accepted
- **Context:** Scheduled jobs or administrative triggers executing interest accrual or maturity settlements must not credit accounts more than once if run repeatedly.
- **Decision:**
  - `InterestAccruals` records track unique compound periods per FD (`FDId + PeriodIndex`).
  - `FixedDeposits` records transition through strict states: `Active` $\rightarrow$ `Matured` $\rightarrow$ `Settled` or `PrematurelyClosed`.
  - Maturity settlement queries only select `Status == Active && MaturityDate <= CurrentDate`. Upon settlement, the status changes to `Matured`, and the settlement is executed inside an atomic database transaction.

---

## ADR-008: Design System & Color Palette
- **Status:** Accepted
- **Context:** Modern private banking and luxury wealth management interfaces require a distinct, premium aesthetic departing from generic corporate blue themes.
- **Decision:** Standardize on Obsidian Black (`#171717`) and Charcoal (`#292929`) background surfaces, Warm Ivory (`#E8DFCF`) text, and restrained Champagne Gold (`#C5A46D`) highlights, paired with high-precision financial chart visualizations.
