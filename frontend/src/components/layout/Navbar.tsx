import React from 'react';
import { Shield, Sparkles, Building2, TrendingUp, Target, BrainCircuit, BookOpen, UserCheck, Plus } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: 'Customer' | 'Admin';
  onOpenDepositModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onOpenDepositModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Shield },
    { id: 'accounts', label: 'Accounts', icon: Building2 },
    { id: 'fds', label: 'Fixed Deposits', icon: TrendingUp },
    { id: 'simulator', label: 'Growth Simulator', icon: Sparkles },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'intelligence', label: 'Intelligence Hub', icon: BrainCircuit },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    ...(userRole === 'Admin' ? [{ id: 'admin', label: 'Admin Console', icon: UserCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--color-obsidian)]/95 backdrop-blur-md border-b border-gold-subtle transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Brand Monogram & Name */}
        <div
          className="flex items-center gap-3.5 cursor-pointer shrink-0"
          onClick={() => onSelectTab('landing')}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark p-[1.5px] flex items-center justify-center shadow-lg shadow-champagne/15">
            <div className="w-full h-full bg-[var(--color-obsidian)] rounded-[9.5px] flex items-center justify-center">
              <span className="font-serif font-bold text-2xl text-champagne">V</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-wider text-ivory">
                VAULT<span className="text-champagne">BANK</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-gold-subtle text-champagne bg-charcoal">
                Private
              </span>
            </div>
            <p className="text-[10px] text-stone-muted tracking-widest uppercase">
              Wealth Intelligence
            </p>
          </div>
        </div>

        {/* Spacious Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-charcoal text-champagne border border-gold-bright shadow-sm shadow-champagne/10'
                    : 'text-stone-muted hover:text-ivory hover:bg-charcoal/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-champagne' : 'text-stone-muted'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenDepositModal}
            className="px-4 py-2 rounded-xl btn-gold text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-champagne/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Capital</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2.5 bg-charcoal/60 border-t border-gold-subtle/30 gap-1.5 text-xs no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium ${
              currentTab === item.id
                ? 'bg-champagne/25 text-champagne font-bold border border-gold-subtle'
                : 'text-stone-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
