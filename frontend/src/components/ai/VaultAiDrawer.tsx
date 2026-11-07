import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, Send, ArrowRight, ShieldAlert, Bot, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../../services/apiClient';
import { AiChatResponse } from '../../types';

interface VaultAiDrawerProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  route?: string;
  actionLabel?: string;
  timestamp: string;
}

// Simple Markdown Formatter Helper
const FormattedAiText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-serif font-bold text-sm text-champagne pt-1">
              {line.replace('### ', '')}
            </h4>
          );
        }
        // Bullet points
        if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
          const content = line.trim().replace(/^[•-]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-champagne font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
            </div>
          );
        }
        // Standard text with bolding
        if (line.trim()) {
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
          );
        }
        return <div key={idx} className="h-1" />;
      })}
    </div>
  );
};

function parseBold(str: string): string {
  return str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-ivory font-semibold">$1</strong>');
}

export const VaultAiDrawer: React.FC<VaultAiDrawerProps> = ({ currentTab, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([
    'How much money do I have in total?',
    'Which of my fixed deposits matures first?',
    'How does quarterly compounding work?',
    'Explain the FD ladder strategy',
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Good day, Alex. I am **VAULT AI**, your private wealth intelligence co-pilot.\n\nI am synchronized with your **₹4,10,000** private reserve portfolio. You have 2 active term deposits maturing in 2027 and ₹1,60,000 available liquidity. How may I assist your financial journey today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    setInput('');
    const userMsg: Message = {
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.post<AiChatResponse>('/ai/chat', {
        prompt,
        activeRoute: `/${currentTab}`,
      });

      const aiMsg: Message = {
        sender: 'ai',
        text: response.reply,
        route: response.suggestedNavigationRoute,
        actionLabel: response.suggestedActionLabel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (response.followUpSuggestions && response.followUpSuggestions.length > 0) {
        setPromptSuggestions(response.followUpSuggestions);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Unable to reach the AI service at this moment. Your banking core remains fully operational.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Pill Entry Point */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-charcoal border border-gold-bright shadow-2xl shadow-champagne/20 hover:scale-105 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-full bg-champagne/20 flex items-center justify-center text-champagne group-hover:bg-champagne group-hover:text-obsidian transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-ivory tracking-wide">
            VAULT <span className="text-champagne">AI</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg h-[620px] bg-[var(--color-obsidian)] border border-gold-bright rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
          {/* Header */}
          <div className="px-5 py-4 bg-charcoal border-b border-gold-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-champagne/15 border border-gold-subtle flex items-center justify-center text-champagne">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-ivory tracking-wide flex items-center gap-1.5">
                  VAULT <span className="text-champagne">AI</span>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-obsidian border border-gold-subtle text-champagne">
                    Wealth Co-Pilot
                  </span>
                </h3>
                <p className="text-[10px] text-stone-muted">Active Scope: /{currentTab} • Read-Only Mode</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-stone-muted hover:text-ivory hover:bg-charcoal/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-champagne/20 text-ivory border border-gold-subtle rounded-br-none'
                      : 'bg-charcoal text-ivory border border-gold-subtle/60 rounded-bl-none shadow-md'
                  }`}
                >
                  <FormattedAiText text={m.text} />

                  {/* Navigation Action Dispatch Button */}
                  {m.route && (
                    <button
                      onClick={() => {
                        const target = m.route!.replace('/', '');
                        onNavigate(target === '' ? 'dashboard' : target);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-champagne/15 border border-gold-subtle text-xs text-champagne font-semibold hover:bg-champagne hover:text-obsidian transition"
                    >
                      <span>{m.actionLabel || 'Navigate to View'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-stone-muted mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-stone-muted text-xs p-2">
                <div className="w-2 h-2 rounded-full bg-champagne animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-champagne animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-champagne animate-bounce [animation-delay:0.4s]" />
                <span>VAULT AI synthesizing authenticated portfolio data...</span>
              </div>
            )}
          </div>

          {/* Dynamic Suggested Prompts Carousel */}
          <div className="px-4 py-2 border-t border-gold-subtle/40 bg-charcoal/50 flex gap-2 overflow-x-auto no-scrollbar">
            {promptSuggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] bg-charcoal border border-gold-subtle text-stone-muted hover:text-champagne hover:border-champagne transition shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-charcoal border-t border-gold-subtle flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about maturities, balances, compounding formulas, tax..."
              className="flex-1 bg-[var(--color-obsidian)] border border-gold-subtle rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ivory placeholder:text-stone-muted focus:outline-none focus:border-champagne"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl btn-gold disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Disclaimer */}
          <div className="px-4 py-1.5 bg-[var(--sub-bar-bg)] text-[10px] text-stone-muted text-center border-t border-gold-subtle/20 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-champagne" />
            <span>Educational wealth simulation. Informational summaries, not certified financial advice.</span>
          </div>
        </div>
      )}
    </>
  );
};
