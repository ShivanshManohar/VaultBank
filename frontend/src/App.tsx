import React, { useState, useEffect } from 'react';
import { WorldClockBar } from './components/layout/WorldClockBar';
import { Navbar } from './components/layout/Navbar';
import { VaultAiDrawer } from './components/ai/VaultAiDrawer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { FixedDepositsPage } from './pages/FixedDepositsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { GoalsPage } from './pages/GoalsPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { JournalPage } from './pages/JournalPage';
import { AdminPage } from './pages/AdminPage';
import { api } from './services/apiClient';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [userRole, setUserRole] = useState<'Customer' | 'Admin'>('Customer');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vaultbank_theme') as 'dark' | 'light') || 'dark';
  });

  // Apply theme to HTML root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vaultbank_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Deposit Modal
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCategory, setDepositCategory] = useState('Salary');
  const [depositDesc, setDepositDesc] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Cross-page booking transfer
  const [bookParams, setBookParams] = useState<{ amount: number; tenureMonths: number; rate: number } | null>(null);

  const handleBookFromSimulator = (amount: number, tenureMonths: number, rate: number) => {
    setBookParams({ amount, tenureMonths, rate });
    setCurrentTab('fds');
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;

    try {
      await api.post('/accounts/acc-001/deposit', {
        amount: amt,
        category: depositCategory,
        description: depositDesc || 'Simulated Capital Credit',
      });
      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setDepositOpen(false);
        setDepositAmount('');
        setDepositDesc('');
      }, 1500);
    } catch (err) {
      console.error('Deposit error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-obsidian)] text-ivory flex flex-col font-sans transition-colors duration-200">
      {/* Tier 1: Fixed World Clock, Market Events Ticker & Global Controls */}
      <WorldClockBar
        theme={theme}
        onToggleTheme={toggleTheme}
        userRole={userRole}
        onToggleRole={() => setUserRole((r) => (r === 'Customer' ? 'Admin' : 'Customer'))}
      />

      {/* Tier 2: Spacious, Elegant Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={userRole}
        onOpenDepositModal={() => setDepositOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'landing' && <LandingPage onEnterPortal={() => setCurrentTab('dashboard')} />}
        {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} onOpenDeposit={() => setDepositOpen(true)} />}
        {currentTab === 'accounts' && <AccountsPage onOpenDeposit={() => setDepositOpen(true)} />}
        {currentTab === 'fds' && (
          <FixedDepositsPage
            initialBookParams={bookParams}
            onClearBookParams={() => setBookParams(null)}
          />
        )}
        {currentTab === 'simulator' && <SimulatorPage onBookFD={handleBookFromSimulator} />}
        {currentTab === 'goals' && <GoalsPage />}
        {currentTab === 'intelligence' && <IntelligencePage />}
        {currentTab === 'journal' && <JournalPage />}
        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Persistent Context-Aware VAULT AI Drawer */}
      <VaultAiDrawer currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Global Quick Deposit Modal */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-gold-bright space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-ivory">Deposit Simulated Funds</h3>
            <p className="text-xs text-stone-muted">
              Funds will be atomically credited to your Primary Reserve Account (VB-SAV-88029144).
            </p>

            {depositSuccess ? (
              <div className="p-4 rounded-xl bg-success/20 border border-success/40 text-center text-sm text-ivory font-semibold">
                ✓ Funds successfully credited! Ledger updated.
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-stone-muted block mb-1">Deposit Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10000000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-muted block mb-1">Category</label>
                  <select
                    value={depositCategory}
                    onChange={(e) => setDepositCategory(e.target.value)}
                    className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                  >
                    <option value="Salary">Executive Salary / Advisory</option>
                    <option value="Dividends">Dividends / Yield</option>
                    <option value="Transfers">External Wire Transfer</option>
                    <option value="Other">Other Capital</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-muted block mb-1">Description</label>
                  <input
                    type="text"
                    value={depositDesc}
                    onChange={(e) => setDepositDesc(e.target.value)}
                    placeholder="e.g. Quarterly Advisory Fee Remuneration"
                    className="w-full bg-charcoal border border-gold-subtle rounded-xl px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:border-champagne"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDepositOpen(false)}
                    className="flex-1 py-2.5 rounded-xl btn-gold-outline text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold"
                  >
                    Credit Deposit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
