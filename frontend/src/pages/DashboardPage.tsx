import React, { useEffect, useState } from 'react';
import { TrendingUp, Shield, Clock, Target, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { api } from '../services/apiClient';
import { FinancialOverview, MonthlyPulse, Transaction, FixedDeposit } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenDeposit: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenDeposit }) => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [pulse, setPulse] = useState<MonthlyPulse | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [activeFds, setActiveFds] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [ov, pl, txs, fds] = await Promise.all([
          api.get<FinancialOverview>('/intelligence/overview'),
          api.get<MonthlyPulse>('/intelligence/monthly-pulse'),
          api.get<Transaction[]>('/accounts/acc-001/transactions'),
          api.get<FixedDeposit[]>('/fds'),
        ]);
        setOverview(ov);
        setPulse(pl);
        setRecentTxns(txs.slice(0, 5));
        setActiveFds(fds.filter((f: FixedDeposit) => f.status === 'Active'));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-stone-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-champagne border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Synthesizing VaultBank Financial Overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/50">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-muted">Client Financial Overview</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Welcome back, Alex.</h1>
          <p className="text-sm text-stone-muted mt-1">Primary Client Account: VB-CUST-104921</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('simulator')}
            className="px-4 py-2 rounded-xl btn-gold-outline text-xs font-semibold"
          >
            Launch Growth Simulator
          </button>
          <button
            onClick={onOpenDeposit}
            className="px-4 py-2 rounded-xl btn-gold text-xs font-semibold shadow-lg shadow-champagne/10"
          >
            Deposit Funds
          </button>
        </div>
      </div>

      {/* Monthly Financial Pulse Banner */}
      {pulse && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-charcoal via-charcoal to-champagne/10 border border-gold-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-champagne/15 border border-gold-subtle flex items-center justify-center text-champagne shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-champagne font-semibold">Monthly Financial Pulse</div>
              <p className="text-sm text-ivory mt-0.5">{pulse.editorialNarrative}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm shrink-0">
            <div>
              <span className="text-xs text-stone-muted block">Inflows</span>
              <span className="text-success font-semibold">+₹{pulse.totalDeposits.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-xs text-stone-muted block">Net Savings Rate</span>
              <span className="text-champagne font-bold">{pulse.savingsRatePercentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* The 4 Foundational Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Q1: How much money do I have? */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <span className="text-[11px] uppercase tracking-widest text-stone-muted block">1. Total Wealth (Net Worth)</span>
          <div className="text-3xl font-serif font-bold text-champagne mt-2">
            ₹{overview.netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-stone-muted mt-2">
            Liquid Savings: ₹{overview.totalSavingsBalance.toLocaleString('en-IN')} <br />
            Term Principal: ₹{overview.totalActiveFDPrincipal.toLocaleString('en-IN')}
          </p>
          <div className="absolute top-4 right-4 text-stone-muted group-hover:text-champagne transition-colors">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Q2: How is my money distributed? */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <span className="text-[11px] uppercase tracking-widest text-stone-muted block">2. Distribution & Liquidity</span>
          <div className="text-3xl font-serif font-bold text-ivory mt-2">
            ₹{overview.totalAvailableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-stone-muted mt-2">
            Free Available Balance <br />
            <span className="text-champagne">₹{overview.totalEarmarkedGoals.toLocaleString('en-IN')}</span> Earmarked for Goals
          </p>
          <div className="absolute top-4 right-4 text-stone-muted group-hover:text-champagne transition-colors">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Q3: How is my wealth growing? */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <span className="text-[11px] uppercase tracking-widest text-stone-muted block">3. Projected FD Maturity</span>
          <div className="text-3xl font-serif font-bold text-champagne mt-2">
            ₹{overview.totalProjectedFDMaturity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-stone-muted mt-2">
            Across {overview.activeFDsCount} active contracts <br />
            <span className="text-success font-semibold">+₹{(overview.totalProjectedFDMaturity - overview.totalActiveFDPrincipal).toLocaleString('en-IN')}</span> Total Expected Gain
          </p>
          <div className="absolute top-4 right-4 text-stone-muted group-hover:text-champagne transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Q4: What to pay attention to next? */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <span className="text-[11px] uppercase tracking-widest text-stone-muted block">4. Upcoming Maturity Event</span>
          <div className="text-3xl font-serif font-bold text-ivory mt-2">
            {overview.nextMaturityPayout ? `₹${overview.nextMaturityPayout.toLocaleString('en-IN')}` : 'No upcoming'}
          </div>
          <p className="text-xs text-stone-muted mt-2">
            Target Date: <span className="text-champagne font-medium">{overview.nextMaturityDate ? new Date(overview.nextMaturityDate).toLocaleDateString() : 'N/A'}</span> <br />
            Automatic settlement to primary reserve
          </p>
          <div className="absolute top-4 right-4 text-stone-muted group-hover:text-champagne transition-colors">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dual Column: Active Term Deposits & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Fixed Deposits */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Active Fixed Deposits</h3>
              <p className="text-xs text-stone-muted">Term deposits actively compounding at commercial rates.</p>
            </div>
            <button
              onClick={() => onNavigate('fds')}
              className="text-xs text-champagne font-semibold hover:underline"
            >
              View All ({activeFds.length})
            </button>
          </div>

          <div className="space-y-3">
            {activeFds.map((fd) => (
              <div key={fd.id} className="p-4 rounded-xl bg-charcoal/60 border border-gold-subtle/40 hover:border-champagne/60 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-stone-muted font-mono">{fd.fdNumber}</span>
                    <div className="text-lg font-serif font-bold text-ivory">
                      ₹{fd.principalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-champagne/15 text-champagne border border-gold-subtle">
                      {fd.interestRate}% Quarterly
                    </span>
                    <div className="text-xs text-stone-muted mt-1">
                      Matures: {new Date(fd.maturityDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Maturity Progress Bar */}
                <div className="w-full bg-obsidian h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-gradient-to-r from-champagne-light to-champagne h-full rounded-full transition-all duration-500"
                    style={{ width: `${fd.progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-muted mt-1">
                  <span>Compounding Progress: {fd.progressPercentage}%</span>
                  <span className="text-champagne font-medium">Maturity Payout: ₹{fd.expectedMaturityAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Recent Activity Ledger</h3>
              <p className="text-xs text-stone-muted">Immutable audited financial transaction history.</p>
            </div>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-xs text-champagne font-semibold hover:underline"
            >
              All Transactions
            </button>
          </div>

          <div className="space-y-3">
            {recentTxns.map((txn) => {
              const isDeposit = txn.type === 'Deposit' || txn.type === 'FDSettlement';
              return (
                <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-charcoal/40 border border-gold-subtle/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeposit ? 'bg-success/15 text-success' : 'bg-burgundy/15 text-burgundy'}`}>
                      {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ivory">{txn.description}</div>
                      <div className="text-[11px] text-stone-muted">
                        {txn.category} • {new Date(txn.transactionDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isDeposit ? 'text-success' : 'text-ivory'}`}>
                      {isDeposit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-stone-muted font-mono">
                      Ref: {txn.transactionReference.slice(-8)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
