# VaultBank — Requirements Specification

## 1. Executive Summary & Positioning
**VaultBank** is an AI-powered educational digital banking and personal wealth intelligence platform.

**Product Positioning:** *"Beyond Banking. Into Wealth Intelligence."*

VaultBank bridges the gap between conventional transactional banking and proactive wealth management by answering four fundamental questions for the customer:
1. **How much money do I have?** (Consolidated multi-account savings balance and active FD principal)
2. **How is my money distributed?** (Liquid savings vs. locked fixed deposits vs. virtual goal allocations)
3. **How is my wealth growing?** (Compound interest projections, maturity values, interest accrual trends)
4. **What should I pay attention to next?** (Upcoming maturities, goal milestones, spending anomalies)

---

## 2. System Dimensions & Core Pillars

### Pillar A: Banking Core (Foundation)
- **Customer Authentication & RBAC**:
  - Secure registration, login, and JWT-based session management.
  - Role separation: `Customer` vs. `Admin`.
  - Secure password hashing (BCrypt / PBKDF2 with salt).
- **Multi-Account Savings Management**:
  - Multiple savings accounts per customer with unique account numbers.
  - Simulated deposit and withdrawal flows with strict server-side validation.
  - Available balance enforcement (prevent overdraft/negative balance).
  - Atomic ledger transaction logging for every balance change.
- **Fixed Deposit (FD) Management**:
  - Creation of term deposits specifying principal, tenure (months/years), interest rate, and compounding frequency.
  - Authoritative backend compounding engine (quarterly compounding default, configurable).
  - Explicit customer preview and confirmation before contract inception.
  - Premature withdrawal mechanism with administrator-configured penalty deductions.
  - Maturity status lifecycle (`Active` -> `Matured` -> `Closed` / `PrematurelyClosed`).

### Pillar B: Wealth Growth & Visualization
- **Signature Feature — FD Growth Simulator**:
  - Dynamic, animated investment growth curve tracking principal to maturity.
  - Interactive sliders/inputs for amount, tenure (1, 2, 3, 5, 10, 15 years), interest rate, and compounding frequency.
  - Visual breakdown of principal vs. earned interest.
  - Powered strictly by the backend calculation engine to prevent client/server calculation drift.
- **What-If Scenario Simulator**:
  - Multi-scenario comparative engine (e.g., Scenario A: ₹50k for 2 yrs @ 6.5% vs. Scenario B: ₹50k for 5 yrs @ 7.0%).
  - Superimposed growth curves on unified charts with liquidity vs. return tradeoff guidance.
- **FD Ladder Strategy Builder**:
  - Division of lump-sum capital into staggered multi-tenure tranches for optimized liquidity and yield.
  - Total allocation validation (tranches must not exceed selected investment amount).
  - Staggered maturity timeline preview with explicit individual confirmation.
- **Savings Goals (Virtual Earmarks)**:
  - Custom target funds (Emergency Fund, Travel, Tech, Education).
  - **Accounting Invariant**: Goal allocations are virtual earmarks against available account balance; they do not create fake banking transactions or inflate total customer wealth.
- **Maturity Timeline**:
  - Chronological financial milestone calendar visualizing upcoming FD payouts and goal target dates.

### Pillar C: Wealth Intelligence & AI
- **VAULT AI Personal Wealth Assistant**:
  - Powered by Google Gemini (`gemini-2.5-flash-lite`).
  - Triple-capability model:
    1. *Navigation Assistant*: Directs users across portal views via UI action dispatches.
    2. *Banking Knowledge Assistant*: Explains compounding, laddering, penalties, and financial concepts.
    3. *Personal Wealth Companion*: Analyzes authenticated user summaries (read-only tools).
  - Safety & Authorization: Read-only tool allowlist; zero direct database queries by LLM; strictly no autonomous financial transactions (must direct user to confirmed UI workflows).
  - Graceful degradation: The banking portal remains 100% operational if the Gemini API is unreachable or rate-limited.
- **Rule-Based Financial Intelligence**:
  - Deterministic spending categorization (Food, Shopping, Travel, Entertainment, Education, Utilities, Transfers, Other).
  - Monthly financial pulse (deposits, withdrawals, net savings rate, MoM trends).
  - Rule-based alerts for unusual transaction bursts or large withdrawals.
- **Wealth Journal**:
  - Historical monthly snapshots preserving balance, interest, and savings rate state over time.
- **External Public Financial Data**:
  - Informational macroeconomic indicators (RBI policy repo rate, inflation trends) with source attribution, caching, and update timestamps.

### Pillar D: Administration & Background Automation
- **Admin Dashboard**:
  - Global overview: Total customers, active savings accounts, total deposits, active FD principal, and projected payouts.
  - Policy configuration: Base interest rates, tenure tiers, and premature withdrawal penalty percentages.
- **Interest Accrual & Maturity Settlement Engine**:
  - Background service and manual administrative trigger.
  - Strict Idempotency: Processing an FD repeatedly must never duplicate interest credits or maturity payouts.
  - Atomic transactions: Account balance updates and transaction logs committed in a single transaction boundary.
  - Comprehensive audit logging for all automated batch operations.

---

## 3. Non-Functional & Quality Requirements

1. **Precision & Consistency**:
   - Monetary values must strictly use C# `decimal` and SQL `DECIMAL(18,2)`. No IEEE floating-point types (`float`, `double`).
2. **Visual Aesthetics**:
   - Master design palette: Obsidian Black (`#171717`), Champagne Gold (`#C5A46D`), Warm Ivory (`#E8DFCF`), Charcoal (`#292929`), Muted Stone (`#77736B`), Success Green (`#477A60`), Burgundy (`#873F4B`).
   - Editorial typography, generous negative space, refined micro-interactions, responsive on both desktop and mobile.
3. **Data Security & Privacy**:
   - Password hashing with modern cryptographically secure algorithms.
   - JWT authorization with claims-based customer ownership checks on all endpoints.
   - PII and credentials never passed to LLM prompts.
4. **Resilience & Testing**:
   - Comprehensive xUnit testing covering core compounding formulas, deposit/withdrawal boundary conditions, premature withdrawal penalties, and virtual goal accounting invariants.
