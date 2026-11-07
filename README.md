# VaultBank 🏦
### AI-Powered Digital Banking & Personal Wealth Intelligence Platform

> *"Beyond Banking. Into Wealth Intelligence."*

VaultBank is an educational digital banking and personal wealth management platform. It combines a robust commercial banking core with dynamic investment simulators, virtual goal earmarks, and **VAULT AI** — a context-aware financial intelligence co-pilot powered by Google Gemini.

The application is engineered with an emphasis on banking domain fidelity, authoritative financial calculation engines, relational transaction consistency, and a private banking aesthetic (**Obsidian Black & Champagne Gold**).

> **Project status:** Phase 0 & Phase 1 — Architecture Scaffolding & Core Foundation  
> **Development approach:** Learn by doing — disciplined, incremental implementation  
> **Deployment target:** AWS (Local-first verification with production readiness)

---

## 1. Documentation Index

Comprehensive engineering and design specifications are maintained in the [`docs/`](./docs) directory:
- [Requirements & Domain Invariants](./docs/REQUIREMENTS.md)
- [System Architecture & Layered Monolith](./docs/ARCHITECTURE.md)
- [Technical Architecture Decisions (ADRs)](./docs/TECHNICAL-DECISIONS.md)
- [Relational Database Design & SQL Queries](./docs/DATABASE-DESIGN.md)
- [RESTful API Specifications](./docs/API-DOCUMENTATION.md)
- [VAULT AI Architecture & Controlled Tool Calling](./docs/AI-ARCHITECTURE.md)
- [Demo Guide & Evaluator Walkthrough](./docs/DEMO-GUIDE.md)

---

## 2. Project Objectives

The primary objective of VaultBank is to simulate essential digital banking operations while demonstrating practical software engineering concepts.

The project focuses on:

- Building RESTful APIs using ASP.NET Core.
- Developing an interactive banking interface using React and TypeScript.
- Implementing financial calculations and banking business rules using high-precision arithmetic (`decimal`).
- Managing relational data using SQL Server and Entity Framework Core.
- Implementing authentication and role-based authorization (Customer vs. Admin).
- Automating interest accrual and FD maturity processing with idempotent background workers.
- Generating customer-wise and bank-level financial reports.
- Integrating Gemini AI (`gemini-2.5-flash-lite`) via a secure, read-only tool calling pattern.
- Writing unit tests for critical business logic using xUnit.
- Deploying the application on AWS while monitoring cloud costs.

---

## 3. Key Feature Pillars

### Pillar A: Banking Core (Foundation)
- **Customer Authentication & RBAC:**
  - Secure customer registration and login.
  - JWT-based authentication with role-based access for customers and administrators.
  - Secure password hashing and token validation.
- **Savings Account Management:**
  - Multiple savings accounts per customer.
  - Savings account dashboard displaying balances and account details.
  - Simulated money deposit and withdrawal flows with strict balance validation.
  - Maintain an auditable, immutable transaction history.
  - Atomic ledger balance updates and transaction logging.
- **Fixed Deposit Management:**
  - Open fixed deposits specifying: principal, tenure, annual interest rate, and compounding frequency.
  - Authoritative calculation of maturity dates and maturity values using compound interest.
  - Display active, matured, and closed FDs.
  - Premature withdrawals subject to administrator-configured penalty policies.

### Pillar B: Wealth Growth & Visualization
- **Signature Feature — FD Growth Simulator:**
  - Living investment growth curve dynamically tracking principal growth to maturity.
  - Selectable tenure horizons: 1, 2, 3, 4, 5, 10, and 15 years.
  - Interactive parameter inputs: investment amount, tenure, product rate, and compounding frequency.
  - Real-time breakdown of principal versus interest earned.
  - Shared authoritative calculation engine across simulator and contract booking.
- **What-If Scenario Simulator:**
  - Compare multiple investment scenarios (e.g. ₹50k for 2 yrs @ 6.5% vs. ₹50k for 5 yrs @ 7.0%).
  - Superimpose multiple growth curves on a unified visualization.
  - Tradeoff analysis across tenure, yield, and liquidity.
- **FD Ladder Strategy Builder:**
  - Partition lump-sum savings into staggered multi-tenure tranches.
  - Visual timeline of upcoming maturities ensuring periodic liquidity.
  - Strict allocation validation (tranches must not exceed selected investment amount).
- **Savings Goals (Virtual Earmarks):**
  - Create personal savings goals (Emergency Fund, Travel, Education).
  - Virtual earmark accounting: allocations reserve available balance without inflating total bank balance or creating artificial ledger entries.
- **Maturity Timeline:**
  - Chronological financial milestone calendar visualizing upcoming FD payouts and goal target dates.

### Pillar C: Wealth Intelligence & AI
- **VAULT AI Personal Wealth Assistant:**
  - Powered by Google Gemini (`gemini-2.5-flash-lite`).
  - Tri-modal co-pilot: Navigation Assistant, Banking Knowledge Assistant, and Personal Wealth Companion.
  - Controlled read-only tool execution allowlist with authenticated customer context.
  - Strictly non-transactional: directs users to confirmed UI workflows for any financial mutation.
  - Independent fallback: banking core continues functioning if AI services are unavailable.
- **Rule-Based Financial Intelligence:**
  - Transaction categorization (Food, Shopping, Travel, Entertainment, Education, Utilities, Transfers).
  - Monthly financial pulse (deposits, withdrawals, net savings rate, category trends).
  - Anomaly detection alerts for unusual withdrawal spikes or high-frequency activity.
- **Wealth Journal:**
  - Historical monthly snapshots of opening/closing savings, accrued interest, and savings rates.
- **External Public Financial Data:**
  - Informational macroeconomic indicators (RBI policy repo rate, inflation) with caching, update timestamps, and source attribution.

### Pillar D: Administration & Background Automation
- **Administrator Dashboard:**
  - View all registered customers, savings liabilities, and outstanding FD principal.
  - Configure bank policies: interest rates, tenure tiers, and premature withdrawal penalties.
  - Idempotent manual interest accrual and maturity settlement triggers.
  - Audit logs and system-level reporting.

---

## 4. Visual Identity — Obsidian & Champagne Gold

VaultBank adopts an understated luxury aesthetic inspired by private banking and high-end wealth intelligence platforms:

| Color | Hex | Purpose |
|---|---|---|
| **Obsidian Black** | `#171717` | Primary dark backgrounds |
| **Warm Ivory** | `#E8DFCF` | Primary high-contrast light typography |
| **Champagne Gold** | `#C5A46D` | Restrained accents, milestones, active highlights |
| **Charcoal** | `#292929` | Secondary cards and elevated surfaces |
| **Muted Stone** | `#77736B` | Secondary text, meta tags, and subtitles |
| **Pure White** | `#FFFFFF` | Clean contrast elements |
| **Success Green** | `#477A60` | Positive yields, deposits, completed goals |
| **Burgundy** | `#873F4B` | Penalties, withdrawals, critical alerts |

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React (TypeScript, Vite) |
| Styling & Design | Custom CSS Tokens / Tailwind (Obsidian & Gold palette) |
| Backend | ASP.NET Core 8 Web API (C#) |
| ORM | Entity Framework Core |
| Database | Microsoft SQL Server (with SQLite local-dev & test provider) |
| AI Integration | Google Gemini API (`gemini-2.5-flash-lite`) |
| Authentication | JWT (HMAC-SHA256) with Role-Based Access |
| Testing | xUnit |
| Version Control | Git and GitHub |
| Cloud Deployment | Amazon Web Services (AWS) |

---

## 6. Proposed System Architecture

VaultBank follows a clean layered monolithic architecture:

```text
                 CUSTOMER / ADMIN
                        |
                        v
              REACT + TYPESCRIPT (Vite)
             (Obsidian & Gold Design)
                        |
                        | REST API / JSON (JWT Bearer)
                        v
              ASP.NET CORE 8 WEB API
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Controllers    Services      DTOs
          |             |
          |             v
          |       Business Logic & Calculation Engine
          |             |
          +-------------+
                        |
                        v
              ENTITY FRAMEWORK CORE
                        |
                        v
        SQL SERVER (Production / AWS) & SQLite (Local)
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
        Users        Accounts     Fixed Deposits
          |             |             |
          v             v             v
      Customers   Transactions   Interest Accruals
          |                           |
          +-------------+-------------+
                        |
                        v
          Goals, Snapshots, Policies & Logs
```

### Backend Design Principles:
- **Controllers:** Handle HTTP routing, JWT claim inspection, and request validation.
- **Services:** Implement core banking rules, transaction atomicity, and financial math.
- **Entities:** Strongly-typed EF Core relational entity definitions with `DECIMAL(18,2)` precision.
- **DTOs:** Explicit request/response contracts isolating internal database models.
- **Background Processing:** Hosted background worker executing idempotent daily interest calculations and maturity settlements.

---

## 7. Core Banking Calculations

### Compound Interest Formula
The calculation engine standardizes on quarterly compounding ($n=4$):

$$A = P\left(1 + \frac{r}{n}\right)^{nt}$$

Where:
- $P$ = Principal amount (`decimal`)
- $r$ = Annual interest rate in decimal form (e.g. $0.07$ for $7.0\%$)
- $n$ = Number of compounding periods per year ($4$ for quarterly)
- $t$ = Investment tenure in years
- $A$ = Projected maturity value

### Premature Withdrawal Penalty
Adjusted interest is computed using the penalty percentage configured in bank policy at FD inception:
$$\text{Adjusted Rate} = \max(0, \text{Contract Rate} - \text{Penalty Rate})$$
Net payable proceeds are credited back to the linked savings account atomically.

---

## 8. Relational Database Design

The database schema encompasses:
- `Users` & `Customers`: Authentication credentials, roles, and profile information.
- `SavingsAccounts` & `Transactions`: Balances, available balances, and immutable transaction ledger.
- `FixedDeposits` & `InterestAccruals`: FD contracts, lifecycle states, and periodic interest accrual records.
- `SavingsGoals` & `GoalAllocations`: Virtual goal earmarks with strict balance invariant enforcement.
- `WealthSnapshots`: Historical monthly snapshots for the Wealth Journal.
- `BankPolicies` & `FDProducts`: Configurable product tiers and premature liquidation policies.
- `FinancialAlerts` & `ProcessingLogs`: Rule-based anomaly alerts and audit execution logs.
- `ExternalDataCache`: Macroeconomic data cache with timestamps and source attribution.

---

## 9. Development Roadmap

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Repository inspection, architecture design, and documentation | Complete |
| **Phase 1** | Foundation setup: .NET backend, React frontend, EF Core scaffolding, Design tokens | In Progress |
| **Phase 2** | Banking Core: Auth, Savings, Atomic Transactions, Fixed Deposit contracts | Pending |
| **Phase 3** | Signature Visuals: Obsidian/Gold Landing Page, Dashboard, FD Growth Simulator | Pending |
| **Phase 4** | Wealth Management: Goals (virtual earmarks), What-If Simulator, FD Ladder, Timeline | Pending |
| **Phase 5** | AI & External Data: VAULT AI (`gemini-2.5-flash-lite`), Read-Only Tools, Macro indicators | Pending |
| **Phase 6** | Intelligence & Automation: Wealth Journal, Idempotent background processing, Admin panel | Pending |
| **Phase 7** | Quality & Deployment: xUnit test suite, Demo data seeding, AWS readiness | Pending |

---

## 10. Project Disclaimer

VaultBank is an educational digital banking and wealth intelligence simulation developed for learning and demonstration purposes.

It does not process real financial transactions, hold actual customer deposits, or represent a licensed banking institution. All financial calculations, rates, and policies are illustrative and should not be treated as actual banking or investment advice.

---

**Built with curiosity, consistency, and a learn-by-doing mindset.**
