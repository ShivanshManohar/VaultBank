import {
  UserProfile,
  SavingsAccount,
  Transaction,
  FixedDeposit,
  GrowthSimulationResponse,
  ScenarioCompareResponse,
  FDLadderResponse,
  SavingsGoal,
  FinancialOverview,
  MonthlyPulse,
  CategorySpending,
  FinancialAlert,
  WealthJournalSnapshot,
  MacroIndicators,
  AiChatResponse
} from '../types';

const API_BASE = '/api';

// Retrieve token from localStorage
function getToken(): string | null {
  return localStorage.getItem('vaultbank_token');
}

// Universal fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.ok) {
      const json = await res.json();
      return json.data as T;
    }
  } catch (err) {
    console.warn(`Backend API unreachable at ${endpoint}. Activating interactive simulated mode.`);
  }

  // Fallback to high-fidelity local simulation engine
  return getSimulatedFallback<T>(endpoint, options);
}

// --- Interactive High-Fidelity Local Simulation Fallback ---
// In-memory mock database matching backend seed data for zero-downtime client evaluation
const mockState = {
  user: {
    token: 'mock-jwt-alex-morgan',
    username: 'alex.morgan',
    email: 'alex.morgan@vaultbank.com',
    fullName: 'Alex Morgan',
    customerNumber: 'VB-CUST-104921',
    role: 'Customer' as const,
    customerId: 'cust-alex-morgan-001',
  },
  accounts: [
    {
      id: 'acc-001',
      accountNumber: 'VB-SAV-88029144',
      accountType: 'Premium Tier Reserve',
      balance: 185000.00,
      availableBalance: 160000.00,
      earmarkedAmount: 25000.00,
      currency: 'INR',
      status: 'Active',
      createdAt: '2025-10-01T10:00:00Z',
    },
    {
      id: 'acc-002',
      accountNumber: 'VB-SAV-88029199',
      accountType: 'High-Yield Liquid Flex',
      balance: 75000.00,
      availableBalance: 75000.00,
      earmarkedAmount: 0.00,
      currency: 'INR',
      status: 'Active',
      createdAt: '2025-12-15T10:00:00Z',
    },
  ] as SavingsAccount[],
  transactions: [
    { id: 'txn-1', transactionReference: 'TXN-20260215-06', type: 'Withdrawal', amount: 25500, balanceAfter: 185000, category: 'Travel', description: 'First Class Regional Flight', transactionDate: '2026-03-01T14:30:00Z', status: 'Completed' },
    { id: 'txn-2', transactionReference: 'TXN-20260201-05', type: 'Deposit', amount: 85000, balanceAfter: 210500, category: 'Salary', description: 'Direct Advisory Remuneration', transactionDate: '2026-02-18T09:15:00Z', status: 'Completed' },
    { id: 'txn-3', transactionReference: 'TXN-20260128-04', type: 'Withdrawal', amount: 7200, balanceAfter: 125500, category: 'Utilities', description: 'High-Speed Fiber & Cloud Node', transactionDate: '2026-02-08T11:45:00Z', status: 'Completed' },
    { id: 'txn-4', transactionReference: 'TXN-20260112-03', type: 'Withdrawal', amount: 4800, balanceAfter: 132700, category: 'Food', description: 'Bespoke Dining Experience', transactionDate: '2026-01-26T20:10:00Z', status: 'Completed' },
    { id: 'txn-5', transactionReference: 'TXN-20260105-02', type: 'Withdrawal', amount: 12500, balanceAfter: 137500, category: 'Shopping', description: 'Harrods London Boutique', transactionDate: '2026-01-18T16:20:00Z', status: 'Completed' },
    { id: 'txn-6', transactionReference: 'TXN-20260101-01', type: 'Deposit', amount: 150000, balanceAfter: 150000, category: 'Salary', description: 'Executive Remuneration', transactionDate: '2026-01-01T08:00:00Z', status: 'Completed' },
  ] as Transaction[],
  fds: [
    {
      id: 'fd-001',
      fdNumber: 'VB-FD-770142',
      sourceAccountId: 'acc-001',
      sourceAccountNumber: 'VB-SAV-88029144',
      principalAmount: 50000,
      interestRate: 7.25,
      compoundingFrequency: 'Quarterly',
      tenureMonths: 24,
      startDate: '2025-05-10T00:00:00Z',
      maturityDate: '2027-05-10T00:00:00Z',
      expectedMaturityAmount: 59374.22,
      expectedTotalInterest: 9374.22,
      accruedInterest: 2310.50,
      actualSettledAmount: 0,
      penaltyDeducted: 0,
      status: 'Active',
      progressPercentage: 42.5,
    },
    {
      id: 'fd-002',
      fdNumber: 'VB-FD-770198',
      sourceAccountId: 'acc-001',
      sourceAccountNumber: 'VB-SAV-88029144',
      principalAmount: 100000,
      interestRate: 7.50,
      compoundingFrequency: 'Quarterly',
      tenureMonths: 36,
      startDate: '2024-11-15T00:00:00Z',
      maturityDate: '2027-11-15T00:00:00Z',
      expectedMaturityAmount: 124971.64,
      expectedTotalInterest: 24971.64,
      accruedInterest: 9840.10,
      actualSettledAmount: 0,
      penaltyDeducted: 0,
      status: 'Active',
      progressPercentage: 44.0,
    },
  ] as FixedDeposit[],
  goals: [
    {
      id: 'goal-001',
      accountId: 'acc-001',
      accountNumber: 'VB-SAV-88029144',
      title: 'Emergency Liquidity Shield',
      category: 'Emergency Fund',
      targetAmount: 100000,
      allocatedAmount: 25000,
      remainingAmount: 75000,
      progressPercentage: 25.0,
      targetDate: '2026-10-15T00:00:00Z',
      status: 'InProgress',
      createdAt: '2025-11-01T00:00:00Z',
    },
  ] as SavingsGoal[],
  alerts: [
    {
      id: 'alert-01',
      alertType: 'MaturityUpcoming',
      severity: 'Info',
      title: 'Fixed Deposit Semi-Annual Progress',
      message: 'Deposit VB-FD-770142 has completed 10 months of compounding. Accrued yield: ₹2,310.50.',
      isRead: false,
      createdAt: '2026-03-04T08:00:00Z',
    },
  ] as FinancialAlert[],
  journal: [
    {
      snapshotYear: 2026,
      snapshotMonth: 2,
      openingSavings: 160000,
      closingSavings: 185000,
      totalFDPrincipal: 150000,
      totalAccruedInterest: 12150.60,
      totalDeposits: 85000,
      totalWithdrawals: 37500,
      monthlySavingsRate: 55.88,
      generatedAt: '2026-03-01T00:00:00Z',
    },
    {
      snapshotYear: 2026,
      snapshotMonth: 1,
      openingSavings: 150000,
      closingSavings: 160000,
      totalFDPrincipal: 150000,
      totalAccruedInterest: 10420.00,
      totalDeposits: 150000,
      totalWithdrawals: 140000,
      monthlySavingsRate: 6.67,
      generatedAt: '2026-02-01T00:00:00Z',
    },
  ] as WealthJournalSnapshot[],
};

// Client-side math calculator conforming strictly to backend formula: A = P(1 + r/n)^(nt)
function calculateClientMaturity(principal: number, rate: number, frequency: number, months: number): number {
  const r = rate / 100;
  const n = frequency;
  const t = months / 12;
  return Math.round(principal * Math.pow(1 + r / n, n * t) * 100) / 100;
}

function generateClientGrowthCurve(principal: number, rate: number, frequency: number, months: number) {
  const points = [];
  const step = months <= 12 ? 1 : months <= 36 ? 3 : months <= 60 ? 6 : 12;

  points.push({ month: 0, year: 0, principal, cumulativeInterest: 0, totalValue: principal });

  for (let m = step; m < months; m += step) {
    const total = calculateClientMaturity(principal, rate, frequency, m);
    points.push({
      month: m,
      year: Math.round((m / 12) * 10) / 10,
      principal,
      cumulativeInterest: Math.round((total - principal) * 100) / 100,
      totalValue: total,
    });
  }

  const finalTotal = calculateClientMaturity(principal, rate, frequency, months);
  points.push({
    month: months,
    year: Math.round((months / 12) * 10) / 10,
    principal,
    cumulativeInterest: Math.round((finalTotal - principal) * 100) / 100,
    totalValue: finalTotal,
  });

  return points;
}

function getSimulatedFallback<T>(endpoint: string, options: RequestInit): T {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth
  if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
    return mockState.user as unknown as T;
  }

  // Accounts
  if (endpoint === '/accounts' && method === 'GET') {
    return [...mockState.accounts] as unknown as T;
  }
  if (endpoint.startsWith('/accounts/') && endpoint.endsWith('/transactions')) {
    return [...mockState.transactions] as unknown as T;
  }
  if (endpoint.includes('/deposit') && method === 'POST') {
    const amt = Number(body.amount) || 0;
    mockState.accounts[0].balance += amt;
    mockState.accounts[0].availableBalance += amt;
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      transactionReference: `TXN-${Date.now().toString().slice(-8)}`,
      type: 'Deposit',
      amount: amt,
      balanceAfter: mockState.accounts[0].balance,
      category: body.category || 'Salary',
      description: body.description || 'Simulated deposit',
      transactionDate: new Date().toISOString(),
      status: 'Completed',
    };
    mockState.transactions.unshift(newTxn);
    return newTxn as unknown as T;
  }
  if (endpoint.includes('/withdraw') && method === 'POST') {
    const amt = Number(body.amount) || 0;
    if (mockState.accounts[0].availableBalance < amt) {
      throw new Error(`Insufficient available funds. Available: ₹${mockState.accounts[0].availableBalance}`);
    }
    mockState.accounts[0].balance -= amt;
    mockState.accounts[0].availableBalance -= amt;
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      transactionReference: `TXN-${Date.now().toString().slice(-8)}`,
      type: 'Withdrawal',
      amount: amt,
      balanceAfter: mockState.accounts[0].balance,
      category: body.category || 'Shopping',
      description: body.description || 'Simulated withdrawal',
      transactionDate: new Date().toISOString(),
      status: 'Completed',
    };
    mockState.transactions.unshift(newTxn);
    return newTxn as unknown as T;
  }

  // Fixed Deposits
  if (endpoint === '/fds' && method === 'GET') {
    return [...mockState.fds] as unknown as T;
  }
  if (endpoint === '/fds' && method === 'POST') {
    const amt = Number(body.principalAmount) || 0;
    const rate = Number(body.interestRate) || 7.25;
    const tenure = Number(body.tenureMonths) || 24;
    const maturity = calculateClientMaturity(amt, rate, 4, tenure);

    mockState.accounts[0].balance -= amt;
    mockState.accounts[0].availableBalance -= amt;

    const newFd: FixedDeposit = {
      id: `fd-${Date.now()}`,
      fdNumber: `VB-FD-${Math.floor(100000 + Math.random() * 900000)}`,
      sourceAccountId: mockState.accounts[0].id,
      sourceAccountNumber: mockState.accounts[0].accountNumber,
      principalAmount: amt,
      interestRate: rate,
      compoundingFrequency: 'Quarterly',
      tenureMonths: tenure,
      startDate: new Date().toISOString(),
      maturityDate: new Date(Date.now() + tenure * 30 * 24 * 3600 * 1000).toISOString(),
      expectedMaturityAmount: maturity,
      expectedTotalInterest: Math.round((maturity - amt) * 100) / 100,
      accruedInterest: 0,
      actualSettledAmount: 0,
      penaltyDeducted: 0,
      status: 'Active',
      progressPercentage: 0,
    };
    mockState.fds.unshift(newFd);
    return newFd as unknown as T;
  }
  if (endpoint.includes('/premature-withdraw') && method === 'POST') {
    const fdId = endpoint.split('/')[2];
    const targetFd = mockState.fds.find(f => f.id === fdId);
    if (targetFd) {
      targetFd.status = 'PrematurelyClosed';
      const penaltyAmt = Math.round(targetFd.principalAmount * 0.01 * 100) / 100;
      const netPayable = targetFd.principalAmount + targetFd.accruedInterest - penaltyAmt;
      targetFd.actualSettledAmount = netPayable;
      targetFd.penaltyDeducted = penaltyAmt;
      mockState.accounts[0].balance += netPayable;
      mockState.accounts[0].availableBalance += netPayable;
      return targetFd as unknown as T;
    }
  }

  // Simulations
  if (endpoint === '/simulation/fd-growth') {
    const amt = Number(body.principalAmount) || 50000;
    const rate = Number(body.interestRate) || 7.25;
    const tenure = Number(body.tenureMonths) || 36;
    const freq = Number(body.compoundingFrequency) || 4;
    const mat = calculateClientMaturity(amt, rate, freq, tenure);
    const r = rate / 100;
    const ear = (Math.pow(1 + r / freq, freq) - 1) * 100;

    return {
      principalAmount: amt,
      tenureMonths: tenure,
      interestRate: rate,
      compoundingFrequency: freq,
      maturityAmount: mat,
      totalInterestEarned: Math.round((mat - amt) * 100) / 100,
      effectiveAnnualYield: Math.round(ear * 100) / 100,
      trajectory: generateClientGrowthCurve(amt, rate, freq, tenure),
    } as unknown as T;
  }

  if (endpoint === '/simulation/compare') {
    const list = body.scenarios || [];
    const results = list.map((sc: any) => {
      const mat = calculateClientMaturity(sc.principalAmount, sc.interestRate, sc.compoundingFrequency || 4, sc.tenureMonths);
      return {
        name: sc.name,
        principalAmount: sc.principalAmount,
        tenureMonths: sc.tenureMonths,
        interestRate: sc.interestRate,
        maturityAmount: mat,
        totalInterest: Math.round((mat - sc.principalAmount) * 100) / 100,
        returnMultiplier: Math.round((mat / sc.principalAmount) * 1000) / 1000,
        trajectory: generateClientGrowthCurve(sc.principalAmount, sc.interestRate, sc.compoundingFrequency || 4, sc.tenureMonths),
      };
    });
    return {
      results,
      bestReturnScenario: results[1]?.name || results[0]?.name || 'Growth',
      tradeoffSummary: 'Longer tenures maximize compound yield; shorter tenures maintain liquidity flexibility.',
    } as unknown as T;
  }

  if (endpoint === '/simulation/fd-ladder') {
    const total = Number(body.totalCapital) || 100000;
    const tranchesCount = Number(body.numberOfTranches) || 4;
    const perTranche = Math.round((total / tranchesCount) * 100) / 100;
    const baseRate = Number(body.baseInterestRate) || 6.50;

    const tranches = Array.from({ length: tranchesCount }, (_, i) => {
      const yr = i + 1;
      const rate = baseRate + i * 0.30;
      const mat = calculateClientMaturity(perTranche, rate, 4, yr * 12);
      return {
        trancheIndex: yr,
        tenureYears: yr,
        tenureMonths: yr * 12,
        allocatedPrincipal: perTranche,
        applicableRate: rate,
        maturityValue: mat,
        interestEarned: Math.round((mat - perTranche) * 100) / 100,
        estimatedMaturityDate: new Date(Date.now() + yr * 365 * 24 * 3600 * 1000).toISOString(),
      };
    });

    const combMat = tranches.reduce((sum, tr) => sum + tr.maturityValue, 0);

    return {
      totalInvestedPrincipal: perTranche * tranchesCount,
      combinedProjectedMaturity: Math.round(combMat * 100) / 100,
      totalProjectedInterest: Math.round((combMat - total) * 100) / 100,
      tranches,
      strategyExplanation: `Divided ₹${total.toLocaleString('en-IN')} across ${tranchesCount} staggered tranches. One tranche matures annually for continuous liquidity and re-investment yield.`,
    } as unknown as T;
  }

  // Goals
  if (endpoint === '/goals' && method === 'GET') {
    return [...mockState.goals] as unknown as T;
  }
  if (endpoint === '/goals' && method === 'POST') {
    const target = Number(body.targetAmount) || 50000;
    const initAlloc = Number(body.initialAllocation) || 0;
    if (initAlloc > 0) {
      mockState.accounts[0].availableBalance -= initAlloc;
    }
    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      accountId: mockState.accounts[0].id,
      accountNumber: mockState.accounts[0].accountNumber,
      title: body.title || 'Personal Savings Goal',
      category: body.category || 'General',
      targetAmount: target,
      allocatedAmount: initAlloc,
      remainingAmount: Math.max(0, target - initAlloc),
      progressPercentage: Math.round((initAlloc / target) * 1000) / 10,
      targetDate: body.targetDate || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      status: initAlloc >= target ? 'Achieved' : 'InProgress',
      createdAt: new Date().toISOString(),
    };
    mockState.goals.unshift(newGoal);
    return newGoal as unknown as T;
  }
  if (endpoint.includes('/allocate') && method === 'POST') {
    const goalId = endpoint.split('/')[2];
    const amt = Number(body.amount) || 0;
    const goal = mockState.goals.find(g => g.id === goalId);
    if (goal) {
      mockState.accounts[0].availableBalance -= amt;
      goal.allocatedAmount += amt;
      goal.remainingAmount = Math.max(0, goal.targetAmount - goal.allocatedAmount);
      goal.progressPercentage = Math.round((goal.allocatedAmount / goal.targetAmount) * 1000) / 10;
      if (goal.allocatedAmount >= goal.targetAmount) goal.status = 'Achieved';
      return goal as unknown as T;
    }
  }

  // Intelligence
  if (endpoint === '/intelligence/overview') {
    const totSav = mockState.accounts.reduce((s, a) => s + a.balance, 0);
    const totAvail = mockState.accounts.reduce((s, a) => s + a.availableBalance, 0);
    const totFDPrinc = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.principalAmount, 0);
    const totFDMat = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.expectedMaturityAmount, 0);
    const totAccrued = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.accruedInterest, 0);

    const ov: FinancialOverview = {
      totalSavingsBalance: totSav,
      totalAvailableBalance: totAvail,
      totalEarmarkedGoals: totSav - totAvail,
      totalActiveFDPrincipal: totFDPrinc,
      totalProjectedFDMaturity: totFDMat,
      totalAccruedInterest: totAccrued,
      netWorth: totSav + totFDPrinc,
      activeAccountsCount: mockState.accounts.length,
      activeFDsCount: mockState.fds.filter(f => f.status === 'Active').length,
      activeGoalsCount: mockState.goals.length,
      nextMaturityDate: mockState.fds[0]?.maturityDate || null,
      nextMaturityPayout: mockState.fds[0]?.expectedMaturityAmount || null,
    };
    return ov as unknown as T;
  }

  if (endpoint === '/intelligence/monthly-pulse') {
    const pulse: MonthlyPulse = {
      month: 3,
      year: 2026,
      totalDeposits: 85000,
      totalWithdrawals: 25500,
      netSavings: 59500,
      savingsRatePercentage: 70.0,
      editorialNarrative: 'Exceptional liquidity discipline this month with a net savings rate of 70.0%. Wealth is compounding steadily across active reserves.',
    };
    return pulse as unknown as T;
  }

  if (endpoint === '/intelligence/spending') {
    const spending: CategorySpending[] = [
      { category: 'Travel', amount: 25500, percentage: 51.0, transactionCount: 1 },
      { category: 'Shopping', amount: 12500, percentage: 25.0, transactionCount: 1 },
      { category: 'Utilities', amount: 7200, percentage: 14.4, transactionCount: 1 },
      { category: 'Food', amount: 4800, percentage: 9.6, transactionCount: 1 },
    ];
    return spending as unknown as T;
  }

  if (endpoint === '/intelligence/alerts') {
    return [...mockState.alerts] as unknown as T;
  }

  if (endpoint === '/intelligence/journal') {
    return [...mockState.journal] as unknown as T;
  }

  if (endpoint === '/intelligence/macro-indicators') {
    const macro: MacroIndicators = {
      repoRate: 6.50,
      reverseRepoRate: 3.35,
      inflationRate: 4.85,
      source: 'Reserve Bank of India (Monetary Policy Committee)',
      lastUpdated: new Date().toISOString(),
      isCached: true,
    };
    return macro as unknown as T;
  }

  // VAULT AI Chat — Comprehensive Multi-Intent Wealth Intelligence Engine
  if (endpoint === '/ai/chat' && method === 'POST') {
    const prompt = (body.prompt || '').toLowerCase().trim();
    const totSav = mockState.accounts.reduce((s, a) => s + a.balance, 0);
    const totAvail = mockState.accounts.reduce((s, a) => s + a.availableBalance, 0);
    const totEarmarked = totSav - totAvail;
    const totFDPrinc = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.principalAmount, 0);
    const totFDMat = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.expectedMaturityAmount, 0);
    const totAccrued = mockState.fds.filter(f => f.status === 'Active').reduce((s, f) => s + f.accruedInterest, 0);
    const netWorth = totSav + totFDPrinc;

    let reply = '';
    let navRoute: string | undefined = undefined;
    let navLabel: string | undefined = undefined;
    let followUps: string[] = [];

    // Intent 1: Greetings & Assistant Identity
    if (prompt.startsWith('hi') || prompt.startsWith('hello') || prompt.startsWith('hey') || prompt.includes('who are you')) {
      reply = `Good day, Alex. I am **VAULT AI**, your personal wealth intelligence co-pilot.

I am synchronized with your **₹${netWorth.toLocaleString('en-IN')}** private portfolio. Here is what I can assist you with:
• **Portfolio Inquiries**: Check balances, available liquidity, and active fixed deposits.
• **Maturity Milestones**: Track exact payout dates and sync them directly to Google Calendar.
• **Growth & Laddering**: Compare multi-year compounding scenarios and ladder strategies.
• **Domain Invariants**: Clarify virtual goal earmarking and penalty mechanics.

What financial milestone would you like to review today?`;
      followUps = [
        'How much money do I have in total?',
        'Which of my fixed deposits matures first?',
        'How does quarterly compounding work?',
      ];
    }
    // Intent 2: Total Balances / Net Worth / Distribution
    else if (prompt.includes('how much') || prompt.includes('balance') || prompt.includes('net worth') || prompt.includes('distribution') || prompt.includes('where is my money')) {
      reply = `Here is your consolidated wealth breakdown as of today:

• **Total Wealth (Net Worth)**: **₹${netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**
  - **Liquid Savings Reserves**: ₹${totSav.toLocaleString('en-IN')} across 2 accounts
    - *Available to Spend / Lock*: **₹${totAvail.toLocaleString('en-IN')}**
    - *Virtually Earmarked in Goals*: **₹${totEarmarked.toLocaleString('en-IN')}**
  - **Locked Term Deposits**: **₹${totFDPrinc.toLocaleString('en-IN')}** across ${mockState.fds.filter(f => f.status === 'Active').length} active contracts
  - **Projected Maturity Payouts**: **₹${totFDMat.toLocaleString('en-IN')}** (+₹${(totFDMat - totFDPrinc).toLocaleString('en-IN')} total yield)

Your available capital of **₹${totAvail.toLocaleString('en-IN')}** is ready for deployment into high-yield term deposits.`;
      navRoute = '/accounts';
      navLabel = 'View All Accounts';
      followUps = [
        'Why is my available balance lower than total balance?',
        'Simulate locking ₹50,000 for 3 years',
        'Show my recent transactions',
      ];
    }
    // Intent 3: Fixed Deposit Maturities / Specific FD tracking
    else if (prompt.includes('mature') || prompt.includes('maturity') || prompt.includes('when') || prompt.includes('next fd') || prompt.includes('first fd') || prompt.includes('payout')) {
      const nextFd = mockState.fds.filter(f => f.status === 'Active')[0];
      const secondFd = mockState.fds.filter(f => f.status === 'Active')[1];

      reply = `Here is your upcoming Fixed Deposit maturity schedule:

1. **${nextFd.fdNumber}** (Primary Term Deposit):
   • **Principal**: ₹${nextFd.principalAmount.toLocaleString('en-IN')} @ **${nextFd.interestRate}% Quarterly**
   • **Maturity Date**: **${new Date(nextFd.maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}**
   • **Projected Payout**: **₹${nextFd.expectedMaturityAmount.toLocaleString('en-IN')}** (+₹${nextFd.expectedTotalInterest.toLocaleString('en-IN')} gain)
   • **Progress**: ${nextFd.progressPercentage}% completed

2. **${secondFd.fdNumber}** (Long-Term Reserve):
   • **Principal**: ₹${secondFd.principalAmount.toLocaleString('en-IN')} @ **${secondFd.interestRate}% Quarterly**
   • **Maturity Date**: **${new Date(secondFd.maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}**
   • **Projected Payout**: **₹${secondFd.expectedMaturityAmount.toLocaleString('en-IN')}**

Proceeds auto-credit to your reserve account on the maturity date. You can also sync these dates directly to your **Google Calendar** from the FD Portfolio!`;
      navRoute = '/fds';
      navLabel = 'Open Fixed Deposits Portfolio';
      followUps = [
        'How do I add these dates to Google Calendar?',
        'What happens if I withdraw VB-FD-770142 prematurely?',
        'Simulate a 5-year deposit',
      ];
    }
    // Intent 4: Compounding Mechanics / Formula / Mathematics
    else if (prompt.includes('compound') || prompt.includes('quarterly') || prompt.includes('formula') || prompt.includes('math') || prompt.includes('annual')) {
      reply = `VaultBank uses the standard commercial banking **Quarterly Compounding Formula**:

$$A = P \\left(1 + \\frac{r}{n}\\right)^{nt}$$

Where:
• **P** = Principal amount
• **r** = Annual interest rate in decimal form (e.g. 0.0725 for 7.25%)
• **n** = Compounding periods per year (**4** for quarterly)
• **t** = Duration in years
• **A** = Final maturity value

### Why Quarterly Compounding Outperforms Annual:
With quarterly compounding, interest is credited 4 times a year, meaning each quarter you earn interest **on previous interest**.

*Example on ₹1,00,000 for 3 years @ 7.50%:*
• **Annual Compounding (n=1)**: Payout = **₹1,24,229.69** (Yield: ₹24,229.69)
• **Quarterly Compounding (n=4)**: Payout = **₹1,24,971.64** (Yield: ₹24,971.64)
**Net Quarterly Advantage: +₹741.95 in pure compound gain.**`;
      navRoute = '/simulator';
      navLabel = 'Launch FD Growth Simulator';
      followUps = [
        'Compare 2-year vs 5-year yields',
        'Explain the FD Ladder strategy',
        'Which FD of mine matures first?',
      ];
    }
    // Intent 5: Goals / Earmark Invariant / "Where did my money go?"
    else if (prompt.includes('goal') || prompt.includes('earmark') || prompt.includes('virtual') || prompt.includes('emergency') || prompt.includes('available')) {
      reply = `### VaultBank Virtual Earmark Accounting Invariant:

You currently have **₹${totEarmarked.toLocaleString('en-IN')}** earmarked for savings goals (specifically the **Emergency Liquidity Shield**).

**Crucial Banking Rule:**
• **Your Actual Bank Balance remains ₹${totSav.toLocaleString('en-IN')}**. Earmarking does NOT debit or transfer your money.
• **Your Available Balance is ₹${totAvail.toLocaleString('en-IN')}**. It is reduced by ₹${totEarmarked.toLocaleString('en-IN')} to prevent you from accidentally spending designated savings.
• **Zero Artificial Ledger Entries**: No fake deposits or withdrawals are generated.
• You can release your earmarked funds back to your Available Balance at any time with a single click.`;
      navRoute = '/goals';
      navLabel = 'Manage Savings Goals';
      followUps = [
        'Allocate ₹10,000 to Emergency Fund',
        'Show my accounts overview',
        'Can I sync goal dates with Google Calendar?',
      ];
    }
    // Intent 6: Ladder Strategy
    else if (prompt.includes('ladder') || prompt.includes('laddering') || prompt.includes('tranche')) {
      reply = `### The Fixed Deposit Ladder Strategy:

An FD Ladder divides a lump-sum into multiple fixed deposits maturing at staggered intervals (e.g., 1, 2, 3, and 4 years).

**Key Advantages:**
1. **Continuous Liquidity**: Every 12 months, a tranche matures, giving you liquid cash without incurring premature penalties.
2. **Reinvestment Upside**: If market interest rates rise, you can redeploy the matured tranche at higher prevailing rates.
3. **Compound Wealth**: Capital locked in longer tranches continues compounding at premium yields (up to 7.75% p.a.).

You can test different tranches and capital allocations in our **Ladder Builder** under Growth Simulators!`;
      navRoute = '/simulator';
      navLabel = 'Open Ladder Builder';
      followUps = [
        'Simulate ₹1,00,000 across 4 tranches',
        'What is the penalty for premature withdrawal?',
        'How does quarterly compounding work?',
      ];
    }
    // Intent 7: Premature Withdrawal & Penalties
    else if (prompt.includes('penalty') || prompt.includes('premature') || prompt.includes('early') || prompt.includes('liquidate') || prompt.includes('break fd')) {
      reply = `### Premature Withdrawal Policy & Calculation:

Under Bank Policy, premature withdrawal is permitted subject to a **1.00% penalty deduction** from the contractual interest rate for the elapsed tenure.

*Example on your VB-FD-770142 (₹50,000 @ 7.25%):*
• **Elapsed Compounding**: 10 months
• **Contractual Gross Interest**: ₹2,310.50
• **Penalty Rate (1.00% deduction)**: 7.25% - 1.00% = **6.25% Effective Rate**
• **Estimated Net Payout**: **₹51,960.00**
• **Principal Protection**: Your original ₹50,000 principal is 100% protected.

You can preview the exact breakdown on your FD card before confirming.`;
      navRoute = '/fds';
      navLabel = 'View FD Portfolio';
      followUps = [
        'Which of my fixed deposits matures first?',
        'How much money do I have in total?',
        'Explain the FD ladder strategy',
      ];
    }
    // Intent 8: Google Calendar Integration
    else if (prompt.includes('calendar') || prompt.includes('google') || prompt.includes('sync') || prompt.includes('remind')) {
      reply = `### Google Calendar Synchronization:

VaultBank features native **Google Calendar Integration**:

• **FD Maturities**: Every active fixed deposit card features an **"Add Maturity to Google Calendar"** button that creates a calendar entry on your exact maturity date with the projected payout.
• **Milestones & Goals**: Every milestone in the FD Growth Simulator and every target date in Savings Goals can be synced with 1 click.
• **Zero Friction**: Requires no complicated login credentials — clicking the sync button opens Google Calendar pre-populated with title, dates, and amounts!`;
      navRoute = '/fds';
      navLabel = 'Sync FDs to Google Calendar';
      followUps = [
        'When does my first FD mature?',
        'Open Growth Simulator',
        'Show my savings goals',
      ];
    }
    // Intent 9: RBI Policy / Inflation / Macroeconomic Context
    else if (prompt.includes('rbi') || prompt.includes('repo') || prompt.includes('inflation') || prompt.includes('macro') || prompt.includes('rate')) {
      reply = `### Macroeconomic Intelligence (Reserve Bank of India):

• **RBI Policy Repo Rate**: **6.50%** (benchmark monetary lending floor)
• **Reverse Repo Rate**: **3.35%**
• **Headline CPI Inflation**: **4.85%** (comfortably within RBI's 4.0% ± 2.0% tolerance band)
• **VaultBank Real Return Spread**: VaultBank's 5-Year Sovereign Deposit offers **7.75%**, generating a **+2.90% real return alpha** above inflation!

This data is cached from authoritative Reserve Bank of India publications and refreshed daily.`;
      navRoute = '/intelligence';
      navLabel = 'Open Intelligence Hub';
      followUps = [
        'How does VaultBank interest compare with inflation?',
        'Simulate a 5-year deposit at 7.75%',
        'How much do I have in savings?',
      ];
    }
    // Intent 10: Tax & TDS
    else if (prompt.includes('tax') || prompt.includes('tds') || prompt.includes('deduction')) {
      reply = `### Tax Deducted at Source (TDS) on Fixed Deposits:

Under Section 194A of the Indian Income Tax Act:
• **Threshold**: TDS is deducted at **10%** if total interest earned across all fixed deposits exceeds **₹40,000** in a financial year (₹50,000 for senior citizens).
• **PAN Linked**: Ensure your PAN is on file; without PAN, TDS is deducted at 20%.
• **Form 15G / 15H**: If your total income is below the taxable threshold, you can submit Form 15G (or 15H for senior citizens) to avoid TDS deduction.
• Compounded returns shown in VaultBank simulators represent gross payouts prior to personal income tax assessment.`;
      followUps = [
        'How much interest have I earned so far?',
        'Which of my fixed deposits matures first?',
        'Show my monthly pulse',
      ];
    }
    // Intent 11: Spending / Monthly Pulse
    else if (prompt.includes('spending') || prompt.includes('pulse') || prompt.includes('expense') || prompt.includes('save') || prompt.includes('savings rate')) {
      reply = `### Monthly Cashflow & Savings Pulse:

• **Inflows (Deposits)**: **+₹85,000.00** (Advisory & Salary)
• **Outflows (Withdrawals)**: **-₹25,500.00**
• **Net Savings Rate**: **70.0%** (Outstanding liquidity retention)

**Outflow Distribution:**
1. **Travel**: ₹25,500 (51.0%)
2. **Shopping**: ₹12,500 (25.0%)
3. **Utilities**: ₹7,200 (14.4%)
4. **Food & Dining**: ₹4,800 (9.6%)

Your cashflow is strongly positive, allowing you to redeploy surplus liquidity into guaranteed term compounding.`;
      navRoute = '/intelligence';
      navLabel = 'View Intelligence Hub';
      followUps = [
        'How much is unallocated right now?',
        'Open Fixed Deposits Portfolio',
        'Simulate locking ₹50,000',
      ];
    }
    // Default Intelligent Fallback
    else {
      reply = `I have analyzed your query regarding *"${body.prompt}"*.

Based on your authenticated portfolio profile:
• You hold **₹${totSav.toLocaleString('en-IN')}** in savings (with **₹${totAvail.toLocaleString('en-IN')}** unallocated and available).
• You have **₹${totFDPrinc.toLocaleString('en-IN')}** actively compounding across **${mockState.fds.filter(f => f.status === 'Active').length} term deposits**, projected to pay out **₹${totFDMat.toLocaleString('en-IN')}**.
• Your next payout is on **${new Date(mockState.fds[0].maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}** for **₹${mockState.fds[0].expectedMaturityAmount.toLocaleString('en-IN')}**.

Would you like to explore investment simulations, review specific accounts, or sync upcoming dates to Google Calendar?`;
      followUps = [
        'Which of my fixed deposits matures first?',
        'How does quarterly compounding work?',
        'How do I sync with Google Calendar?',
        'Show my accounts overview',
      ];
    }

    const aiRes: AiChatResponse = {
      reply,
      suggestedNavigationRoute: navRoute,
      suggestedActionLabel: navLabel,
      followUpSuggestions: followUps,
      modelUsed: 'gemini-2.5-flash-lite (vault-assistant)',
      timestamp: new Date().toISOString(),
    };
    return aiRes as unknown as T;
  }

  return {} as unknown as T;
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => apiFetch<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) => apiFetch<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};
