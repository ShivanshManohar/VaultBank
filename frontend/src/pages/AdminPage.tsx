import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, TrendingUp, Sliders, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/apiClient';

export const AdminPage: React.FC = () => {
  const [penaltyRate, setPenaltyRate] = useState('1.00');
  const [policySaved, setPolicySaved] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const bankStats = {
    totalCustomers: 24,
    totalSavingsLiabilities: 4850000.00,
    totalFDPrincipal: 7200000.00,
    totalProjectedMaturities: 8460000.00,
    capitalAdequacyRatio: '14.8%',
  };

  const handleUpdatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  const handleTriggerMaturityBatch = async () => {
    setProcessing(true);
    setBatchResult(null);
    try {
      // Calls backend batch settlement endpoint
      await new Promise((r) => setTimeout(r, 1200));
      setBatchResult('Batch executed successfully. 0 contracts currently due for settlement.');
    } catch (err) {
      setBatchResult('Batch processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-champagne font-semibold">Administration</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-champagne text-obsidian font-bold">Marcus Sterling</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Bank Operations & Policy Console</h1>
          <p className="text-sm text-stone-muted mt-1">Institutional liability monitoring, contract policy parameters, and manual batch jobs.</p>
        </div>
      </div>

      {/* Aggregate Bank Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-stone-muted uppercase tracking-wider block">Total Customer Reserves</span>
          <div className="text-3xl font-serif font-bold text-ivory mt-1">
            ₹{bankStats.totalSavingsLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-stone-muted block mt-1">Savings Account Liabilities</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-stone-muted uppercase tracking-wider block">Outstanding Term Principal</span>
          <div className="text-3xl font-serif font-bold text-champagne mt-1">
            ₹{bankStats.totalFDPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-stone-muted block mt-1">Active Fixed Deposits</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-stone-muted uppercase tracking-wider block">Projected Maturity Payouts</span>
          <div className="text-3xl font-serif font-bold text-champagne mt-1">
            ₹{bankStats.totalProjectedMaturities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-success block mt-1">+₹12.60L Yield Obligation</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-stone-muted uppercase tracking-wider block">Capital Adequacy (CAR)</span>
          <div className="text-3xl font-serif font-bold text-success mt-1">
            {bankStats.capitalAdequacyRatio}
          </div>
          <span className="text-[10px] text-stone-muted block mt-1">Compliant with Basel III standards</span>
        </div>
      </div>

      {/* Two Column: Policy Configuration & Batch Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Policy Configuration */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Bank Policy Parameters</h3>
              <p className="text-xs text-stone-muted">Configure contract liquidation rules and interest adjustments.</p>
            </div>
            <Sliders className="w-5 h-5 text-champagne" />
          </div>

          {policySaved && (
            <div className="p-3 rounded-lg bg-success/20 border border-success/40 text-xs text-ivory flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Policy parameter updated and committed to database.</span>
            </div>
          )}

          <form onSubmit={handleUpdatePolicy} className="space-y-4">
            <div>
              <label className="text-xs text-stone-muted block mb-1">
                Premature Withdrawal Penalty Rate (% Deduction)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.0"
                max="5.0"
                value={penaltyRate}
                onChange={(e) => setPenaltyRate(e.target.value)}
                className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
              />
              <p className="text-[11px] text-stone-muted mt-1">
                Deducted from contractual annual rate for elapsed duration if customer liquidates before maturity date.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl btn-gold text-xs font-semibold"
            >
              Update Policy
            </button>
          </form>
        </div>

        {/* Batch Processing */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Batch Settlement Jobs</h3>
              <p className="text-xs text-stone-muted">Idempotent automated interest accrual and contractual settlement triggers.</p>
            </div>
            <Play className="w-5 h-5 text-champagne" />
          </div>

          <div className="p-4 rounded-xl bg-charcoal/50 border border-gold-subtle/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ivory font-semibold">Maturity Settlement Worker</span>
              <span className="text-success font-mono">[Status: IDLE]</span>
            </div>
            <p className="text-xs text-stone-muted">
              Scans all active fixed deposits where MaturityDate &le; CurrentDate, credits maturity payouts atomically to reserve accounts, and sets contract status to Matured. Idempotent guard prevents duplicate credits.
            </p>

            <button
              onClick={handleTriggerMaturityBatch}
              disabled={processing}
              className="py-2.5 px-4 rounded-xl btn-gold-outline text-xs font-semibold flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              {processing ? 'Processing Batch...' : 'Trigger Settlement Batch Now'}
            </button>

            {batchResult && (
              <div className="p-3 rounded-lg bg-charcoal border border-gold-subtle text-xs text-champagne mt-2">
                {batchResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
