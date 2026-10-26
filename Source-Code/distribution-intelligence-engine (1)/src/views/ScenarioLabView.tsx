import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  TrendingUp,
  Percent,
  Calendar,
  DollarSign,
  Boxes,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  PlanningDefaults,
  SkuLocationMetrics,
  TransferRecommendation,
  SimulationOutcome,
  LocationInfo,
  InventoryRecord,
  SalesRecord,
  RouteRecord,
  ExpiryRecord,
} from '../types/index.ts';
import {
  runOptimizationAnalysis,
  simulateBaselineVsPlan,
} from '../lib/calculator.ts';

interface ScenarioLabViewProps {
  currentDefaults: PlanningDefaults;
  locations: LocationInfo[];
  inventory: InventoryRecord[];
  sales: SalesRecord[];
  routes: RouteRecord[];
  expiry: ExpiryRecord[];
  onApplyDefaults: (defaults: PlanningDefaults) => void;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({
  currentDefaults,
  locations,
  inventory,
  sales,
  routes,
  expiry,
  onApplyDefaults,
}) => {
  const [safetyDays, setSafetyDays] = useState(currentDefaults.safetyStockDays);
  const [reservePct, setReservePct] = useState(
    Math.round(currentDefaults.protectedReservePercent * 100)
  );
  const [horizonDays, setHorizonDays] = useState(currentDefaults.planningHorizonDays);
  const [costWeight, setCostWeight] = useState(
    Math.round(currentDefaults.costWeight * 100)
  );

  const locMap = new Map(locations.map((l) => [l.id, { name: l.name, region: l.region }]));
  const scenarioDefaults: PlanningDefaults = {
    ...currentDefaults,
    safetyStockDays: safetyDays,
    protectedReservePercent: reservePct / 100,
    planningHorizonDays: horizonDays,
    costWeight: costWeight / 100,
    urgencyWeight: (100 - costWeight) / 100,
  };

  const scenarioAnalysis = runOptimizationAnalysis(
    inventory,
    sales,
    routes,
    expiry,
    locMap,
    scenarioDefaults
  );

  const scenarioSim = simulateBaselineVsPlan(
    scenarioAnalysis.metrics,
    scenarioAnalysis.recommendations,
    horizonDays
  );

  const handleResetToOrgDefault = () => {
    setSafetyDays(currentDefaults.safetyStockDays);
    setReservePct(Math.round(currentDefaults.protectedReservePercent * 100));
    setHorizonDays(currentDefaults.planningHorizonDays);
    setCostWeight(Math.round(currentDefaults.costWeight * 100));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            What-If Policy Simulation
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Scenario Simulation Lab
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Simulate alternative supply chain policies. Adjust buffer thresholds and cost weights to observe projected fulfillment impact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToOrgDefault}
            className="liquid-glass-btn flex items-center gap-1.5 font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Knobs</span>
          </button>
          <button
            onClick={() => onApplyDefaults(scenarioDefaults)}
            className="liquid-glass-btn flex items-center gap-1.5 font-bold bg-white/70"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-900" />
            <span>Apply as Active Policy</span>
          </button>
        </div>
      </div>

      {/* Interactive Parameter Control Panel */}
      <div className="liquid-glass-panel p-7">
        <div className="flex items-center gap-2 border-b border-white/40 pb-3">
          <SlidersHorizontal className="h-4 w-4 text-slate-800" />
          <h3 className="text-sm font-bold text-[#111]">
            Interactive Policy Knobs
          </h3>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Safety Stock Days Slider */}
          <div className="liquid-slide p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">Safety Buffer</span>
              <span className="font-mono font-extrabold text-blue-900">{safetyDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={safetyDays}
              onChange={(e) => setSafetyDays(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-[#555]">
              Target days of cover required before stock gap is triggered.
            </p>
          </div>

          {/* Protected Reserve % Slider */}
          <div className="liquid-slide p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">Protected Reserve</span>
              <span className="font-mono font-extrabold text-blue-900">{reservePct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={reservePct}
              onChange={(e) => setReservePct(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-[#555]">
              Percentage of on-hand stock locked at origin hubs before surplus is unlocked.
            </p>
          </div>

          {/* Planning Horizon Slider */}
          <div className="liquid-slide p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">Simulation Horizon</span>
              <span className="font-mono font-extrabold text-blue-900">{horizonDays} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="14"
              step="1"
              value={horizonDays}
              onChange={(e) => setHorizonDays(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-[#555]">
              Demand evaluation window used to calculate projected unmet customer units.
            </p>
          </div>

          {/* Cost Weight vs Urgency Weight */}
          <div className="liquid-slide p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">Cost Priority Weight</span>
              <span className="font-mono font-extrabold text-blue-900">{costWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={costWeight}
              onChange={(e) => setCostWeight(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-[#555]">
              Higher weight prioritizes cheaper transit lanes over extreme urgency.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Simulation Outcomes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Baseline (No Rebalancing) */}
        <div className="liquid-glass-panel p-7">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Baseline Policy
              </span>
              <h3 className="text-base font-bold text-[#111]">
                Zero Inter-Depot Rebalancing
              </h3>
            </div>
            <span className="liquid-pill-tag">
              Unrebalanced
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Baseline Demand Fill Rate</span>
                <span className="font-mono font-extrabold text-[#111]">
                  {scenarioSim.baselineFillRatePct}%
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-white/50 border border-white/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${scenarioSim.baselineFillRatePct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="liquid-slide p-4">
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Unmet Customer Demand</div>
                <div className="mt-1 text-xl font-extrabold text-[#e53935]">
                  {scenarioSim.baselineUnmetDemandUnits.toLocaleString()} units
                </div>
              </div>
              <div className="liquid-slide p-4">
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Transport Spend</div>
                <div className="mt-1 text-xl font-extrabold text-slate-800">
                  $0.00
                </div>
              </div>
            </div>

            <p className="text-xs text-[#555] leading-relaxed pt-1">
              Isolated inventory depots. Shortage locations experience stockouts while surplus hubs hold unutilized stock.
            </p>
          </div>
        </div>

        {/* Simulated Scenario Plan */}
        <div className="liquid-glass-panel p-7">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
                Optimized Scenario
              </span>
              <h3 className="text-base font-bold text-[#111]">
                Feasible Stock Transfers Executed
              </h3>
            </div>
            <span className="liquid-pill-tag text-blue-900 font-extrabold">
              +{scenarioSim.fillRateDeltaPct}% Improvement
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Scenario Demand Fill Rate</span>
                <span className="font-mono font-extrabold text-blue-900">
                  {scenarioSim.planFillRatePct}%
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-blue-100/60 border border-blue-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-900"
                  style={{ width: `${scenarioSim.planFillRatePct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="liquid-slide p-4">
                <div className="text-[10px] text-emerald-800 font-sans uppercase font-extrabold">Unmet Reduced</div>
                <div className="mt-1 text-xl font-extrabold text-emerald-800">
                  -{scenarioSim.unmetDemandReductionUnits.toLocaleString()} units
                </div>
              </div>
              <div className="liquid-slide p-4">
                <div className="text-[10px] text-blue-900 font-sans uppercase font-extrabold">Total Freight Cost</div>
                <div className="mt-1 text-xl font-extrabold text-blue-900">
                  ${scenarioSim.totalTransferCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-700 font-medium">
              <span>Feasible Transfers: <strong className="text-black">{scenarioSim.feasibleTransfersCount}</strong></span>
              <span>Units Moved: <strong className="text-black">{scenarioSim.totalUnitsTransferred.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
