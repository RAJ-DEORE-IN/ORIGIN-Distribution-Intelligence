import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Boxes,
  Info,
} from 'lucide-react';
import { SkuLocationMetrics } from '../types/index.ts';
import { exportRiskAnalysisToCsv, triggerDownload } from '../lib/csvParser.ts';

interface RiskAnalysisViewProps {
  metrics: SkuLocationMetrics[];
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ metrics }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'shortage' | 'excess' | 'balanced'>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'doc' | 'gap' | 'stock'>('urgency');
  const [selectedDetail, setSelectedDetail] = useState<SkuLocationMetrics | null>(null);

  const locations = Array.from(new Set(metrics.map((m) => m.locationName)));

  const filteredMetrics = metrics
    .filter((m) => {
      const matchSearch =
        m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.skuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.locationName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchLocation =
        selectedLocation === 'all' || m.locationName === selectedLocation;

      const matchRisk =
        riskFilter === 'all' ||
        (riskFilter === 'shortage' && m.isShortageRisk) ||
        (riskFilter === 'excess' && m.isExcessRisk) ||
        (riskFilter === 'balanced' && !m.isShortageRisk && !m.isExcessRisk);

      return matchSearch && matchLocation && matchRisk;
    })
    .sort((a, b) => {
      if (sortBy === 'urgency') return b.urgencyScore - a.urgencyScore;
      if (sortBy === 'gap') return b.inventoryGap - a.inventoryGap;
      if (sortBy === 'stock') return b.usableStock - a.usableStock;
      if (sortBy === 'doc') {
        const docA = typeof a.daysOfCover === 'number' ? a.daysOfCover : 999;
        const docB = typeof b.daysOfCover === 'number' ? b.daysOfCover : 999;
        return docA - docB;
      }
      return 0;
    });

  const handleExport = () => {
    const csv = exportRiskAnalysisToCsv(filteredMetrics);
    triggerDownload(csv, 'inventory_risk_analysis.csv');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-[#e53935]" />
            Stockout Probability Triage
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Inventory Risk & Stock Gap Triage
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Identify imminent stockouts and surplus positions calculated from 7-day demand moving averages and lead times.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="liquid-glass-btn flex items-center gap-1.5 font-bold"
        >
          <Download className="h-3.5 w-3.5 text-slate-700" />
          <span>Export Risk Report (CSV)</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="liquid-glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU or location..."
              className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md pl-9 pr-3.5 py-1.5 text-xs text-[#111] placeholder:text-slate-500 focus:outline-hidden"
            />
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="liquid-pill-tag cursor-pointer font-bold text-xs"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Risk Level Segmented */}
          <div className="flex items-center rounded-2xl bg-white/40 p-1 text-xs border border-white/60">
            {(['all', 'shortage', 'excess', 'balanced'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRiskFilter(mode)}
                className={`rounded-xl px-3 py-1 font-bold transition-all ${
                  riskFilter === mode
                    ? 'bg-white/80 text-black shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                {mode === 'all'
                  ? 'All Records'
                  : mode === 'shortage'
                  ? 'Shortage Risk'
                  : mode === 'excess'
                  ? 'Surplus Excess'
                  : 'Balanced'}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="liquid-pill-tag cursor-pointer font-bold text-xs"
          >
            <option value="urgency">Urgency Score</option>
            <option value="gap">Inventory Gap (Highest)</option>
            <option value="doc">Days of Cover (Lowest)</option>
            <option value="stock">Usable Stock</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="liquid-glass-panel overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/40 bg-white/30 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SKU & Product</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-right">Usable Stock</th>
                <th className="py-3 px-3 text-right">Daily Demand (7d)</th>
                <th className="py-3 px-3 text-right">Days of Cover</th>
                <th className="py-3 px-3 text-right">Net Gap</th>
                <th className="py-3 px-3 text-right">Safe Surplus</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredMetrics.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#111]">{item.skuName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.sku} · {item.category}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {item.locationName}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#111]">
                    {item.usableStock.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {item.dailyDemand.toFixed(1)} / day
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold">
                    {typeof item.daysOfCover === 'number' ? (
                      <span
                        className={
                          item.daysOfCover <= 2
                            ? 'text-[#e53935]'
                            : item.daysOfCover <= 4
                            ? 'text-amber-800'
                            : 'text-slate-900'
                        }
                      >
                        {item.daysOfCover}d
                      </span>
                    ) : (
                      <span className="text-slate-400">{item.daysOfCover}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {item.inventoryGap > 0 ? (
                      <span className="text-[#e53935]">-{item.inventoryGap.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {item.safeSourceSurplus > 0 ? (
                      <span className="text-emerald-800">+{item.safeSourceSurplus.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.isShortageRisk ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[10px] font-extrabold text-[#e53935] border border-rose-200">
                        Critical Shortage
                      </span>
                    ) : item.isExcessRisk ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-900 border border-blue-200">
                        Safe Surplus
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-white/80">
                        Balanced
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedDetail(item)}
                      className="liquid-glass-btn text-[11px] font-bold py-1 px-3"
                    >
                      Math Proof
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Detail Proof Modal */}
      {selectedDetail && (
        <div className="modal-overlay active">
          <div className="liquid-glass-panel relative z-10 w-full max-w-lg p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/40 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e53935]">
                  Calculation Proof
                </span>
                <h3 className="text-base font-extrabold text-[#111] mt-0.5">
                  {selectedDetail.skuName}
                </h3>
                <div className="text-xs text-[#555]">
                  {selectedDetail.locationName} · {selectedDetail.sku}
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="round-button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="liquid-slide p-4">
                <div className="font-bold text-[#111] mb-1">1. Usable Stock Breakdown</div>
                <div className="font-mono text-slate-800">
                  On-Hand ({selectedDetail.onHand.toLocaleString()}) - Reserved ({selectedDetail.reserved.toLocaleString()}) - Expired ({selectedDetail.expired.toLocaleString()})
                  = <span className="font-extrabold text-black">{selectedDetail.usableStock.toLocaleString()} usable units</span>
                </div>
              </div>

              <div className="liquid-slide p-4">
                <div className="font-bold text-[#111] mb-1">2. Estimated Daily Demand & DOC</div>
                <div className="font-mono text-slate-800">
                  7-Day Velocity: {selectedDetail.dailyDemand.toFixed(1)} units/day
                  <br />
                  Days of Cover = {selectedDetail.usableStock.toLocaleString()} ÷ {selectedDetail.dailyDemand.toFixed(1)} ={' '}
                  <span className="font-extrabold text-blue-900">{selectedDetail.daysOfCover} days</span>
                </div>
              </div>

              <div className="liquid-slide p-4">
                <div className="font-bold text-[#111] mb-1">3. Gap & Safe Source Surplus</div>
                <div className="font-mono text-slate-800">
                  Inventory Gap: <span className="font-extrabold text-[#e53935]">{selectedDetail.inventoryGap.toLocaleString()} units</span>
                  <br />
                  Safe Source Surplus: <span className="font-extrabold text-emerald-800">+{selectedDetail.safeSourceSurplus.toLocaleString()} units</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetail(null)}
                className="liquid-glass-btn font-bold px-5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
