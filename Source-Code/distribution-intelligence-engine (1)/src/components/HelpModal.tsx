import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, BookOpen, Calculator, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const formulas = [
    {
      term: 'Usable Stock',
      formula: 'Usable Stock = On-Hand Stock − Reserved Stock − Expired Stock',
      explanation:
        'Prevents double-counting of inventory already allocated to pending retail customer orders or past batch expiration dates.',
    },
    {
      term: 'Estimated Daily Demand',
      formula: 'Daily Demand = Total Units Sold (7-Day Window) ÷ Days Counted',
      explanation:
        'Uses an explainable 7-day moving average. Does not hallucinate non-existent trends or hide zero-demand periods.',
    },
    {
      term: 'Days of Cover (DOC)',
      formula: 'Days of Cover = Usable Stock ÷ Estimated Daily Demand',
      explanation:
        'Indicates how many operating days the current inventory will sustain retail sales before reaching complete depletion.',
    },
    {
      term: 'Destination Inventory Gap',
      formula: 'Gap = max(0, Daily Demand × Lead Time + Safety Stock − Usable Stock − Incoming)',
      explanation:
        'Calculates the net replenishment required to survive transit lead time plus configured safety stock buffer.',
    },
    {
      term: 'Safe Source Surplus',
      formula: 'Safe Surplus = max(0, Usable Stock − Protected Reserve)',
      explanation:
        'A source hub is NEVER permitted to transfer stock that endangers its own configured safety reserve policy.',
    },
    {
      term: 'Feasible Transfer Quantity',
      formula: 'Feasible Qty = min(Destination Gap, Safe Source Surplus, Route Capacity)',
      explanation:
        'Bound by hard physical constraints including transit capacity limits, minimum carton pack-size rounding, and shelf life.',
    },
    {
      term: 'Fill Rate Comparison',
      formula: 'Fill Rate = Fulfilled Units ÷ Total Demand Units × 100%',
      explanation:
        'Evaluates both Baseline (zero inter-depot transfers) and Recommended Plan over the identical planning horizon.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="modal-overlay active">
        <div onClick={onClose} className="absolute inset-0" />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          className="liquid-glass-panel relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col p-7 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="round-button">
                <BookOpen className="h-4 w-4 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111]">
                  Mathematical Glossary & Planning Logic
                </h3>
                <p className="text-xs text-[#555]">
                  Deterministic FMCG calculation definitions and constraint rules
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="round-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-5 space-y-3.5 pr-1">
            {formulas.map((item, index) => (
              <div
                key={index}
                className="liquid-slide p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111]">{item.term}</span>
                  <span className="liquid-pill-tag py-0.5 px-2 text-[10px]">
                    Rule #{index + 1}
                  </span>
                </div>

                <div className="rounded-xl bg-white/60 border border-white/80 px-3 py-2 font-mono text-xs font-bold text-slate-900">
                  {item.formula}
                </div>

                <p className="text-xs leading-relaxed text-[#444] pt-0.5">
                  {item.explanation}
                </p>
              </div>
            ))}

            <div className="liquid-slide p-4 border-blue-200/80">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                <span>Zero-Hallucination Policy</span>
              </div>
              <p className="mt-1.5 text-xs text-[#444] leading-relaxed">
                All numbers shown in the dashboard, risk triage, and transfer recommendations
                are generated by strict deterministic calculations on real or verified synthetic
                data. Missing data fields produce explicit warnings rather than fabricated zero values.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/40 pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="liquid-glass-btn font-bold px-6"
            >
              Close Glossary
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
