import React, { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Search,
  Clock,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { TransferRecommendation } from '../types/index.ts';
import { exportRecommendationsToCsv, triggerDownload } from '../lib/csvParser.ts';

interface RecommendationsViewProps {
  recommendations: TransferRecommendation[];
  onUpdateStatus: (id: string, status: 'recommended' | 'approved' | 'rejected' | 'in_transit') => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  onUpdateStatus,
}) => {
  const [feasibilityFilter, setFeasibilityFilter] = useState<'all' | 'feasible' | 'rejected'>('feasible');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRec, setSelectedRec] = useState<TransferRecommendation | null>(null);

  const filteredRecs = recommendations.filter((r) => {
    if (feasibilityFilter === 'feasible' && !r.isFeasible) return false;
    if (feasibilityFilter === 'rejected' && r.isFeasible) return false;
    if (searchTerm) {
      const match =
        r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.skuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sourceLocationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.destLocationName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const handleExport = () => {
    const csv = exportRecommendationsToCsv(recommendations);
    triggerDownload(csv, 'stock_transfer_recommendations.csv');
  };

  const feasibleCount = recommendations.filter((r) => r.isFeasible).length;
  const rejectedCount = recommendations.length - feasibleCount;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Decision Support & Rebalancing
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Stock Transfer Recommendations
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Algorithmic rebalancing candidates ranked by urgency, shortage severity, freight efficiency, and transit lead time.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="liquid-glass-btn flex items-center gap-1.5 font-bold"
        >
          <Download className="h-3.5 w-3.5 text-slate-700" />
          <span>Export Proposals (CSV)</span>
        </button>
      </div>

      {/* Filter and Switcher */}
      <div className="liquid-glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by SKU or route..."
              className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md pl-9 pr-3.5 py-1.5 text-xs text-[#111] placeholder:text-slate-500 focus:outline-hidden"
            />
          </div>

          {/* Feasibility Filter */}
          <div className="flex items-center rounded-2xl bg-white/40 p-1 text-xs border border-white/60">
            <button
              onClick={() => setFeasibilityFilter('feasible')}
              className={`rounded-xl px-3 py-1 font-bold transition-all ${
                feasibilityFilter === 'feasible'
                  ? 'bg-white/80 text-black shadow-xs'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              Feasible Only ({feasibleCount})
            </button>
            <button
              onClick={() => setFeasibilityFilter('rejected')}
              className={`rounded-xl px-3 py-1 font-bold transition-all ${
                feasibilityFilter === 'rejected'
                  ? 'bg-white/80 text-black shadow-xs'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setFeasibilityFilter('all')}
              className={`rounded-xl px-3 py-1 font-bold transition-all ${
                feasibilityFilter === 'all'
                  ? 'bg-white/80 text-black shadow-xs'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              All Evaluated ({recommendations.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-[#555] font-semibold">
          Showing <span className="font-bold text-[#111]">{filteredRecs.length}</span> recommendations
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="liquid-glass-panel overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/40 bg-white/30 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Priority & SKU</th>
                <th className="py-3 px-3">Origin (Source)</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Transfer Qty</th>
                <th className="py-3 px-3 text-right">Transit Lead</th>
                <th className="py-3 px-3 text-right">Est. Cost</th>
                <th className="py-3 px-3 text-center">Feasibility</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredRecs.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[10px] font-extrabold font-mono text-slate-900 border border-white/80 shadow-2xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-[#111]">{rec.skuName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{rec.sku} · {rec.category}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800">{rec.sourceLocationName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Surplus: +{rec.sourceUsableStock.toLocaleString()}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800">{rec.destLocationName}</div>
                    <div className="text-[10px] text-[#e53935] font-mono font-bold">
                      Gap: -{rec.destInventoryGap.toLocaleString()}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-blue-900">
                    +{rec.recommendedQuantity.toLocaleString()} units
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                    {rec.leadTimeDays}d
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                    ${rec.estimatedTransportCost.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    {rec.isFeasible ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Feasible
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#e53935] bg-rose-50/80 px-2.5 py-0.5 rounded-full border border-rose-200 cursor-help"
                        title={rec.rejectionReason}
                      >
                        <XCircle className="h-3 w-3" />
                        Infeasible
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <select
                      value={rec.status}
                      disabled={!rec.isFeasible}
                      onChange={(e) => onUpdateStatus(rec.id, e.target.value as any)}
                      className={`rounded-xl border px-2.5 py-1 text-xs font-bold focus:outline-hidden ${
                        rec.status === 'approved'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : rec.status === 'in_transit'
                          ? 'border-blue-300 bg-blue-50 text-blue-900'
                          : 'border-white/80 bg-white/70 text-slate-800'
                      }`}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="approved">Approved</option>
                      <option value="in_transit">In Transit</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedRec(rec)}
                      className="liquid-glass-btn text-[11px] font-bold py-1 px-3"
                    >
                      Audit Proof
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Mathematical Proof Modal */}
      {selectedRec && (
        <div className="modal-overlay active">
          <div className="liquid-glass-panel relative z-10 w-full max-w-xl p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/40 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e53935]">
                  Transfer Verification Proof
                </span>
                <h3 className="text-base font-extrabold text-[#111] mt-0.5">
                  {selectedRec.skuName} ({selectedRec.sku})
                </h3>
                <div className="text-xs text-[#555]">
                  {selectedRec.sourceLocationName} → {selectedRec.destLocationName}
                </div>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="round-button"
              >
                ✕
              </button>
            </div>

            {/* Hard Constraint Checks */}
            <div className="liquid-slide p-4">
              <div className="text-xs font-bold text-[#111] mb-2">Hard Physical Constraint Audit:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {selectedRec.hardConstraintChecks.hasEligibleRoute ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span className="font-semibold text-slate-800">Registered Transit Route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedRec.hardConstraintChecks.hasDestinationNeed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span className="font-semibold text-slate-800">Destination Stock Gap &gt; 0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedRec.hardConstraintChecks.hasSafeSourceSurplus ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span className="font-semibold text-slate-800">Safe Source Surplus &gt; 0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedRec.hardConstraintChecks.arrivalBeforeStockout ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span className="font-semibold text-slate-800">Arrival Before Stockout</span>
                </div>
              </div>
            </div>

            {/* Exact Mathematical Formula Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="liquid-slide p-4 font-mono">
                <div className="text-slate-500 text-[10px] font-sans font-bold">QUANTITY DERIVATION</div>
                <div className="text-slate-800">Feasible Qty = min(Dest Gap: {selectedRec.destInventoryGap.toLocaleString()}, Safe Surplus: {selectedRec.sourceUsableStock.toLocaleString()})</div>
                <div className="font-extrabold text-blue-900 mt-1">= {selectedRec.recommendedQuantity.toLocaleString()} units</div>
              </div>

              <div className="liquid-slide p-4 font-mono">
                <div className="text-slate-500 text-[10px] font-sans font-bold">IMPACT ON DESTINATION COVER</div>
                <div className="text-slate-800">Pre-Transfer DOC: {selectedRec.destDaysOfCoverBefore} days</div>
                <div>Post-Transfer DOC: <span className="font-extrabold text-emerald-800">{selectedRec.destDaysOfCoverAfter} days</span></div>
              </div>

              <div className="liquid-slide p-4">
                <div className="text-[11px] font-bold text-slate-900">Deterministic Algorithm Reasoning:</div>
                <p className="mt-1 text-[#333] leading-relaxed">
                  {selectedRec.reasoning}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/40 pt-3">
              <div className="text-xs text-slate-600 font-mono">
                Ranking Score: <span className="font-bold text-black">{selectedRec.rankingScore}</span>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="liquid-glass-btn font-bold px-5"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
