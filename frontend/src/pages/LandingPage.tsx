import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, Lock, BrainCircuit } from 'lucide-react';

interface LandingPageProps {
  onEnterPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal }) => {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Gold Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-champagne/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-champagne/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Editorial Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-subtle bg-charcoal/80 mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-champagne" />
          <span className="text-xs uppercase tracking-widest text-champagne font-medium">
            The New Era of Private Wealth
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl font-serif font-bold text-ivory tracking-tight leading-none mb-6">
          Beyond Banking. <br />
          <span className="italic font-normal text-champagne">Into Wealth Intelligence.</span>
        </h1>

        {/* Brand Narrative */}
        <p className="max-w-2xl mx-auto text-lg text-stone-muted leading-relaxed mb-10">
          VaultBank unites private reserve commercial banking with deterministic compound growth simulation, virtual goal earmarking, and **VAULT AI** — your context-aware financial co-pilot.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterPortal}
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn-gold flex items-center justify-center gap-3 text-base font-semibold shadow-xl shadow-champagne/20 group"
          >
            Launch Private Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn-gold-outline text-base"
          >
            Explore System Architecture
          </a>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 pt-12 border-t border-gold-subtle/40">
          <div>
            <div className="font-serif text-3xl font-bold text-champagne">7.75%</div>
            <div className="text-xs text-stone-muted uppercase tracking-wider mt-1">Sovereign Term Yield</div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-ivory">Quarterly</div>
            <div className="text-xs text-stone-muted uppercase tracking-wider mt-1">Compounding Discipline</div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-champagne">Zero Leakage</div>
            <div className="text-xs text-stone-muted uppercase tracking-wider mt-1">Virtual Goal Accounting</div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-ivory">Gemini 2.5</div>
            <div className="text-xs text-stone-muted uppercase tracking-wider mt-1">Contextual AI Co-Pilot</div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ivory">Engineered for Absolute Precision</h2>
          <p className="text-sm text-stone-muted mt-2">Core commercial banking principles reinforced with modern intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Banking Core */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-champagne/15 border border-gold-subtle flex items-center justify-center text-champagne mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ivory mb-3">Institutional Banking Core</h3>
            <p className="text-sm text-stone-muted leading-relaxed">
              Multi-account savings architecture with atomic transaction logging, strict available balance validation, and zero overdraft vulnerability.
            </p>
          </div>

          {/* Card 2: Growth Simulators */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-champagne/15 border border-gold-subtle flex items-center justify-center text-champagne mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ivory mb-3">FD Growth Simulator</h3>
            <p className="text-sm text-stone-muted leading-relaxed">
              Interactive living compound trajectory curves from 1 to 15 years, side-by-side What-If scenario comparisons, and automated laddering strategies.
            </p>
          </div>

          {/* Card 3: VAULT AI */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-champagne/15 border border-gold-subtle flex items-center justify-center text-champagne mb-6">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ivory mb-3">VAULT AI Intelligence</h3>
            <p className="text-sm text-stone-muted leading-relaxed">
              Powered by Google Gemini 2.5. Reads authorized backend portfolio summaries, answers financial queries, and guides navigation with zero mutation risk.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Notice */}
      <footer className="border-t border-gold-subtle/40 py-8 bg-charcoal/50 text-center text-xs text-stone-muted">
        <p>VaultBank is an educational digital banking & wealth intelligence simulation platform.</p>
        <p className="mt-1">All deposits, yields, and portfolios are simulated for practical learning.</p>
      </footer>
    </div>
  );
};
