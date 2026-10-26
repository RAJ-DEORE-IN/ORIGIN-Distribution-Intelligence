import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Users,
  Shield,
  Sparkles,
  Save,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Organization, PlanningDefaults, User } from '../types/index.ts';

interface SettingsViewProps {
  organization: Organization | null;
  planningDefaults: PlanningDefaults;
  currentUser: User | null;
  onUpdateDefaults: (defaults: PlanningDefaults) => void;
  onStartTour: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  organization,
  planningDefaults,
  currentUser,
  onUpdateDefaults,
  onStartTour,
}) => {
  const [safetyDays, setSafetyDays] = useState(planningDefaults.safetyStockDays);
  const [reservePct, setReservePct] = useState(
    Math.round(planningDefaults.protectedReservePercent * 100)
  );
  const [packEnforced, setPackEnforced] = useState(planningDefaults.packSizeEnforced);
  const [packSize, setPackSize] = useState(planningDefaults.defaultPackSize);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateDefaults({
      ...planningDefaults,
      safetyStockDays: safetyDays,
      protectedReservePercent: reservePct / 100,
      packSizeEnforced: packEnforced,
      defaultPackSize: packSize,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const roles = [
    {
      role: 'Organization Admin',
      scope: 'Full Administrative Authority',
      perms: 'Configure planning defaults, manage team members, ingest CSV datasets, approve shipments.',
    },
    {
      role: 'Distribution Planner',
      scope: 'Active Workspace Planning',
      perms: 'Review stockout risks, execute optimization runs, approve transfer recommendations, export CSVs.',
    },
    {
      role: 'Warehouse Manager',
      scope: 'Local Inventory Operations',
      perms: 'Inspect on-hand and protected reserves, review arrivals affecting assigned logistics centers.',
    },
    {
      role: 'Regional Manager',
      scope: 'Regional Service Level Oversight',
      perms: 'Track regional days of cover, evaluate macro network inventory gaps and replenishment lanes.',
    },
    {
      role: 'Operations Analyst',
      scope: 'Data Quality & Math Auditing',
      perms: 'Upload raw datasets, inspect validation error diagnostics, audit calculation test suites.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Security & Governance
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Settings & Governance
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Organization parameters, algorithmic planning policies, and role-based access control.
          </p>
        </div>

        <button
          onClick={onStartTour}
          className="liquid-glass-btn flex items-center gap-1.5 font-bold"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>Replay Guided Tour</span>
        </button>
      </div>

      {/* Organization Info */}
      <div className="liquid-glass-panel p-7">
        <div className="flex items-center gap-2 border-b border-white/40 pb-3">
          <Building2 className="h-4 w-4 text-slate-800" />
          <h3 className="text-sm font-bold text-[#111]">
            Active Organization Profile
          </h3>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="liquid-slide p-4">
            <div className="text-slate-500 font-bold">Organization Name</div>
            <div className="mt-1 text-base font-extrabold text-[#111]">{organization?.name}</div>
          </div>
          <div className="liquid-slide p-4">
            <div className="text-slate-500 font-bold">Industry Classification</div>
            <div className="mt-1 text-base font-extrabold text-[#111]">{organization?.industry}</div>
          </div>
          <div className="liquid-slide p-4">
            <div className="text-slate-500 font-bold">Workspace Identifier</div>
            <div className="mt-1 font-mono font-bold text-slate-800">{organization?.id}</div>
          </div>
        </div>
      </div>

      {/* Algorithmic Planning Policies */}
      <div className="liquid-glass-panel p-7">
        <div className="flex items-center justify-between border-b border-white/40 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-800" />
            <h3 className="text-sm font-bold text-[#111]">
              Default Planning Policy Parameters
            </h3>
          </div>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved Successfully</span>
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="liquid-slide p-4">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Safety Stock Threshold (Days)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={safetyDays}
              onChange={(e) => setSafetyDays(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl border border-white/80 bg-white/50 px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-hidden"
            />
            <p className="mt-1 text-[11px] text-[#555]">
              Target days of cover required before stock gap is triggered.
            </p>
          </div>

          <div className="liquid-slide p-4">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Protected Reserve Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="50"
                value={reservePct}
                onChange={(e) => setReservePct(parseInt(e.target.value, 10) || 5)}
                className="w-full rounded-xl border border-white/80 bg-white/50 px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-hidden"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono font-bold">%</span>
            </div>
            <p className="mt-1 text-[11px] text-[#555]">
              Share of source on-hand inventory shielded from inter-location transfers.
            </p>
          </div>

          <div className="liquid-slide p-4">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Carton Pack Size Rounding
            </label>
            <select
              value={packEnforced ? 'enforce' : 'flexible'}
              onChange={(e) => setPackEnforced(e.target.value === 'enforce')}
              className="w-full rounded-xl border border-white/80 bg-white/50 px-3 py-2 text-xs font-bold text-[#111] focus:outline-hidden"
            >
              <option value="enforce">Enforce Standard Carton Multiples</option>
              <option value="flexible">Allow Exact Unit Transfers</option>
            </select>
            <p className="mt-1 text-[11px] text-[#555]">
              Rounds transfer quantities to physical packaging carton multiples.
            </p>
          </div>

          <div className="liquid-slide p-4">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Default Carton Pack Quantity
            </label>
            <input
              type="number"
              min="1"
              value={packSize}
              onChange={(e) => setPackSize(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl border border-white/80 bg-white/50 px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-hidden"
            />
            <p className="mt-1 text-[11px] text-[#555]">
              Standard FMCG case quantity (e.g. 24 cans/bottles per box).
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="liquid-glass-btn font-bold px-6 py-2.5 flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Planning Defaults</span>
          </button>
        </div>
      </div>

      {/* Role-Based Access Control Matrix */}
      <div className="liquid-glass-panel p-7">
        <div className="flex items-center gap-2 border-b border-white/40 pb-3">
          <Shield className="h-4 w-4 text-slate-800" />
          <h3 className="text-sm font-bold text-[#111]">
            Enterprise Role Permissions Matrix
          </h3>
        </div>

        <div className="mt-5 space-y-2.5">
          {roles.map((r, i) => (
            <div key={i} className="liquid-slide p-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center text-xs">
              <div className="sm:w-1/3">
                <div className="font-extrabold text-[#111] text-sm">{r.role}</div>
                <div className="text-[11px] text-[#e53935] font-bold">{r.scope}</div>
              </div>
              <div className="sm:w-2/3 text-[#444] leading-relaxed text-[11px] font-medium">
                {r.perms}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
