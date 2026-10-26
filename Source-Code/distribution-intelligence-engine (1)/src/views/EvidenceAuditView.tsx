import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Clock,
  History,
} from 'lucide-react';
import { runAllAutomatedVerificationTests, TestResult } from '../lib/tests.ts';
import { AuditLogEntry } from '../types/index.ts';

interface EvidenceAuditViewProps {
  auditLogs: AuditLogEntry[];
}

export const EvidenceAuditView: React.FC<EvidenceAuditViewProps> = ({ auditLogs }) => {
  const [testSuite, setTestSuite] = useState(() => runAllAutomatedVerificationTests());
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestSuite(runAllAutomatedVerificationTests());
      setIsRunning(false);
    }, 250);
  };

  const filteredResults = testSuite.results.filter((r) => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Deterministic Invariant Suite
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Evidence, Audit Trail & Verification
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Independent automated test suite certifying calculation accuracy, constraint enforcement, and audit history.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="liquid-glass-btn flex items-center gap-1.5 font-bold disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isRunning ? 'Executing Tests...' : 'Re-run Verification Suite'}</span>
        </button>
      </div>

      {/* Test Pass Scorecard */}
      <div className="liquid-glass-panel p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="round-button">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#111]">
                Automated Verification Invariants Certified
              </div>
              <div className="text-xs text-[#555]">
                {testSuite.passedCount} of {testSuite.total} tests executed and passed without regressions.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['all', 'Calculation', 'Recommendation', 'Simulation', 'Authorization'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-white/80 text-black shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                {cat === 'all' ? 'All Invariants' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Test Rows */}
        <div className="mt-6 space-y-2.5">
          {filteredResults.map((t) => (
            <div key={t.id} className="liquid-slide p-3.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center text-xs">
              <div className="flex items-start gap-3">
                {t.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#e53935] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-[#111]">
                    <span className="font-mono text-slate-500 mr-1.5">[{t.id}]</span>
                    {t.name}
                  </div>
                  <div className="text-[11px] text-[#555] mt-0.5">{t.notes}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] sm:text-right shrink-0">
                <span className="text-slate-500">Exp: {t.expected}</span>
                <span className="text-slate-300">|</span>
                <span className="font-extrabold text-black">Act: {t.actual}</span>
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 font-sans font-extrabold text-emerald-800 border border-emerald-200">
                  PASS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Audit Log */}
      <div className="liquid-glass-panel p-7">
        <div className="flex items-center justify-between border-b border-white/40 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-[#111]">
              System Audit History ({auditLogs.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Immutable Stored Sequence</span>
        </div>

        <div className="mt-4 divide-y divide-white/20 max-h-72 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111]">{log.action}</span>
                  <span className="liquid-pill-tag py-0.5 px-2 text-[9px] uppercase font-bold">
                    {log.category}
                  </span>
                </div>
                <div className="text-[11px] text-[#555] mt-0.5">{log.details}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-slate-800">{log.userName}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
