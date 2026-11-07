import React, { useState, useEffect } from 'react';
import { BrainCircuit, Landmark, PieChart, Bell, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../services/apiClient';
import { MonthlyPulse, CategorySpending, FinancialAlert, MacroIndicators } from '../types';

export const IntelligencePage: React.FC = () => {
  const [pulse, setPulse] = useState<MonthlyPulse | null>(null);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [macro, setMacro] = useState<MacroIndicators | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIntelligence() {
      try {
        const [pl, sp, al, mc] = await Promise.all([
          api.get<MonthlyPulse>('/intelligence/monthly-pulse'),
          api.get<CategorySpending[]>('/intelligence/spending'),
          api.get<FinancialAlert[]>('/intelligence/alerts'),
          api.get<MacroIndicators>('/intelligence/macro-indicators'),
        ]);
        setPulse(pl);
        setSpending(sp);
        setAlerts(al);
        setMacro(mc);
      } catch (err) {
        console.error('Failed to load intelligence data', err);
      } finally {
        setLoading(false);
      }
    }
    loadIntelligence();
  }, []);

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
          <span className="text-xs uppercase tracking-widest text-champagne font-semibold">Wealth Intelligence</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Vault Intelligence Hub</h1>
          <p className="text-sm text-stone-muted mt-1">Deterministic analytics, macroeconomic indicators, and proactive alerts.</p>
        </div>
      </div>

      {/* Macro Indicators Banner */}
      {macro && (
        <div className="glass-panel p-6 rounded-2xl border-gold-bright space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gold-subtle/40">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-5 h-5 text-champagne" />
              <h3 className="text-base font-serif font-bold text-ivory">Authoritative Central Bank Indicators</h3>
            </div>
            <span className="text-[11px] text-stone-muted">
              Source: <strong className="text-ivory">{macro.source}</strong> (Updated: {new Date(macro.lastUpdated).toLocaleDateString()})
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-charcoal/60 border border-gold-subtle/40">
              <span className="text-xs text-stone-muted block">RBI Policy Repo Rate</span>
              <span className="text-2xl font-serif font-bold text-champagne">{macro.repoRate}%</span>
              <span className="text-[10px] text-stone-muted block mt-1">Benchmark Lending Floor</span>
            </div>
            <div className="p-4 rounded-xl bg-charcoal/60 border border-gold-subtle/40">
              <span className="text-xs text-stone-muted block">Reverse Repo Rate</span>
              <span className="text-2xl font-serif font-bold text-ivory">{macro.reverseRepoRate}%</span>
              <span className="text-[10px] text-stone-muted block mt-1">Interbank Liquidity Absorption</span>
            </div>
            <div className="p-4 rounded-xl bg-charcoal/60 border border-gold-subtle/40">
              <span className="text-xs text-stone-muted block">Headline CPI Inflation</span>
              <span className="text-2xl font-serif font-bold text-ivory">{macro.inflationRate}%</span>
              <span className="text-[10px] text-stone-muted block mt-1">Within RBI Target Band</span>
            </div>
            <div className="p-4 rounded-xl bg-charcoal/60 border border-gold-subtle/40">
              <span className="text-xs text-stone-muted block">Real Return Spread</span>
              <span className="text-2xl font-serif font-bold text-success">+2.90%</span>
              <span className="text-[10px] text-stone-muted block mt-1">Vault Fixed Deposit Net Alpha</span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column: Category Spending & Financial Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Breakdown */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Monthly Outflow Categorization</h3>
              <p className="text-xs text-stone-muted">Rule-based classification of withdrawal activity.</p>
            </div>
            <PieChart className="w-5 h-5 text-champagne" />
          </div>

          <div className="space-y-4">
            {spending.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ivory font-medium">{item.category}</span>
                  <span className="text-champagne font-serif font-bold">
                    ₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-obsidian h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-champagne-light to-champagne h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Alerts */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gold-subtle/30">
            <div>
              <h3 className="text-xl font-serif font-bold text-ivory">Intelligence & Milestone Alerts</h3>
              <p className="text-xs text-stone-muted">Rule-based proactive portfolio notifications.</p>
            </div>
            <Bell className="w-5 h-5 text-champagne" />
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl bg-charcoal/50 border border-gold-subtle/40 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-champagne font-semibold font-serif">{alert.title}</span>
                  <span className="text-[10px] text-stone-muted">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-stone-muted leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
