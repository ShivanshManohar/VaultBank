export interface UserProfile {
  token: string;
  username: string;
  email: string;
  fullName: string;
  customerNumber: string;
  role: 'Customer' | 'Admin';
  customerId: string;
}

export interface SavingsAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  earmarkedAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionReference: string;
  type: string;
  amount: number;
  balanceAfter: number;
  category: string;
  description: string;
  transactionDate: string;
  status: string;
}

export interface FixedDeposit {
  id: string;
  fdNumber: string;
  sourceAccountId: string;
  sourceAccountNumber: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: string;
  tenureMonths: number;
  startDate: string;
  maturityDate: string;
  expectedMaturityAmount: number;
  expectedTotalInterest: number;
  accruedInterest: number;
  actualSettledAmount: number;
  penaltyDeducted: number;
  status: 'Active' | 'Matured' | 'PrematurelyClosed';
  progressPercentage: number;
}

export interface GrowthTrajectoryPoint {
  month: number;
  year: number;
  principal: number;
  cumulativeInterest: number;
  totalValue: number;
}

export interface GrowthSimulationResponse {
  principalAmount: number;
  tenureMonths: number;
  interestRate: number;
  compoundingFrequency: number;
  maturityAmount: number;
  totalInterestEarned: number;
  effectiveAnnualYield: number;
  trajectory: GrowthTrajectoryPoint[];
}

export interface ScenarioCompareResultItem {
  name: string;
  principalAmount: number;
  tenureMonths: number;
  interestRate: number;
  maturityAmount: number;
  totalInterest: number;
  returnMultiplier: number;
  trajectory: GrowthTrajectoryPoint[];
}

export interface ScenarioCompareResponse {
  results: ScenarioCompareResultItem[];
  bestReturnScenario: string;
  tradeoffSummary: string;
}

export interface FDLadderTranche {
  trancheIndex: number;
  tenureYears: number;
  tenureMonths: number;
  allocatedPrincipal: number;
  applicableRate: number;
  maturityValue: number;
  interestEarned: number;
  estimatedMaturityDate: string;
}

export interface FDLadderResponse {
  totalInvestedPrincipal: number;
  combinedProjectedMaturity: number;
  totalProjectedInterest: number;
  tranches: FDLadderTranche[];
  strategyExplanation: string;
}

export interface SavingsGoal {
  id: string;
  accountId: string;
  accountNumber: string;
  title: string;
  category: string;
  targetAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  targetDate: string;
  status: 'InProgress' | 'Achieved';
  createdAt: string;
}

export interface FinancialOverview {
  totalSavingsBalance: number;
  totalAvailableBalance: number;
  totalEarmarkedGoals: number;
  totalActiveFDPrincipal: number;
  totalProjectedFDMaturity: number;
  totalAccruedInterest: number;
  netWorth: number;
  activeAccountsCount: number;
  activeFDsCount: number;
  activeGoalsCount: number;
  nextMaturityDate: string | null;
  nextMaturityPayout: number | null;
}

export interface MonthlyPulse {
  month: number;
  year: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netSavings: number;
  savingsRatePercentage: number;
  editorialNarrative: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface FinancialAlert {
  id: string;
  alertType: string;
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WealthJournalSnapshot {
  snapshotYear: number;
  snapshotMonth: number;
  openingSavings: number;
  closingSavings: number;
  totalFDPrincipal: number;
  totalAccruedInterest: number;
  totalDeposits: number;
  totalWithdrawals: number;
  monthlySavingsRate: number;
  generatedAt: string;
}

export interface MacroIndicators {
  repoRate: number;
  reverseRepoRate: number;
  inflationRate: number;
  source: string;
  lastUpdated: string;
  isCached: boolean;
}

export interface AiChatResponse {
  reply: string;
  suggestedNavigationRoute?: string;
  suggestedActionLabel?: string;
  followUpSuggestions: string[];
  modelUsed: string;
  timestamp: string;
}
