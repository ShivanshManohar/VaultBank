import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../services/apiClient';
import { FixedDeposit } from '../types';
import { getGoogleCalendarUrl } from '../utils/googleCalendar';

interface FixedDepositsPageProps {
  initialBookParams?: { amount: number; tenureMonths: number; rate: number } | null;
  onClearBookParams: () => void;
}

export const FixedDepositsPage: React.FC<FixedDepositsPageProps> = ({
  initialBookParams,
  onClearBookParams,
}) => {
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  // Create FD Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPrincipal, setCreatePrincipal] = useState(50000);
  const [createTenure, setCreateTenure] = useState(24);
  const [createRate, setCreateRate] = useState(7.25);
  const [createError, setCreateError] = useState<string | null>(null);

  // Premature Liquidation Modal
  const [liquidateFd, setLiquidateFd] = useState<FixedDeposit | null>(null);
  const [liquidateLoading, setLiquidateLoading] = useState(false);

  useEffect(() => {
    loadFDs();
  }, []);

  useEffect(() => {
    if (initialBookParams) {
      setCreatePrincipal(initialBookParams.amount);
      setCreateTenure(initialBookParams.tenureMonths);
      setCreateRate(initialBookParams.rate);
      setCreateModalOpen(true);
      onClearBookParams();
    }
  }, [initialBookParams]);

  async function loadFDs() {
    try {
      const data = await api.get<FixedDeposit[]>('/fds');
      setFds(data);
    } catch (err) {
      console.error('Failed to load fixed deposits', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await api.post('/fds', {
        sourceAccountId: 'acc-001',
        principalAmount: createPrincipal,
        tenureMonths: createTenure,
        interestRate: createRate,
        compoundingFrequency: 'Quarterly',
      });
      setCreateModalOpen(false);
      await loadFDs();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to book term deposit.');
    }
  };

  const handleExecuteLiquidation = async () => {
    if (!liquidateFd) return;
    setLiquidateLoading(true);
    try {
      await api.post(`/fds/${liquidateFd.id}/premature-withdraw`);
      setLiquidateFd(null);
      await loadFDs();
    } catch (err) {
      console.error('Premature liquidation failed', err);
    } finally {
      setLiquidateLoading(false);
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
          <span className="text-xs uppercase tracking-widest text-stone-muted">Fixed Income Portfolio</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Fixed Deposits Portfolio</h1>
          <p className="text-sm text-stone-muted mt-1">Guaranteed term compounding governed by contractual banking policies.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold flex items-center gap-2 shadow-lg shadow-champagne/10"
        >
          <Plus className="w-4 h-4" /> Open Term Deposit
        </button>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fds.map((fd) => {
          const isActive = fd.status === 'Active';
          return (
            <div
              key={fd.id}
              className={`glass-panel p-6 rounded-2xl relative space-y-4 ${
                !isActive ? 'opacity-70 bg-charcoal/40' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-stone-muted">{fd.fdNumber}</span>
                  <div className="text-2xl font-serif font-bold text-champagne mt-0.5">
                    ₹{fd.principalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                    isActive
                      ? 'bg-success/15 text-success border-success/30'
                      : 'bg-stone-muted/15 text-stone-muted border-stone-muted/30'
                  }`}
                >
                  {fd.status}
                </span>
              </div>

              {/* Progress & Maturity Dates */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-stone-muted">
                  <span>Progress to Maturity</span>
                  <span className="text-champagne font-semibold">{fd.progressPercentage}%</span>
                </div>
                <div className="w-full bg-obsidian h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-champagne-light to-champagne h-full rounded-full transition-all duration-500"
                    style={{ width: `${fd.progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-stone-muted pt-1">
                  <span>Start: {new Date(fd.startDate).toLocaleDateString()}</span>
                  <span>Matures: {new Date(fd.maturityDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Terms Breakdown */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-charcoal/50 border border-gold-subtle/30 text-xs">
                <div>
                  <span className="text-stone-muted block">Contract Rate</span>
                  <span className="text-ivory font-semibold">{fd.interestRate}% Quarterly</span>
                </div>
                <div>
                  <span className="text-stone-muted block">Tenure</span>
                  <span className="text-ivory font-semibold">{fd.tenureMonths / 12} Years ({fd.tenureMonths} Mo)</span>
                </div>
                <div>
                  <span className="text-stone-muted block">Accrued to Date</span>
                  <span className="text-success font-semibold">+₹{fd.accruedInterest.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-stone-muted block">Maturity Payout</span>
                  <span className="text-champagne font-bold">₹{fd.expectedMaturityAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions: Google Calendar Sync & Premature Liquidation */}
              {isActive && (
                <div className="space-y-2 pt-1">
                  <a
                    href={getGoogleCalendarUrl({
                      title: `VaultBank FD Maturity: ${fd.fdNumber} (₹${fd.expectedMaturityAmount.toLocaleString('en-IN')})`,
                      description: `Maturity settlement for term deposit ${fd.fdNumber}. Principal ₹${fd.principalAmount.toLocaleString('en-IN')} with ₹${fd.expectedTotalInterest.toLocaleString('en-IN')} compound interest. Scheduled automatic credit to reserve.`,
                      startDate: fd.maturityDate,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl btn-gold-outline text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-champagne" />
                    <span>Add Maturity to Google Calendar</span>
                    <ExternalLink className="w-3 h-3 text-stone-muted" />
                  </a>

                  <button
                    onClick={() => setLiquidateFd(fd)}
                    className="w-full py-2 rounded-xl border border-burgundy/40 text-burgundy text-xs font-semibold hover:bg-burgundy/10 transition"
                  >
                    Premature Liquidation (Subject to 1.00% penalty)
                  </button>
                </div>
              )}

              {!isActive && (
                <div className="text-center text-xs text-stone-muted italic py-1">
                  Contract Settled & Closed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Book New FD Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-gold-bright space-y-5">
            <h3 className="text-2xl font-serif font-bold text-ivory">Book Fixed Deposit</h3>
            <p className="text-xs text-stone-muted">
              Funds will be transferred atomically from your primary reserve account. Quarterly compounding applies.
            </p>

            {createError && (
              <div className="p-3 rounded-lg bg-burgundy/20 border border-burgundy/40 text-xs text-ivory">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateFD} className="space-y-4">
              <div>
                <label className="text-xs text-stone-muted block mb-1">Principal Amount (₹)</label>
                <input
                  type="number"
                  min="5000"
                  max="10000000"
                  step="5000"
                  value={createPrincipal}
                  onChange={(e) => setCreatePrincipal(Number(e.target.value))}
                  className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone-muted block mb-1">Tenure (Months)</label>
                  <select
                    value={createTenure}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setCreateTenure(m);
                      setCreateRate(m >= 60 ? 7.75 : m >= 36 ? 7.50 : m >= 24 ? 7.25 : 6.80);
                    }}
                    className="w-full bg-obsidian border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-muted block mb-1">Applicable Rate</label>
                  <input
                    type="text"
                    disabled
                    value={`${createRate}% Quarterly`}
                    className="w-full bg-charcoal border border-gold-subtle/40 rounded-xl px-3.5 py-2.5 text-sm text-champagne font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Confirmation Preview */}
              <div className="p-4 rounded-xl bg-charcoal border border-gold-subtle text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-muted">Contract Duration:</span>
                  <span className="text-ivory font-medium">{createTenure / 12} Years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-muted">Maturity Date:</span>
                  <span className="text-ivory font-medium">
                    {new Date(Date.now() + createTenure * 30 * 24 * 3600 * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gold-subtle/30 pt-1.5 text-sm font-serif">
                  <span className="text-ivory font-bold">Estimated Maturity Payout:</span>
                  <span className="text-champagne font-bold">
                    ₹{Math.round(createPrincipal * Math.pow(1 + (createRate / 100) / 4, 4 * (createTenure / 12))).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold"
                >
                  Confirm & Fund FD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premature Liquidation Modal */}
      {liquidateFd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-burgundy/60 space-y-4">
            <div className="flex items-center gap-3 text-burgundy">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-xl font-serif font-bold text-ivory">Premature Liquidation Preview</h3>
            </div>

            <p className="text-xs text-stone-muted leading-relaxed">
              Under Bank Policy, premature withdrawal incurs a **1.00% penalty** deduction from the contractual interest rate ({liquidateFd.interestRate}% &rarr; {liquidateFd.interestRate - 1}%).
            </p>

            <div className="p-4 rounded-xl bg-charcoal border border-gold-subtle space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-muted">Principal to Return:</span>
                <span className="text-ivory font-medium">₹{liquidateFd.principalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-muted">Accrued Interest (Penalized):</span>
                <span className="text-success font-medium">+₹{Math.round(liquidateFd.accruedInterest * 0.85).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-muted">Penalty Deducted (1.00%):</span>
                <span className="text-burgundy font-medium">-₹{Math.round(liquidateFd.principalAmount * 0.01).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-gold-subtle/30 pt-2 text-sm font-serif">
                <span className="text-ivory font-bold">Net Payable Proceeds:</span>
                <span className="text-champagne font-bold text-base">
                  ₹{(liquidateFd.principalAmount + Math.round(liquidateFd.accruedInterest * 0.85)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLiquidateFd(null)}
                className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={liquidateLoading}
                onClick={handleExecuteLiquidation}
                className="flex-1 py-2.5 rounded-xl bg-burgundy hover:brightness-110 text-ivory text-xs font-semibold transition"
              >
                {liquidateLoading ? 'Settling...' : 'Confirm Liquidation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
