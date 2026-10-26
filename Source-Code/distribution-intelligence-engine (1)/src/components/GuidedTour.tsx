import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  targetTab: string;
  description: string;
  keyRule: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Distribution Intelligence',
    subtitle: 'Step 1 of 7 · System Overview',
    targetTab: 'overview',
    description:
      'This platform transforms inventory, daily sales moving averages, and route constraints into feasible, prioritized stock-transfer recommendations to prevent stockouts while safeguarding source warehouse service levels.',
    keyRule: 'Traceable mathematical formulas; no black-box or invented KPIs.',
  },
  {
    title: 'Data Studio & Schema Validation',
    subtitle: 'Step 2 of 7 · Ingestion Pipeline',
    targetTab: 'datastudio',
    description:
      'Upload real CSV files for inventory, sales history, transit routes, and batch expiry. Download pre-formatted templates or inspect row-level validation diagnostics before running analysis.',
    keyRule: 'Strict validation isolates corrupt rows without silently altering business data.',
  },
  {
    title: 'Distribution Network & Route Mapping',
    subtitle: 'Step 3 of 7 · Logistics Geometry',
    targetTab: 'network',
    description:
      'Inspect physical distribution centers, regional depots, and retail hubs. Every transit route specifies its exact lead time (in days), cost per unit, and transport capacity limit.',
    keyRule: 'A transfer cannot be proposed if an active route does not exist.',
  },
  {
    title: 'Inventory Risk & Days of Cover',
    subtitle: 'Step 4 of 7 · Stockout Triage',
    targetTab: 'riskanalysis',
    description:
      'Sort locations and SKUs by stockout urgency. Days of cover is calculated from 7-day sales velocity, identifying locations approaching safety stock deficits.',
    keyRule: 'Days of Cover = Usable Stock ÷ 7-Day Moving Average Daily Demand.',
  },
  {
    title: 'Ranked Feasible Recommendations',
    subtitle: 'Step 5 of 7 · Transfer Proposals',
    targetTab: 'recommendations',
    description:
      'Review transfer proposals evaluated against strict hard constraints: active routes, destination gaps, safe source surplus, arrival before stockout, and batch shelf life.',
    keyRule: 'Inspect full mathematical proof breakdown and approve or hold with 1 click.',
  },
  {
    title: 'Scenario Simulation Lab',
    subtitle: 'Step 6 of 7 · What-If Forecasting',
    targetTab: 'scenariolab',
    description:
      'Test alternative planning policies: adjust safety stock thresholds, protected reserve percentages, or cost penalties to observe fill-rate improvements versus the baseline.',
    keyRule: 'Baseline and Plan use identical starting stock and demand horizons.',
  },
  {
    title: 'Central Gemini AI Planning Copilot',
    subtitle: 'Step 7 of 7 · Interactive Assistant',
    targetTab: 'overview',
    description:
      'Located dead center in the bottom floating bar, the Gemini AI Copilot is fully context-aware of your live shortages, safe surpluses, and recommendations for natural-language inquiries and operational actions.',
    keyRule: 'Ask questions or execute transfer workflows conversationally.',
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onNavigateTab(TOUR_STEPS[nextIndex].targetTab);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onNavigateTab(TOUR_STEPS[prevIndex].targetTab);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay active">
        <div onClick={onClose} className="absolute inset-0" />

        {/* Liquid Glass Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass-panel relative z-10 w-full max-w-lg p-7 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="round-button">
                <Sparkles className="h-4 w-4 text-[#e53935]" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#e53935]">
                {currentStep.subtitle}
              </span>
            </div>
            <button
              onClick={onClose}
              className="round-button"
              title="Skip Tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-[#111]">{currentStep.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#444]">
              {currentStep.description}
            </p>

            {/* Core Rule Highlight */}
            <div className="mt-4 liquid-slide p-4">
              <div className="text-[11px] font-extrabold text-[#111]">Mathematical Standard:</div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {currentStep.keyRule}
              </div>
            </div>
          </div>

          {/* Progress Indicators & Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-white/40 pt-4">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-6 bg-black'
                      : 'w-2 bg-black/20'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handleBack}
                  className="liquid-glass-btn flex items-center gap-1 font-bold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="liquid-glass-btn flex items-center gap-1.5 font-extrabold bg-white/70"
              >
                <span>{isLast ? 'Complete Tour' : 'Next'}</span>
                {isLast ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
