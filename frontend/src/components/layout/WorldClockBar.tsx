import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Calendar, Sparkles, User, Globe2 } from 'lucide-react';

interface WorldClockBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userRole: 'Customer' | 'Admin';
  onToggleRole: () => void;
}

export const WorldClockBar: React.FC<WorldClockBarProps> = ({
  theme,
  onToggleTheme,
  userRole,
  onToggleRole,
}) => {
  const [time, setTime] = useState(new Date());
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  // Live ticking clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Events ticker rotation every 5 seconds
  const events = [
    { title: 'RBI Monetary Policy', detail: 'Policy Repo Rate benchmark locked at 6.50% p.a.' },
    { title: 'Upcoming FD Maturity', detail: 'VB-FD-770142 matures 10 May 2027 (Payout: ₹59,374.22)' },
    { title: 'Goal Milestone', detail: 'Emergency Liquidity Shield is 25% funded (₹25,000)' },
    { title: 'Interbank Settlement', detail: 'Real-time Gross Settlement (RTGS) window active' },
  ];

  useEffect(() => {
    const eventTimer = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(eventTimer);
  }, [events.length]);

  // Format time for timezones
  const formatTime = (tz: string) => {
    return time.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const currentDateFormatted = time.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-full bg-[var(--sub-bar-bg)] border-b border-gold-subtle/50 px-4 sm:px-6 lg:px-8 py-2 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: World Clocks & Authoritative Date */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Calendar Date */}
          <div className="flex items-center gap-1.5 text-champagne font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentDateFormatted}</span>
          </div>

          <div className="h-3 w-[1px] bg-gold-subtle/40 hidden sm:block" />

          {/* World Timezones */}
          <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px] text-stone-muted">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-ivory font-semibold">MUMBAI</span>
              <span className="text-champagne font-bold">{formatTime('Asia/Kolkata')}</span>
              <span className="text-[10px] text-stone-muted">IST</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <span className="text-ivory font-semibold">LONDON</span>
              <span className="text-stone-muted">{formatTime('Europe/London')}</span>
              <span className="text-[10px]">GMT</span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              <span className="text-ivory font-semibold">NEW YORK</span>
              <span className="text-stone-muted">{formatTime('America/New_York')}</span>
              <span className="text-[10px]">EST</span>
            </div>
          </div>
        </div>

        {/* Center: Live Financial Events Ticker */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-muted bg-charcoal/50 px-3 py-1 rounded-full border border-gold-subtle/40">
          <Sparkles className="w-3 h-3 text-champagne shrink-0" />
          <span className="font-semibold text-ivory">{events[activeEventIndex].title}:</span>
          <span className="truncate max-w-[280px]">{events[activeEventIndex].detail}</span>
        </div>

        {/* Right: Theme Toggle & Persona Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gold-subtle/60 text-ivory hover:border-champagne transition"
            title={`Switch to ${theme === 'dark' ? 'Light Ivory' : 'Dark Obsidian'} Theme`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-champagne" />
                <span className="hidden sm:inline text-[11px] font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-champagne" />
                <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
              </>
            )}
          </button>

          {/* Persona Role Switcher */}
          <button
            onClick={onToggleRole}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-charcoal border border-gold-subtle text-[11px] text-ivory hover:border-champagne transition"
            title="Toggle between Client (Alex Morgan) and Administrator (Marcus Sterling)"
          >
            <User className="w-3 h-3 text-champagne" />
            <span className="font-medium">{userRole === 'Admin' ? 'Marcus' : 'Alex'}</span>
            <span className="text-[9px] text-champagne uppercase font-mono">({userRole})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
