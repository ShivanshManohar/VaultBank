# VaultBank — Demo Guide & Evaluation Walkthrough

## 1. Demo Credentials & Seeded Personas

| Persona | Role | Email | Password | Purpose |
|---|---|---|---|---|
| **Alex Morgan** | `Customer` | `alex.morgan@vaultbank.com` | `Vault@2026!` | Primary demo customer with multiple accounts, active FDs, goals, and history. |
| **Eleanor Vance** | `Customer` | `eleanor.vance@vaultbank.com` | `Vault@2026!` | Customer focused on conservative savings and FD laddering. |
| **Marcus Sterling** | `Admin` | `marcus.admin@vaultbank.com` | `VaultAdmin@2026!` | Bank administrator with policy management and batch processing permissions. |

---

## 2. Recommended Walkthrough Flow (The 10-Minute Showcase)

### Step 1: Public Landing Page & Visual Identity
- Notice the Obsidian Black (`#171717`) and Champagne Gold (`#C5A46D`) editorial private banking aesthetic.
- Highlight the brand statement: *"Beyond Banking. Into Wealth Intelligence."*
- Review the interactive landing preview of the FD Growth Simulator.

### Step 2: Authentication & Customer Dashboard
- Log in as `alex.morgan@vaultbank.com`.
- Inspect the four foundational questions answered on the dashboard:
  1. *How much do I have?* (Consolidated savings + active FD principal).
  2. *How is it distributed?* (Interactive asset allocation ring).
  3. *How is it growing?* (Projected maturity values and accrued interest).
  4. *What to pay attention to next?* (Upcoming FD maturity and goal milestones).

### Step 3: Signature Experience — FD Growth Simulator
- Navigate to **Wealth Growth -> FD Growth Simulator**.
- Adjust amount (e.g., ₹100,000) and switch between 1, 3, 5, 10, and 15-year tenures.
- Observe the animated compounding growth curve separating principal from earned interest.
- Open **What-If Simulator** and compare a 2-year conservative FD @ 6.75% against a 5-year growth FD @ 7.50%.
- Review the **FD Ladder Strategy Builder** and see how a lump sum is partitioned across staggered maturities.

### Step 4: Core Banking & Fixed Deposit Creation
- Navigate to **Savings Accounts** and observe multiple accounts (Primary Checking, High-Yield Reserve).
- Execute a simulated deposit (₹20,000) with atomic balance and transaction updates.
- Create a new Fixed Deposit (₹25,000 for 12 months @ 7.00% quarterly compounding) funded from savings.
- Inspect the FD contract details and view the updated portfolio.

### Step 5: Savings Goals (Virtual Earmark Accounting)
- Navigate to **Savings Goals**.
- Allocate ₹10,000 to "Emergency Fund".
- Verify that **Actual Balance** remains unchanged, while **Available Balance** decreases by ₹10,000. No fake bank transactions are generated.

### Step 6: VAULT AI Assistant
- Open the persistent VAULT AI chat drawer from the bottom right.
- Try context queries:
  - *"Which of my fixed deposits matures next?"* (Fetches authenticated backend data via tool calling).
  - *"How does quarterly compounding work?"* (Explains financial mechanics clearly).
  - *"Take me to my savings goals"* (Navigates directly to the goals view).
- Notice that the assistant refuses to perform financial mutations, directing the user to standard UI workflows instead.

### Step 7: Maturity Timeline & Wealth Journal
- Open the **Maturity Timeline** to view chronological payout milestones.
- View the **Wealth Journal** to inspect historical monthly snapshots of savings rates and interest growth.

### Step 8: Administrator Panel
- Log out and log in as `marcus.admin@vaultbank.com`.
- Review bank-wide metrics: Total customers, total savings liabilities, total outstanding FD principal.
- Inspect and adjust bank policies (e.g., premature withdrawal penalty percentage).
- Trigger manual interest accrual and maturity settlement batch jobs and view the execution logs.
