# VaultBank 🏦
### Digital Savings & Fixed Deposit Management Portal

VaultBank is a digital banking web application that enables customers to manage multiple savings accounts, perform deposits and withdrawals, create fixed deposits, and visualize their investment growth over time.

The application is being developed using **ASP.NET Core Web API, React, TypeScript, and Microsoft SQL Server**, with an emphasis on banking domain knowledge, backend architecture, financial calculations, database management, and cloud deployment.

> **Project status:** Initial planning and requirement analysis  
> **Development approach:** Learn by doing — incremental implementation  
> **Deployment target:** AWS

---

## 1. Project Objectives

The primary objective of VaultBank is to simulate essential digital banking operations while demonstrating practical software engineering concepts.

The project focuses on:

- Building RESTful APIs using ASP.NET Core.
- Developing an interactive banking interface using React and TypeScript.
- Implementing financial calculations and banking business rules.
- Managing relational data using SQL Server and Entity Framework Core.
- Implementing authentication and role-based authorization.
- Automating interest accrual and FD maturity processing.
- Generating customer-wise and bank-level financial reports.
- Writing unit tests for critical business logic.
- Deploying the application on AWS while monitoring cloud costs.

## 2. Key Features

### A. Customer Authentication
- Customer registration and login.
- JWT-based authentication.
- Role-based authorization for customers and administrators.

### B. Savings Account Management
- Multiple savings accounts per customer.
- Savings account dashboard.
- Display account balances and account information.
- Deposit money into savings accounts.
- Withdraw money with sufficient-balance validation.
- Maintain a detailed transaction history.
- Record every successful financial transaction.

### C. Fixed Deposit Management
- Create fixed deposits by specifying:
  - Principal amount.
  - Investment tenure.
  - Applicable annual interest rate.
  - Compounding frequency.
- Automatically calculate FD maturity dates.
- Calculate maturity values using compound interest.
- Display active, matured, and prematurely withdrawn FDs.
- Support premature withdrawals with configurable administrative penalties.

### D. Interactive FD Growth Simulator
An interactive investment visualization feature that allows customers to understand how their fixed deposits may grow over different investment periods.

**How it works:**
- Customer enters an investment amount and applicable interest rate.
- The application dynamically generates an investment growth graph.
- Customers can compare projected returns across different tenures, such as 1, 2, 3, 5, 10, and 15 years.
- Display principal, projected interest, and estimated maturity value.
- Update the graph whenever the customer changes the investment parameters.

The simulator is intended to help customers make informed investment decisions through transparent financial projections.

### E. Interest Accrual and Maturity Processing
- Calculate interest accrued on eligible fixed deposits.
- Support manual interest processing through the administrator panel.
- Support automated processing through scheduled background jobs.
- Process FD maturity and credit eligible maturity proceeds to the associated savings account.
- Maintain interest accrual and settlement records.
- Prevent duplicate interest credits and maturity processing.

### F. Administrator Dashboard
- View all registered customers.
- View customer savings accounts.
- Monitor active and matured fixed deposits.
- Configure premature withdrawal penalty policies.
- Trigger interest processing manually.
- View total savings deposits and outstanding FD principal.
- Generate customer-wise deposit summaries.
- Monitor overall banking activity.

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Backend | C# |
| Backend Framework | ASP.NET Core Web API |
| ORM | Entity Framework Core |
| Database | Microsoft SQL Server |
| Authentication | JWT |
| Testing | xUnit |
| Version Control | Git and GitHub |
| Cloud Deployment | Amazon Web Services (AWS) |

## 4. Proposed System Architecture

VaultBank will initially follow a layered monolithic architecture.

```text
                 CUSTOMER / ADMIN
                        |
                        v
              REACT + TYPESCRIPT
                 (Frontend UI)
                        |
                        | REST API / JSON
                        v
              ASP.NET CORE WEB API
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Controllers    Services      DTOs
          |             |
          |             v
          |       Business Logic
          |             |
          +-------------+
                        |
                        v
              ENTITY FRAMEWORK CORE
                        |
                        v
                 SQL SERVER
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
        Users        Accounts     Fixed Deposits
                                    |
                                    v
                              Transactions
                                    |
                                    v
                              Interest Records
```

### Backend Design Principles

- **Controllers:** Handle HTTP requests and responses.
- **Services:** Implement banking operations and business rules.
- **Entities:** Represent database tables and relationships.
- **DTOs:** Define request and response data structures.
- **Entity Framework Core:** Handle database operations.
- **Background Processing:** Execute scheduled interest accrual and maturity operations.

## 5. Core Banking Calculations

### Compound Interest

The application will initially use the compound interest formula:

\[
A=P\left(1+\frac{r}{n}\right)^{nt}
\]

Where:

- P = Principal amount.
- r = Annual interest rate in decimal form.
- n = Number of compounding periods per year.
- t = Investment tenure in years.
- A = Maturity amount.

### Premature Withdrawal

The application will calculate adjusted interest using the applicable premature withdrawal policy configured by the administrator.

### Banking Validations

- Withdrawal amount must not exceed the available account balance.
- Investment amount must satisfy configured minimum FD limits.
- Only eligible FDs can be prematurely withdrawn.
- Maturity processing must not execute twice for the same FD.
- Financial operations must maintain transaction consistency.

## 6. Initial Database Design

The proposed database will contain the following core entities:

| Entity | Responsibility |
|---|---|
| Users | Authentication credentials and roles |
| Customers | Customer profile information |
| SavingsAccounts | Customer savings accounts and balances |
| Transactions | Deposits, withdrawals and financial transaction records |
| FixedDeposits | FD principal, tenure, interest rate and maturity details |
| InterestAccruals | Interest calculation and credit records |
| BankPolicies | Configurable banking policies and penalty settings |

The database will support one-to-many relationships between customers and savings accounts, customers and fixed deposits, and savings accounts and transactions.

## 7. SQL Reporting Requirements

The project will implement the following SQL operations:

1. **FD Maturity Calculation:** Calculate maturity values using principal, interest rate, compounding frequency, and tenure.
2. **Interest Accrual:** Calculate interest for eligible fixed deposits.
3. **Customer-wise Deposit Summary:** Generate customer-level savings and FD deposit summaries using SQL JOINs, GROUP BY, and aggregate functions.

## 8. Development Roadmap

The initial implementation is planned across a 14-day development cycle.

| Phase | Activities |
|---|---|
| Day 1 | Requirement analysis, domain understanding and project initialization |
| Days 2–3 | C# fundamentals, ASP.NET Core setup, SQL Server and EF Core |
| Day 4 | Authentication and JWT implementation |
| Days 5–6 | Savings accounts, deposits, withdrawals and transaction logging |
| Days 7–8 | FD creation, calculations and premature withdrawal |
| Day 9 | Interest accrual and maturity processing |
| Day 10 | Administrator APIs and SQL reporting |
| Days 11–12 | React frontend and customer workflows |
| Day 13 | Admin UI, unit testing and integration |
| Day 14 | AWS deployment, documentation and demonstration |

The roadmap is an initial target and may be adjusted based on implementation complexity.

## 9. Testing Strategy

The application will include basic unit tests and integration checks covering:

- Savings account balance calculations.
- Deposit and withdrawal validations.
- Insufficient balance scenarios.
- FD maturity calculations.
- Interest accrual calculations.
- Premature withdrawal penalty calculations.
- Duplicate maturity processing prevention.
- Authentication and authorization.
- Admin reporting calculations.

## 10. Deployment Strategy

The application will initially be developed and tested locally.

The deployment phase will explore suitable AWS services, prioritizing available free-tier or low-cost options.

Deployment considerations include:

- Backend hosting.
- Frontend hosting.
- SQL Server database hosting.
- Environment variable management.
- Secure configuration of credentials and JWT secrets.
- Git-based source control.
- AWS billing and resource monitoring.

Actual AWS service selection will depend on free-tier eligibility, availability, and deployment requirements.

## 11. Future Enhancements

Potential improvements beyond the initial MVP:

- Downloadable account statements.
- Email notifications for FD maturity.
- Advanced financial analytics.
- Customer transaction filtering and search.
- Enhanced investment comparison tools.
- Additional banking products.

## 12. Learning Objectives

This project is also a practical learning exercise focused on:

- C# and object-oriented programming.
- ASP.NET Core Web API development.
- React and TypeScript.
- SQL Server and relational database design.
- Entity Framework Core.
- RESTful API architecture.
- Authentication and authorization.
- Financial calculations and banking workflows.
- Unit testing and debugging.
- AWS deployment and cloud infrastructure.

## 13. Project Disclaimer

VaultBank is an educational banking simulation developed for learning and demonstration purposes.

It does not process real financial transactions, hold actual customer deposits, or represent a licensed banking institution. All financial calculations and banking policies are illustrative and should not be treated as actual banking or investment advice.

---

**Built with curiosity, consistency, and a learn-by-doing mindset.**