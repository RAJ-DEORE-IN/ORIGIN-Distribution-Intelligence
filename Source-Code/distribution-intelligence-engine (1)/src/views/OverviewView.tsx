import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  IndianRupee,
  TrendingDown,
  Warehouse,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  SkuLocationMetrics,
  TransferRecommendation,
  SimulationOutcome,
  Organization,
} from '../types/index.ts';

interface OverviewViewProps {
  metrics: SkuLocationMetrics[];
  recommendations: TransferRecommendation[];
  simulation: SimulationOutcome | null;
  organization: Organization | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAi: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  recommendations,
  simulation,
  organization,
  onNavigateTab,
  onOpenAi,
}) => {
  const totalUsableStock = metrics.reduce((acc, m) => acc + m.usableStock, 0);
  const shortageMetrics = metrics.filter((m) => m.isShortageRisk);
  const excessMetrics = metrics.filter((m) => m.isExcessRisk);
  const feasibleRecs = recommendations.filter((r) => r.isFeasible);
  const totalEstCost = feasibleRecs.reduce((acc, r) => acc + r.estimatedTransportCost, 0);

  const uniqueLocations = Array.from(new Set(metrics.map((m) => m.locationName)));
  const uniqueSkus = Array.from(new Set(metrics.map((m) => m.sku)));

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="liquid-pill-tag">
              <span className="h-2 w-2 rounded-full bg-[#e53935]" />
              FMCG Optimization Engine
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Distribution Network Overview
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Real-time inventory equilibrium, projected stockout gaps, and feasible rebalancing for{' '}
            <span className="font-semibold text-slate-800">{organization?.name || 'Active Organization'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="liquid-glass-btn flex items-center gap-1.5 font-bold"
          >
            <span>Review {feasibleRecs.length} Transfers</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (with .liquid-slide class and hover lift) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Usable Stock */}
        <div className="liquid-slide p-5">
          <div className="flex items-center justify-between text-xs text-[#555]">
            <span className="font-semibold">Usable Network Stock</span>
            <Boxes className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tracking-tight text-[#111]">
            {totalUsableStock.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#666]">
            <span>Across {uniqueLocations.length} locations</span>
            <span>·</span>
            <span>{uniqueSkus.length} active SKUs</span>
          </div>
        </div>

        {/* Shortage Risk Locations */}
        <div className="liquid-slide p-5">
          <div className="flex items-center justify-between text-xs text-[#555]">
            <span className="font-semibold">Critical Shortage Risks</span>
            <AlertTriangle className="h-4 w-4 text-[#e53935]" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tracking-tight text-[#e53935]">
            {shortageMetrics.length}
          </div>
          <div className="mt-1 text-[11px] text-[#666]">
            Locations with &lt; 4 days of cover
          </div>
        </div>

        {/* Feasible Transfers */}
        <div className="liquid-slide p-5">
          <div className="flex items-center justify-between text-xs text-[#555]">
            <span className="font-semibold">Feasible Transfers</span>
            <ArrowLeftRight className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tracking-tight text-[#111]">
            {feasibleRecs.length}
          </div>
          <div className="mt-1 text-[11px] text-[#666]">
            {recommendations.length - feasibleRecs.length} rejected by constraints
          </div>
        </div>

        {/* Est Transfer Cost */}
        <div className="liquid-slide p-5">
          <div className="flex items-center justify-between text-xs text-[#555]">
            <span className="font-semibold">Est. Transport Cost</span>
            <IndianRupee className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tracking-tight text-[#111]">
            ₹{totalEstCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-[#666]">
            Avg ₹{(totalEstCost / (feasibleRecs.length || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / transfer
          </div>
        </div>
      </div>

      {/* Baseline vs Plan Simulation Strip with Liquid Glass Panel */}
      {simulation && (
        <div className="liquid-glass-panel p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e53935]">
                  Simulation Outcome
                </span>
                <span className="text-[11px] text-[#666]">· 7-Day Planning Horizon</span>
              </div>
              <h2 className="mt-1 text-base font-bold text-[#111]">
                Executing recommendations projects a +{simulation.fillRateDeltaPct}% increase in demand fulfillment
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="liquid-slide px-4 py-2 text-center">
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Baseline Fill Rate</div>
                <div className="text-base font-extrabold text-slate-800">{simulation.baselineFillRatePct}%</div>
              </div>

              <div className="text-slate-400 font-bold">→</div>

              <div className="liquid-slide px-4 py-2 text-center border-white/80">
                <div className="text-[10px] text-blue-900 font-sans uppercase font-extrabold">Plan Fill Rate</div>
                <div className="text-base font-extrabold text-blue-900">{simulation.planFillRatePct}%</div>
              </div>

              <div className="liquid-slide px-4 py-2 text-center">
                <div className="text-[10px] text-emerald-800 font-sans uppercase font-extrabold">Unmet Reduced</div>
                <div className="text-base font-extrabold text-emerald-800">
                  -{simulation.unmetDemandReductionUnits.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Urgent Shortages & Top Feasible Transfers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Urgent Stockout Alerts */}
        <div className="liquid-glass-panel p-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#e53935]" />
              <h3 className="text-sm font-bold text-[#111]">
                Most Urgent Shortage Positions
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('riskanalysis')}
              className="text-xs font-bold text-slate-800 hover:text-black transition-colors"
            >
              View All ({shortageMetrics.length})
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {shortageMetrics.slice(0, 4).map((item, idx) => (
              <div key={idx} className="liquid-slide p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#111]">{item.skuName}</div>
                  <div className="text-[11px] text-[#555]">
                    {item.locationName} · {item.category}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[#e53935] font-extrabold">
                    {item.daysOfCover}d Cover
                  </div>
                  <div className="text-[11px] text-[#666]">
                    Gap: {item.inventoryGap.toLocaleString()} units
                  </div>
                </div>
              </div>
            ))}

            {shortageMetrics.length === 0 && (
              <div className="py-8 text-center text-xs text-[#666]">
                No critical inventory shortages detected.
              </div>
            )}
          </div>
        </div>

        {/* Right: Top Feasible Transfers */}
        <div className="liquid-glass-panel p-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-blue-900" />
              <h3 className="text-sm font-bold text-[#111]">
                Top Priority Rebalancing Transfers
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="text-xs font-bold text-slate-800 hover:text-black transition-colors"
            >
              All Proposals ({feasibleRecs.length})
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {feasibleRecs.slice(0, 4).map((rec) => (
              <div key={rec.id} className="liquid-slide p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#111]">{rec.skuName}</div>
                  <div className="text-[11px] text-[#555]">
                    {rec.sourceLocationName} → {rec.destLocationName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-extrabold text-blue-900">
                    +{rec.recommendedQuantity.toLocaleString()} units
                  </div>
                  <div className="text-[11px] text-[#666]">
                    {rec.leadTimeDays}d transit · ₹{rec.estimatedTransportCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}

            {feasibleRecs.length === 0 && (
              <div className="py-8 text-center text-xs text-[#666]">
                No feasible transfers meet constraint requirements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
