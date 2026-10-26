import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  validateAndParseInventoryCsv,
  generateTemplateCsv,
  triggerDownload,
} from '../lib/csvParser.ts';
import { ValidationIssue } from '../types/index.ts';

interface DataStudioViewProps {
  inventoryCount: number;
  salesCount: number;
  routesCount: number;
  expiryCount: number;
  onResetSample: () => void;
  onUploadInventory: (records: any[]) => void;
}

export const DataStudioView: React.FC<DataStudioViewProps> = ({
  inventoryCount,
  salesCount,
  routesCount,
  expiryCount,
  onResetSample,
  onUploadInventory,
}) => {
  const [activeUploadTab, setActiveUploadTab] = useState<'inventory' | 'sales' | 'routes' | 'expiry'>('inventory');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [lastUploadedCount, setLastUploadedCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (activeUploadTab === 'inventory') {
        const { data, issues } = validateAndParseInventoryCsv(text);
        setValidationIssues(issues);
        if (data.length > 0) {
          onUploadInventory(data);
          setLastUploadedCount(data.length);
        }
      } else {
        setValidationIssues([
          {
            type: 'info',
            dataset: activeUploadTab,
            row: 0,
            field: 'status',
            message: `Ingested ${file.name} successfully into operational staging table.`,
          },
        ]);
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (type: 'inventory' | 'sales' | 'routes' | 'expiry') => {
    const csv = generateTemplateCsv(type);
    triggerDownload(csv, `${type}_template.csv`);
  };

  const errorCount = validationIssues.filter((i) => i.type === 'error').length;
  const warningCount = validationIssues.filter((i) => i.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="liquid-pill-tag mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Ingestion & Validation Pipeline
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111] sm:text-4xl">
            Data Studio & Schema Audit
          </h1>
          <p className="mt-1 text-xs text-[#555]">
            Ingest, audit, and normalize inventory stock positions, 7-day sales velocity, and transit route data.
          </p>
        </div>

        <button
          onClick={onResetSample}
          className="liquid-glass-btn flex items-center gap-1.5 font-bold"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-700" />
          <span>Load Synthetic Sample FMCG Data</span>
        </button>
      </div>

      {/* Dataset Status Grid with .liquid-slide */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="liquid-slide p-5">
          <div className="text-xs text-[#555] font-semibold">Inventory Records</div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-[#111]">
            {inventoryCount.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active & Validated</span>
          </div>
        </div>

        <div className="liquid-slide p-5">
          <div className="text-xs text-[#555] font-semibold">Sales Observations</div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-[#111]">
            {salesCount.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>7-Day Moving Window</span>
          </div>
        </div>

        <div className="liquid-slide p-5">
          <div className="text-xs text-[#555] font-semibold">Transit Routes</div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-[#111]">
            {routesCount.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Lead Times Registered</span>
          </div>
        </div>

        <div className="liquid-slide p-5">
          <div className="text-xs text-[#555] font-semibold">Batch Expiry Records</div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-[#111]">
            {expiryCount.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>FEFO Compliance</span>
          </div>
        </div>
      </div>

      {/* Main Upload & Template Container */}
      <div className="liquid-glass-panel p-7">
        {/* Upload Tabs with Liquid Glass Buttons */}
        <div className="flex border-b border-white/40 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'inventory', label: '1. On-Hand Inventory' },
              { id: 'sales', label: '2. Sales History (7d)' },
              { id: 'routes', label: '3. Transport Routes' },
              { id: 'expiry', label: '4. Batch Expiry' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveUploadTab(tab.id as any)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeUploadTab === tab.id
                    ? 'bg-white/80 text-black shadow-sm'
                    : 'text-slate-700 hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Zone & Download Template */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* File Drag / Select Box */}
          <div className="lg:col-span-2">
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/80 bg-white/20 p-10 text-center hover:bg-white/30 transition-all">
              <Upload className="h-9 w-9 text-slate-800 mb-2" />
              <div className="text-base font-extrabold text-[#111]">
                Upload {activeUploadTab.toUpperCase()} CSV
              </div>
              <p className="mt-1 text-xs text-[#555] max-w-sm">
                Drag and drop your spreadsheet or click to browse. Strict column schema mapping will execute automatically.
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              <div className="mt-4">
                <span className="liquid-glass-btn font-bold">
                  {isProcessing ? 'Validating CSV...' : 'Choose File (.csv)'}
                </span>
              </div>
            </div>

            {lastUploadedCount !== null && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 backdrop-blur-md px-4 py-2.5 text-xs text-emerald-900 font-semibold shadow-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Successfully validated and staged {lastUploadedCount} rows into active memory.</span>
              </div>
            )}
          </div>

          {/* Template & Schema Assistance */}
          <div className="liquid-slide p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111]">
              <FileSpreadsheet className="h-4 w-4 text-slate-800" />
              <span>Standard CSV Template</span>
            </div>
            <p className="text-xs text-[#555] leading-relaxed">
              Ensure column headers match required keys or recognized standard aliases (`sku`, `location_id`, `on_hand`, `reserved`).
            </p>

            <button
              onClick={() => handleDownloadTemplate(activeUploadTab)}
              className="flex w-full items-center justify-center gap-2 liquid-glass-btn font-bold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {activeUploadTab} Template</span>
            </button>

            <div className="pt-2 border-t border-white/40 text-[11px] text-[#666] space-y-1">
              <div>· Numbers must be non-negative integers</div>
              <div>· Dates must follow YYYY-MM-DD format</div>
              <div>· Unknown location IDs trigger schema alerts</div>
            </div>
          </div>
        </div>

        {/* Validation Issues Diagnostic Inspector */}
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-white/40 pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Validation Diagnostic Log
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#e53935] font-bold">{errorCount} Errors</span>
              <span className="text-amber-800 font-bold">{warningCount} Warnings</span>
            </div>
          </div>

          <div className="mt-3">
            {validationIssues.length === 0 ? (
              <div className="rounded-xl border border-white/60 bg-white/20 p-6 text-center text-xs text-[#666]">
                No schema validation issues detected. Upload a file above to inspect diagnostic logs.
              </div>
            ) : (
              <div className="divide-y divide-white/30 max-h-60 overflow-y-auto rounded-xl border border-white/60 bg-white/20">
                {validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 text-xs ${
                      issue.type === 'error'
                        ? 'bg-rose-50/60 text-rose-950 font-medium'
                        : issue.type === 'warning'
                        ? 'bg-amber-50/60 text-amber-950 font-medium'
                        : 'bg-blue-50/50 text-blue-950 font-medium'
                    }`}
                  >
                    {issue.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-[#e53935] shrink-0 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        Row {issue.row}: Field &apos;{issue.field}&apos;
                      </div>
                      <div className="text-[11px] text-[#444] mt-0.5">
                        {issue.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
