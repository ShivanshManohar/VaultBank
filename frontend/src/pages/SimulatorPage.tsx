import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, Sliders, ArrowRight, CheckCircle2, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../services/apiClient';
import { GrowthSimulationResponse, ScenarioCompareResponse, FDLadderResponse, GrowthTrajectoryPoint, ScenarioCompareResultItem, FDLadderTranche } from '../types';
import { GrowthCurveChart } from '../components/charts/GrowthCurveChart';
import { getGoogleCalendarUrl } from '../utils/googleCalendar';

interface SimulatorPageProps {
  onBookFD: (amount: number, tenureMonths: number, rate: number) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ onBookFD }) => {
  const [activeTab, setActiveTab] = useState<'growth' | 'whatif' | 'ladder'>('growth');

  // Single FD Simulator State
  const [principal, setPrincipal] = useState(100000);
  const [tenureYears, setTenureYears] = useState(3);
  const [rate, setRate] = useState(7.25);
  const [frequency, setFrequency] = useState(4); // Quarterly
  const [growthData, setGrowthData] = useState<GrowthSimulationResponse | null>(null);

  // What-If Simulator State
  const [compareData, setCompareData] = useState<ScenarioCompareResponse | null>(null);

  // FD Ladder Simulator State
  const [ladderCapital, setLadderCapital] = useState(100000);
  const [ladderTranches, setLadderTranches] = useState(4);
  const [ladderData, setLadderData] = useState<FDLadderResponse | null>(null);

  // Load Single FD Simulation
  useEffect(() => {
    async function fetchGrowth() {
      try {
        const res = await api.post<GrowthSimulationResponse>('/simulation/fd-growth', {
          principalAmount: principal,
          tenureMonths: tenureYears * 12,
          interestRate: rate,
          compoundingFrequency: frequency,
        });
        setGrowthData(res);
      } catch (err) {
        console.error('Failed to simulate FD growth', err);
      }
    }
    fetchGrowth();
  }, [principal, tenureYears, rate, frequency]);

  // Load What-If Comparison
  useEffect(() => {
    if (activeTab === 'whatif') {
      async function fetchComparison() {
        try {
          const res = await api.post<ScenarioCompareResponse>('/simulation/compare', {
            scenarios: [
              { name: 'Conservative 2-Year', principalAmount: 50000, tenureMonths: 24, interestRate: 6.80, compoundingFrequency: 4 },
              { name: 'Balanced 3-Year', principalAmount: 50000, tenureMonths: 36, interestRate: 7.25, compoundingFrequency: 4 },
              { name: 'Maximum Yield 5-Year', principalAmount: 50000, tenureMonths: 60, interestRate: 7.75, compoundingFrequency: 4 },
            ],
          });
          setCompareData(res);
        } catch (err) {
          console.error('Failed to load comparison', err);
        }
      }
      fetchComparison();
    }
  }, [activeTab]);

  // Load FD Ladder
  useEffect(() => {
    if (activeTab === 'ladder') {
      async function fetchLadder() {
        try {
          const res = await api.post<FDLadderResponse>('/simulation/fd-ladder', {
            totalCapital: ladderCapital,
            numberOfTranches: ladderTranches,
            baseInterestRate: 6.50,
          });
          setLadderData(res);
        } catch (err) {
          console.error('Failed to build ladder', err);
        }
      }
      fetchLadder();
    }
  }, [activeTab, ladderCapital, ladderTranches]);

  const tenureOptions = [
    { label: '1 Year', years: 1, rate: 6.80 },
    { label: '2 Years', years: 2, rate: 7.10 },
    { label: '3 Years', years: 3, rate: 7.25 },
    { label: '5 Years', years: 5, rate: 7.60 },
    { label: '10 Years', years: 10, rate: 7.80 },
    { label: '15 Years', years: 15, rate: 8.00 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/50">
        <div>
          <span className="text-xs uppercase tracking-widest text-champagne font-semibold">Signature Feature</span>
          <h1 className="text-4xl font-serif font-bold text-ivory mt-1">Wealth Growth Simulators</h1>
          <p className="text-sm text-stone-muted mt-1">
            Deterministic compounding models engineered on quarterly commercial banking calculations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-charcoal border border-gold-subtle text-xs">
          <button
            onClick={() => setActiveTab('growth')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
              activeTab === 'growth' ? 'bg-champagne text-[#171717] shadow' : 'text-stone-muted hover:text-ivory'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            FD Growth Curve
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
              activeTab === 'whatif' ? 'bg-champagne text-[#171717] shadow' : 'text-stone-muted hover:text-ivory'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            What-If Comparison
          </button>
          <button
            onClick={() => setActiveTab('ladder')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
              activeTab === 'ladder' ? 'bg-champagne text-[#171717] shadow' : 'text-stone-muted hover:text-ivory'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Ladder Builder
          </button>
        </div>
      </div>

      {/* MODE 1: FD GROWTH SIMULATOR */}
      {activeTab === 'growth' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xl font-serif font-bold text-ivory">Investment Parameters</h3>

            {/* Principal Input */}
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-stone-muted">Investment Principal</span>
                <span className="text-xl font-serif font-bold text-champagne">
                  ₹{principal.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="5000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-champagne cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-muted mt-1">
                <span>₹10,000</span>
                <span>₹10,00,000</span>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex gap-2 mt-3">
                {[50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPrincipal(amt)}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      principal === amt
                        ? 'border-champagne bg-champagne/15 text-champagne font-semibold'
                        : 'border-gold-subtle/50 text-stone-muted hover:text-ivory'
                    }`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure Options */}
            <div>
              <label className="text-sm text-stone-muted block mb-2">Tenure Horizon</label>
              <div className="grid grid-cols-3 gap-2">
                {tenureOptions.map((opt) => (
                  <button
                    key={opt.years}
                    onClick={() => {
                      setTenureYears(opt.years);
                      setRate(opt.rate);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      tenureYears === opt.years
                        ? 'border-champagne bg-champagne/20 text-ivory font-bold'
                        : 'border-gold-subtle/40 bg-charcoal/40 text-stone-muted hover:text-ivory'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] text-champagne font-mono mt-0.5">{opt.rate}% p.a.</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Compounding Frequency */}
            <div>
              <label className="text-sm text-stone-muted block mb-2">Compounding Model</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFrequency(4)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                    frequency === 4
                      ? 'border-champagne bg-champagne/15 text-champagne'
                      : 'border-gold-subtle/40 text-stone-muted'
                  }`}
                >
                  Quarterly (Commercial Std)
                </button>
                <button
                  onClick={() => setFrequency(1)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                    frequency === 1
                      ? 'border-champagne bg-champagne/15 text-champagne'
                      : 'border-gold-subtle/40 text-stone-muted'
                  }`}
                >
                  Annual (Single Compounding)
                </button>
              </div>
            </div>

            {/* Book Now Action */}
            <div className="pt-4 border-t border-gold-subtle/40">
              <button
                onClick={() => onBookFD(principal, tenureYears * 12, rate)}
                className="w-full py-3.5 rounded-xl btn-gold text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-champagne/10"
              >
                Proceed to Book Fixed Deposit <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-stone-muted text-center mt-2">
                Authoritative terms confirmed on booking screen before funds deduction.
              </p>
            </div>
          </div>

          {/* Visualization Column */}
          <div className="lg:col-span-7 space-y-6">
            {growthData && (
              <>
                <GrowthCurveChart trajectory={growthData.trajectory} height={320} />

                {/* Trajectory Breakdown Table with Calendar Dates */}
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-base font-serif font-bold text-ivory">Milestone Projection Breakdown</h4>
                      <p className="text-xs text-stone-muted">Exact calendar dates when your capital increases to each projected payout.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gold-subtle text-stone-muted uppercase tracking-wider">
                          <th className="pb-2">Milestone</th>
                          <th className="pb-2">Calendar Target Date</th>
                          <th className="pb-2">Principal</th>
                          <th className="pb-2">Compounded Yield</th>
                          <th className="pb-2 text-right">Projected Value</th>
                          <th className="pb-2 text-right">Calendar Sync</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-subtle/30 text-stone-muted">
                        {growthData.trajectory.map((point: GrowthTrajectoryPoint, idx: number) => {
                          const dateObj = new Date(Date.now() + point.month * 30.4375 * 24 * 3600 * 1000);
                          const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                          const calUrl = getGoogleCalendarUrl({
                            title: `VaultBank Capital Milestone: ₹${point.totalValue.toLocaleString('en-IN')}`,
                            description: `Projected capital accumulation of ₹${point.totalValue.toLocaleString('en-IN')} (Yield: +₹${point.cumulativeInterest.toLocaleString('en-IN')}) reached by ${dateStr}.`,
                            startDate: dateObj,
                          });
                          return (
                            <tr key={idx} className="hover:bg-charcoal/40 transition">
                              <td className="py-2.5 text-ivory font-medium">Year {point.year} ({point.month}m)</td>
                              <td className="py-2.5 text-champagne font-medium flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-stone-muted" />
                                <span>{dateStr}</span>
                              </td>
                              <td className="py-2.5">₹{point.principal.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-success font-medium">+₹{point.cumulativeInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 text-right font-serif font-bold text-champagne text-sm">
                                ₹{point.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 text-right">
                                <a
                                  href={calUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-gold-subtle text-stone-muted hover:text-champagne hover:border-champagne transition"
                                  title="Add milestone to Google Calendar"
                                >
                                  <span>Sync</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: WHAT-IF SCENARIOS */}
      {activeTab === 'whatif' && compareData && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-charcoal border border-gold-subtle text-sm text-stone-muted">
            <span className="text-champagne font-semibold">Tradeoff Insight: </span>
            {compareData.tradeoffSummary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {compareData.results.map((sc: ScenarioCompareResultItem, i: number) => (
              <div key={i} className="glass-panel p-6 rounded-2xl space-y-4 relative">
                {sc.name === compareData.bestReturnScenario && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-champagne text-[#171717]">
                    Highest Nominal Gain
                  </span>
                )}
                <h4 className="text-xl font-serif font-bold text-ivory">{sc.name}</h4>
                <div className="space-y-2 text-sm text-stone-muted">
                  <div className="flex justify-between">
                    <span>Principal:</span>
                    <span className="text-ivory font-medium">₹{sc.principalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure:</span>
                    <span className="text-ivory font-medium">{sc.tenureMonths / 12} Years ({sc.tenureMonths} Mo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="text-champagne font-semibold">{sc.interestRate}% Quarterly</span>
                  </div>
                  <div className="flex justify-between border-t border-gold-subtle/30 pt-2 text-base">
                    <span className="text-ivory font-bold">Maturity Value:</span>
                    <span className="text-champagne font-serif font-bold">₹{sc.maturityAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-success">
                    <span>Net Yield:</span>
                    <span>+₹{sc.totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => onBookFD(sc.principalAmount, sc.tenureMonths, sc.interestRate)}
                  className="w-full mt-4 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                >
                  Book This Scenario
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 3: FD LADDER BUILDER */}
      {activeTab === 'ladder' && (
        <div className="space-y-6">
          {/* Ladder Configuration */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-sm text-stone-muted block">Total Capital to Partition</label>
              <input
                type="range"
                min="50000"
                max="1000000"
                step="25000"
                value={ladderCapital}
                onChange={(e) => setLadderCapital(Number(e.target.value))}
                className="w-full accent-champagne cursor-pointer"
              />
              <div className="flex justify-between text-xs text-champagne font-serif font-bold">
                <span>Selected Capital: ₹{ladderCapital.toLocaleString('en-IN')}</span>
                <span>Max: ₹10,00,000</span>
              </div>
            </div>

            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm text-stone-muted block">Number of Annual Tranches</label>
              <div className="flex gap-2">
                {[3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setLadderTranches(count)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                      ladderTranches === count
                        ? 'border-champagne bg-champagne/20 text-champagne'
                        : 'border-gold-subtle text-stone-muted'
                    }`}
                  >
                    {count} Years ({count} Tranches)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ladder Tranches Breakdown */}
          {ladderData && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-charcoal border border-gold-subtle text-sm text-stone-muted">
                <span className="text-champagne font-semibold">Laddering Strategy: </span>
                {ladderData.strategyExplanation}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {ladderData.tranches.map((tr: FDLadderTranche) => (
                  <div key={tr.trancheIndex} className="glass-panel p-5 rounded-xl border-gold-subtle space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-muted uppercase font-mono">Tranche {tr.trancheIndex}</span>
                      <span className="text-champagne font-semibold">{tr.applicableRate}%</span>
                    </div>
                    <div>
                      <div className="text-xs text-stone-muted">Maturity Horizon</div>
                      <div className="text-base font-serif font-bold text-ivory">Year {tr.tenureYears} ({tr.tenureMonths} Mo)</div>
                    </div>
                    <div className="pt-2 border-t border-gold-subtle/30">
                      <div className="text-xs text-stone-muted">Projected Payout</div>
                      <div className="text-xl font-serif font-bold text-champagne">₹{tr.maturityValue.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-success font-medium mt-0.5">+₹{tr.interestEarned.toLocaleString('en-IN')} Interest</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-charcoal border border-gold-bright flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-stone-muted block">Combined Projected Liquidity</span>
                  <div className="text-3xl font-serif font-bold text-champagne">
                    ₹{ladderData.combinedProjectedMaturity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-success mt-1">Total projected profit: +₹{ladderData.totalProjectedInterest.toLocaleString('en-IN')}</p>
                </div>

                <button
                  onClick={() => onBookFD(ladderCapital / ladderTranches, 12, 6.80)}
                  className="px-6 py-3 rounded-xl btn-gold text-xs font-semibold"
                >
                  Book First Ladder Tranche (1 Year)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
