import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api } from '../services/apiClient';
import { WealthJournalSnapshot } from '../types';

export const JournalPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<WealthJournalSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJournal() {
      try {
        const data = await api.get<WealthJournalSnapshot[]>('/intelligence/journal');
        setSnapshots(data);
      } catch (err) {
        console.error('Failed to load wealth journal', err);
      } finally {
        setLoading(false);
      }
    }
    loadJournal();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-stone-muted">
        <div className="w-8 h-8 border-2 border-champagne border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || `Month ${month}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/50">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-muted">Historical Ledger</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Personal Wealth Journal</h1>
          <p className="text-sm text-stone-muted mt-1">Monthly immutable snapshots capturing the exact evolution of your balance and term yields.</p>
        </div>
      </div>

      {/* Snapshots Timeline */}
      <div className="space-y-6">
        {snapshots.map((snap, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl relative space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gold-subtle/40">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-champagne" />
                <h3 className="text-xl font-serif font-bold text-ivory">
                  {getMonthName(snap.snapshotMonth)} {snap.snapshotYear}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-champagne/15 text-champagne font-semibold border border-gold-subtle">
                Savings Rate: {snap.monthlySavingsRate}%
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-charcoal/50 border border-gold-subtle/30">
                <span className="text-stone-muted block">Closing Savings</span>
                <span className="text-xl font-serif font-bold text-ivory mt-0.5">
                  ₹{snap.closingSavings.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-muted block mt-1">
                  Opened at ₹{snap.openingSavings.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal/50 border border-gold-subtle/30">
                <span className="text-stone-muted block">Active FD Principal</span>
                <span className="text-xl font-serif font-bold text-champagne mt-0.5">
                  ₹{snap.totalFDPrincipal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-success block mt-1">
                  Accrued: +₹{snap.totalAccruedInterest.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal/50 border border-gold-subtle/30">
                <span className="text-stone-muted block">Total Monthly Inflows</span>
                <span className="text-xl font-serif font-bold text-success mt-0.5">
                  +₹{snap.totalDeposits.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-muted block mt-1">Payroll & Term Credits</span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal/50 border border-gold-subtle/30">
                <span className="text-stone-muted block">Total Outflows</span>
                <span className="text-xl font-serif font-bold text-ivory mt-0.5">
                  -₹{snap.totalWithdrawals.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-muted block mt-1">Discretionary & Expenses</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
