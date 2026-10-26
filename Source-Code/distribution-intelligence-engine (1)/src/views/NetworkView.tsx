import React, { useState } from 'react';
import {
  Network,
  Warehouse,
  Truck,
  ArrowRight,
  Clock,
  DollarSign,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { LocationInfo, RouteRecord, SkuLocationMetrics } from '../types/index.ts';

interface NetworkViewProps {
  locations: LocationInfo[];
  routes: RouteRecord[];
  metrics: SkuLocationMetrics[];
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  locations,
  routes,
  metrics,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const filteredRoutes = routes.filter((r) => {
    if (selectedSource !== 'all' && r.sourceLocationId !== selectedSource) {
      return false;
    }
    return true;
  });

  const getLocationName = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.name : id;
  };

  const getStockAtLocation = (locId: string) => {
    return metrics
      .filter((m) => m.locationId === locId)
      .reduce((acc, m) => acc + m.usableStock, 0);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Supply Chain Topology
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Distribution Network & Transit Lanes
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Registered logistics nodes, regional hubs, and transport lanes with verified lead times and freight unit costs.
          </p>
        </div>
      </div>

      {/* Logistics Hubs Cards with .liquid-slide */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => {
          const usableStock = getStockAtLocation(loc.id);
          const utilizationPct = Math.min(
            100,
            Math.round((usableStock / (loc.maxCapacityUnits || 1)) * 100)
          );

          return (
            <div
              key={loc.id}
              className="liquid-slide p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e53935]">
                    {loc.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-[#111] mt-0.5">{loc.name}</h3>
                  <div className="text-[11px] text-[#555]">{loc.region} · {loc.id}</div>
                </div>
                <div className="round-button">
                  <Warehouse className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/40 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Usable Stock</div>
                  <div className="font-extrabold text-[#111] text-base">{usableStock.toLocaleString()} units</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Capacity Utilization</div>
                  <div className="font-extrabold text-blue-900 text-base">{utilizationPct}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-white/50 overflow-hidden border border-white/60">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Transit Routes Matrix */}
      <div className="liquid-glass-panel p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-white/40 pb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-900" />
            <h3 className="text-sm font-bold text-[#111]">
              Active Transit Lanes & Lead Times ({filteredRoutes.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="liquid-pill-tag cursor-pointer font-bold text-xs"
            >
              <option value="all">All Origin Nodes</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Routes Table with Liquid Glass background */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/50 bg-white/20">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/40 bg-white/40 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Origin Location</th>
                <th className="py-3 px-4">Destination Node</th>
                <th className="py-3 px-4 text-right">Lead Time</th>
                <th className="py-3 px-4 text-right">Freight Rate</th>
                <th className="py-3 px-4 text-right">Capacity Cap</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/25">
              {filteredRoutes.map((route, i) => (
                <tr key={i} className="hover:bg-white/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#111]">
                    {getLocationName(route.sourceLocationId)}
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {route.sourceLocationId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#111]">
                    {getLocationName(route.destLocationId)}
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {route.destLocationId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#111]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {route.leadTimeDays} {route.leadTimeDays === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#111]">
                    ${route.costPerUnit.toFixed(2)} / unit
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {route.capacityUnits.toLocaleString()} units
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
