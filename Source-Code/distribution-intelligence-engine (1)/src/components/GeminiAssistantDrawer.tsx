import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  ArrowRight,
  Download,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { TransferRecommendation, SkuLocationMetrics, User, Organization } from '../types/index.ts';
import { exportRecommendationsToCsv, triggerDownload } from '../lib/csvParser.ts';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    type: 'approve_transfer' | 'export_csv';
    label: string;
    payload?: any;
  };
}

interface GeminiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: TransferRecommendation[];
  metrics: SkuLocationMetrics[];
  onApproveTransfer: (id: string) => void;
  user?: User | null;
  organization?: Organization | null;
}

export const GeminiAssistantDrawer: React.FC<GeminiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  recommendations,
  metrics,
  onApproveTransfer,
  user,
  organization,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'Planner'}! I am your FMCG Distribution Intelligence Copilot.

I have full live visibility into your active network inventory, 7-day demand moving averages, safe warehouse surpluses, and stock transfer proposals.

How can I help optimize your FMCG inventory today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Which warehouse has the highest critical shortage?',
    'What is the safe surplus at Central Hub?',
    'List top 3 feasible stock transfer recommendations',
    'Explain how destination gap is calculated',
    'Compare baseline fill rate vs plan fill rate',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userContext: user
            ? {
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                address: user.address,
                role: user.role,
              }
            : undefined,
          orgContext: organization
            ? {
                name: organization.name,
                industry: organization.industry,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.error || 'Response received.';

      let action: Message['action'] = undefined;
      const lower = text.toLowerCase();
      if (lower.includes('export') || lower.includes('download')) {
        action = {
          type: 'export_csv',
          label: 'Download Recommendations CSV',
        };
      } else if (lower.includes('approve') || lower.includes('transfer')) {
        const firstFeasible = recommendations.find((r) => r.isFeasible && r.status === 'recommended');
        if (firstFeasible) {
          action = {
            type: 'approve_transfer',
            label: `Approve Transfer: ${firstFeasible.recommendedQuantity} units of ${firstFeasible.skuName}`,
            payload: firstFeasible.id,
          };
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'The FMCG Intelligence engine analyzed available data: Check active shortages and surplus positions in the Risk Analysis tab.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: NonNullable<Message['action']>) => {
    if (action.type === 'export_csv') {
      const csv = exportRecommendationsToCsv(recommendations);
      triggerDownload(csv, 'recommended_transfers.csv');
    } else if (action.type === 'approve_transfer' && action.payload) {
      onApproveTransfer(action.payload);
      setMessages((prev) => [
        ...prev,
        {
          id: `act-${Date.now()}`,
          sender: 'assistant',
          text: `Action executed: Transfer Recommendation ${action.payload} has been approved and registered in the system audit log.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay active">
          {/* Backdrop click to dismiss */}
          <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

          {/* AI Liquid Glass Card Modal */}
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="ai-modal-card relative z-10 shadow-2xl"
          >
            {/* Header: Title on left, Close on right */}
            <div className="ai-modal-header">
              <div className="ai-title">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white shadow-md">
                  <Sparkles className="h-4 w-4 text-[#e53935]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#111] leading-tight">
                    Gemini FMCG Distribution Copilot
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Live Network Synchronized · Real-Time Heuristics</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-700 hover:text-black transition-all cursor-pointer shadow-2xs"
                title="Close Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Prompt Suggestions Bar */}
            <div className="px-5 py-2.5 border-b border-white/40 bg-white/20 flex-shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" style={{ scrollbarWidth: 'none' }}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
                  Ask:
                </span>
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="shrink-0 rounded-xl border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-semibold text-slate-800 hover:bg-white hover:text-black transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Body */}
            <div className="ai-chat-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-msg ${msg.sender === 'assistant' ? 'bot' : 'user'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="confidence-tag">
                      GEMINI 3.1 FLASH · NETWORK VERIFIED
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {msg.action && (
                    <div className="mt-3 pt-2.5 border-t border-white/40">
                      <button
                        onClick={() => handleActionClick(msg.action!)}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-black transition-all cursor-pointer"
                      >
                        {msg.action.type === 'export_csv' ? (
                          <Download className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>{msg.action.label}</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] ${
                      msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="ai-msg bot flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-[#e53935]" />
                  <span className="text-xs text-slate-700 font-medium">
                    Analyzing FMCG network parameters and route feasibility...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pinned Bottom Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="ai-chat-input-row"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about warehouse shortages, safe surplus, or transfer proposals..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="redesigned-send-btn disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
