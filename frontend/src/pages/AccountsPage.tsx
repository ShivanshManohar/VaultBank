import React, { useState, useEffect } from 'react';
import { Building2, ArrowDownLeft, ArrowUpRight, Plus, Minus, Search, ShieldCheck } from 'lucide-react';
import { api } from '../services/apiClient';
import { SavingsAccount, Transaction } from '../types';

interface AccountsPageProps {
  onOpenDeposit: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onOpenDeposit }) => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCategory, setWithdrawCategory] = useState('Shopping');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountsAndLedger();
  }, [selectedCategory]);

  async function loadAccountsAndLedger() {
    try {
      const [accs, txs] = await Promise.all([
        api.get<SavingsAccount[]>('/accounts'),
        api.get<Transaction[]>(`/accounts/acc-001/transactions${selectedCategory !== 'All' ? `?category=${selectedCategory}` : ''}`),
      ]);
      setAccounts(accs);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load accounts and transactions', err);
    } finally {
      setLoading(false);
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawError('Please enter a valid positive withdrawal amount.');
      return;
    }

    try {
      await api.post('/accounts/acc-001/withdraw', {
        amount: amt,
        category: withdrawCategory,
        description: withdrawDescription || 'Client Simulated Withdrawal',
      });
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawDescription('');
      await loadAccountsAndLedger();
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed. Check available balance.');
    }
  };

  const categories = ['All', 'Salary', 'Shopping', 'Travel', 'Food', 'Utilities', 'Transfers'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-stone-muted">
        <div className="w-8 h-8 border-2 border-champagne border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/50">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-muted">Banking Core</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Savings Reserves & Accounts</h1>
          <p className="text-sm text-stone-muted mt-1">Multi-account architecture with atomic ledger tracking and strict available balance rules.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="px-4 py-2 rounded-xl btn-gold-outline text-xs font-semibold flex items-center gap-1.5"
          >
            <Minus className="w-3.5 h-3.5" /> Withdraw
          </button>
          <button
            onClick={onOpenDeposit}
            className="px-4 py-2 rounded-xl btn-gold text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-champagne/10"
          >
            <Plus className="w-3.5 h-3.5" /> Deposit
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass-panel p-6 rounded-2xl relative space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-stone-muted">{acc.accountNumber}</span>
                <h3 className="text-xl font-serif font-bold text-ivory mt-0.5">{acc.accountType}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-success/15 text-success border border-success/30">
                {acc.status}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs text-stone-muted block">Total Ledger Balance</span>
              <div className="text-3xl font-serif font-bold text-champagne">
                ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Invariant Balance Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gold-subtle/40 text-xs">
              <div>
                <span className="text-stone-muted block">Available to Spend/Lock</span>
                <span className="text-ivory font-bold text-sm">
                  ₹{acc.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-stone-muted block">Earmarked in Goals</span>
                <span className="text-champagne font-bold text-sm">
                  ₹{acc.earmarkedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History Ledger */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-subtle/40">
          <div>
            <h3 className="text-2xl font-serif font-bold text-ivory">Account Ledger</h3>
            <p className="text-xs text-stone-muted">Every transaction is validated, recorded atomically, and immutable.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-champagne text-obsidian font-semibold'
                    : 'bg-charcoal text-stone-muted hover:text-ivory'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gold-subtle text-stone-muted uppercase tracking-wider">
                <th className="pb-3">Reference / Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-subtle/30 text-stone-muted">
              {transactions.map((txn) => {
                const isDeposit = txn.type === 'Deposit' || txn.type === 'FDSettlement';
                return (
                  <tr key={txn.id} className="hover:bg-charcoal/40 transition">
                    <td className="py-3">
                      <div className="font-mono text-ivory">{txn.transactionReference}</div>
                      <div className="text-[10px] text-stone-muted">{new Date(txn.transactionDate).toLocaleString()}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-charcoal border border-gold-subtle/40 text-ivory">
                        {txn.category}
                      </span>
                    </td>
                    <td className="py-3 text-ivory font-medium max-w-xs truncate">{txn.description}</td>
                    <td className="py-3">
                      <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {txn.status}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-semibold text-sm ${isDeposit ? 'text-success' : 'text-ivory'}`}>
                      {isDeposit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-serif text-champagne font-bold text-sm">
                      ₹{txn.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-gold-bright space-y-4">
            <h3 className="text-xl font-serif font-bold text-ivory">Withdraw Funds</h3>
            <p className="text-xs text-stone-muted">
              Amount will be deducted from your primary reserve. Available balance validation enforced.
            </p>

            {withdrawError && (
              <div className="p-3 rounded-lg bg-burgundy/20 border border-burgundy/40 text-xs text-ivory">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs text-stone-muted block mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="text-xs text-stone-muted block mb-1">Category</label>
                <select
                  value={withdrawCategory}
                  onChange={(e) => setWithdrawCategory(e.target.value)}
                  className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Utilities">Utilities & Tech</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-muted block mb-1">Description</label>
                <input
                  type="text"
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  placeholder="e.g. Technology Equipment Purchase"
                  className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
