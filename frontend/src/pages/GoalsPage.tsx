import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Shield, Info, ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../services/apiClient';
import { SavingsGoal } from '../types';
import { getGoogleCalendarUrl } from '../utils/googleCalendar';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Allocate Modal
  const [allocateGoal, setAllocateGoal] = useState<SavingsGoal | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateError, setAllocateError] = useState<string | null>(null);

  // Create Goal Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Emergency Fund');
  const [newTarget, setNewTarget] = useState(100000);
  const [newInitialAlloc, setNewInitialAlloc] = useState(10000);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const data = await api.get<SavingsGoal[]>('/goals');
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateGoal) return;
    setAllocateError(null);
    const amt = Number(allocateAmount);
    if (!amt || amt <= 0) {
      setAllocateError('Enter a valid allocation amount.');
      return;
    }

    try {
      await api.post(`/goals/${allocateGoal.id}/allocate`, {
        amount: amt,
        notes: 'Client UI earmark allocation',
      });
      setAllocateGoal(null);
      setAllocateAmount('');
      await loadGoals();
    } catch (err: any) {
      setAllocateError(err.message || 'Allocation failed. Check available balance.');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        accountId: 'acc-001',
        title: newTitle,
        category: newCategory,
        targetAmount: newTarget,
        initialAllocation: newInitialAlloc,
        targetDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      });
      setCreateOpen(false);
      setNewTitle('');
      await loadGoals();
    } catch (err) {
      console.error('Failed to create goal', err);
    }
  };

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
          <span className="text-xs uppercase tracking-widest text-stone-muted">Wealth Preservation</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Savings Goals & Earmarks</h1>
          <p className="text-sm text-stone-muted mt-1">Virtual allocations reserving available liquidity without inflating ledger balances.</p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold flex items-center gap-2 shadow-lg shadow-champagne/10"
        >
          <Plus className="w-4 h-4" /> Create New Goal
        </button>
      </div>

      {/* Critical Invariant Callout */}
      <div className="p-4 rounded-xl bg-charcoal border border-gold-subtle flex items-start gap-3 text-xs text-stone-muted">
        <Info className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
        <p>
          <strong className="text-ivory">Accounting Invariant: </strong>
          Goal allocations are virtual earmarks against your primary reserve account. They reduce your Available Balance so funds are not inadvertently spent, while your actual bank balance remains completely untouched. No fake deposit or withdrawal transactions are created.
        </p>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="glass-panel p-6 rounded-2xl relative space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-muted">{goal.category}</span>
                <h3 className="text-xl font-serif font-bold text-ivory mt-0.5">{goal.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                goal.status === 'Achieved'
                  ? 'bg-success/15 text-success border-success/30'
                  : 'bg-champagne/15 text-champagne border-gold-subtle'
              }`}>
                {goal.status}
              </span>
            </div>

            {/* Target vs Allocated */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-serif font-bold text-champagne">
                  ₹{goal.allocatedAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-muted">
                  of ₹{goal.targetAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-stone-muted/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-champagne-light to-champagne h-full rounded-full transition-all duration-500"
                  style={{ width: `${goal.progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-stone-muted pt-1">
                <span>{goal.progressPercentage}% Funded</span>
                <span>₹{goal.remainingAmount.toLocaleString('en-IN')} Remaining</span>
              </div>
            </div>

            {/* Account Details */}
            <div className="p-3 rounded-xl bg-charcoal/50 border border-gold-subtle/30 text-xs flex justify-between items-center">
              <span className="text-stone-muted">Earmarked on:</span>
              <span className="text-ivory font-mono">{goal.accountNumber}</span>
            </div>

            {/* Actions: Allocate & Google Calendar Target Sync */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setAllocateGoal(goal)}
                className="w-full py-2.5 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Allocate Additional Funds
              </button>

              <a
                href={getGoogleCalendarUrl({
                  title: `VaultBank Goal Target: ${goal.title} (Target: ₹${goal.targetAmount.toLocaleString('en-IN')})`,
                  description: `Target date for savings goal "${goal.title}". Earmarked: ₹${goal.allocatedAmount.toLocaleString('en-IN')} of ₹${goal.targetAmount.toLocaleString('en-IN')} (${goal.progressPercentage}% complete).`,
                  startDate: goal.targetDate,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-xl btn-gold-outline text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-champagne" />
                <span>Sync Target to Google Calendar</span>
                <ExternalLink className="w-3 h-3 text-stone-muted" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Allocate Funds Modal */}
      {allocateGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-gold-bright space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-ivory">Allocate Virtual Funds</h3>
            <p className="text-xs text-stone-muted">
              Reserving funds for &ldquo;{allocateGoal.title}&rdquo;. Available balance will decrease; actual bank balance remains untouched.
            </p>

            {allocateError && (
              <div className="p-3 rounded-lg bg-burgundy/20 border border-burgundy/40 text-xs text-ivory">
                {allocateError}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs text-stone-muted block mb-1">Earmark Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  max="1000000"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAllocateGoal(null)}
                  className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold"
                >
                  Confirm Earmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-gold-bright space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-ivory">Create Savings Goal</h3>
            <p className="text-xs text-stone-muted">Establish a dedicated virtual reserve target.</p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs text-stone-muted block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Luxury Travel Fund"
                  className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="text-xs text-stone-muted block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Travel">Travel</option>
                  <option value="Tech">Technology</option>
                  <option value="Education">Education</option>
                  <option value="General">General Savings</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-muted block mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="5000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="text-xs text-stone-muted block mb-1">Initial Earmark (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newInitialAlloc}
                  onChange={(e) => setNewInitialAlloc(Number(e.target.value))}
                  className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold"
                >
                  Establish Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
