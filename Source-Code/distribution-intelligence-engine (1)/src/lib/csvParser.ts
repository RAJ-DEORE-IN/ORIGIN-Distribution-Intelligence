import {
  InventoryRecord,
  SalesRecord,
  RouteRecord,
  ExpiryRecord,
  ValidationIssue,
  ValidationSummary,
  TransferRecommendation,
  SkuLocationMetrics,
  SimulationOutcome,
} from '../types/index.ts';

export function parseCsvRows(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

export function validateAndParseInventoryCsv(
  csvText: string
): { data: InventoryRecord[]; issues: ValidationIssue[] } {
  const { headers, rows } = parseCsvRows(csvText);
  const issues: ValidationIssue[] = [];
  const data: InventoryRecord[] = [];

  // Required header mapping
  const skuIdx = headers.findIndex((h) => ['sku', 'itemid', 'productcode'].includes(h));
  const locIdx = headers.findIndex((h) => ['locationid', 'warehouseid', 'location'].includes(h));
  const onHandIdx = headers.findIndex((h) => ['onhand', 'onhandstock', 'quantity', 'stock'].includes(h));
  const reservedIdx = headers.findIndex((h) => ['reserved', 'reservedstock', 'hold'].includes(h));
  const incomingIdx = headers.findIndex((h) => ['incoming', 'inbound', 'transit'].includes(h));
  const costIdx = headers.findIndex((h) => ['unitcost', 'cost', 'price'].includes(h));
  const skuNameIdx = headers.findIndex((h) => ['skuname', 'productname', 'name', 'itemname'].includes(h));
  const categoryIdx = headers.findIndex((h) => ['category', 'categoryname'].includes(h));

  if (skuIdx === -1) {
    issues.push({
      type: 'error',
      dataset: 'inventory',
      row: 1,
      field: 'sku',
      message: 'Missing required column: "sku" (or "item_id", "product_code").',
    });
  }
  if (locIdx === -1) {
    issues.push({
      type: 'error',
      dataset: 'inventory',
      row: 1,
      field: 'location_id',
      message: 'Missing required column: "location_id" (or "warehouse_id").',
    });
  }
  if (onHandIdx === -1) {
    issues.push({
      type: 'error',
      dataset: 'inventory',
      row: 1,
      field: 'on_hand',
      message: 'Missing required column: "on_hand" (or "quantity").',
    });
  }

  if (issues.length > 0) {
    return { data, issues };
  }

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const sku = row[skuIdx]?.trim();
    const locationId = row[locIdx]?.trim();
    const onHandRaw = row[onHandIdx]?.trim();
    const reservedRaw = reservedIdx !== -1 ? row[reservedIdx]?.trim() : '0';
    const incomingRaw = incomingIdx !== -1 ? row[incomingIdx]?.trim() : '0';
    const costRaw = costIdx !== -1 ? row[costIdx]?.trim() : '1.50';
    const skuName = skuNameIdx !== -1 ? row[skuNameIdx]?.trim() : undefined;
    const category = categoryIdx !== -1 ? row[categoryIdx]?.trim() : undefined;

    if (!sku) {
      issues.push({
        type: 'error',
        dataset: 'inventory',
        row: rowNum,
        field: 'sku',
        message: 'SKU identifier cannot be empty.',
      });
      return;
    }

    if (!locationId) {
      issues.push({
        type: 'error',
        dataset: 'inventory',
        row: rowNum,
        field: 'location_id',
        message: 'Location identifier cannot be empty.',
      });
      return;
    }

    const onHand = Number(onHandRaw);
    if (isNaN(onHand) || onHand < 0) {
      issues.push({
        type: 'error',
        dataset: 'inventory',
        row: rowNum,
        field: 'on_hand',
        message: `Invalid on_hand quantity: "${onHandRaw}". Must be non-negative integer.`,
        value: onHandRaw,
      });
      return;
    }

    const reserved = Number(reservedRaw) || 0;
    if (reserved < 0) {
      issues.push({
        type: 'warning',
        dataset: 'inventory',
        row: rowNum,
        field: 'reserved',
        message: `Negative reserved stock detected (${reserved}). Clamped to zero.`,
      });
    }

    const incoming = Number(incomingRaw) || 0;
    const unitCost = Number(costRaw) || 1.0;

    if (reserved > onHand) {
      issues.push({
        type: 'warning',
        dataset: 'inventory',
        row: rowNum,
        field: 'reserved',
        message: `Reserved stock (${reserved}) exceeds on_hand (${onHand}). Usable stock will be zero.`,
      });
    }

    data.push({
      sku,
      skuName,
      category,
      locationId,
      onHand,
      reserved: Math.max(0, reserved),
      incoming: Math.max(0, incoming),
      unitCost,
      recordDate: new Date().toISOString().split('T')[0],
    });
  });

  return { data, issues };
}

export function generateTemplateCsv(type: 'inventory' | 'sales' | 'routes' | 'expiry'): string {
  switch (type) {
    case 'inventory':
      return `sku,sku_name,category,location_id,on_hand,reserved,incoming,unit_cost\n` +
        `SKU-101,Pure Dairy Milk 1L,Dairy,LOC-CENTRAL,14200,2840,4000,1.85\n` +
        `SKU-101,Pure Dairy Milk 1L,Dairy,LOC-NORTH,620,124,0,1.85\n` +
        `SKU-102,Cold Brew Espresso 250ml,Beverages,LOC-CENTRAL,19800,3960,0,1.45\n` +
        `SKU-102,Cold Brew Espresso 250ml,Beverages,LOC-METRO,450,90,0,1.45`;
    case 'sales':
      return `sku,location_id,date,units_sold\n` +
        `SKU-101,LOC-CENTRAL,2026-10-24,320\n` +
        `SKU-101,LOC-NORTH,2026-10-24,240\n` +
        `SKU-102,LOC-METRO,2026-10-24,460`;
    case 'routes':
      return `source_location_id,dest_location_id,lead_time_days,cost_per_unit,capacity_units,is_active\n` +
        `LOC-CENTRAL,LOC-NORTH,1,0.42,6000,true\n` +
        `LOC-CENTRAL,LOC-METRO,1,0.38,8000,true\n` +
        `LOC-CENTRAL,LOC-WEST,2,0.85,5000,true`;
    case 'expiry':
      return `sku,location_id,batch_id,quantity,expiry_date\n` +
        `SKU-101,LOC-CENTRAL,B-MLK-2611-A,8000,2026-11-20\n` +
        `SKU-101,LOC-CENTRAL,B-MLK-2611-B,6200,2026-12-05`;
  }
}

export function exportRecommendationsToCsv(recommendations: TransferRecommendation[]): string {
  const headers = [
    'Recommendation ID',
    'SKU',
    'Product Name',
    'Category',
    'Source Location',
    'Destination Location',
    'Recommended Quantity',
    'Dest Inventory Gap',
    'Source Usable Stock',
    'Source Protected Reserve',
    'Lead Time (Days)',
    'Est Transport Cost ($)',
    'Feasible',
    'Rejection Reason',
    'Ranking Score',
    'Reasoning',
  ];

  const rows = recommendations.map((r) => [
    r.id,
    r.sku,
    `"${r.skuName.replace(/"/g, '""')}"`,
    r.category,
    r.sourceLocationName,
    r.destLocationName,
    r.recommendedQuantity,
    r.destInventoryGap,
    r.sourceUsableStock,
    r.sourceProtectedReserve,
    r.leadTimeDays,
    r.estimatedTransportCost,
    r.isFeasible ? 'YES' : 'NO',
    r.rejectionReason ? `"${r.rejectionReason.replace(/"/g, '""')}"` : 'None',
    r.rankingScore,
    `"${r.reasoning.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function exportRiskAnalysisToCsv(metrics: SkuLocationMetrics[]): string {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Location Name',
    'Usable Stock',
    'Daily Demand',
    'Days of Cover',
    'Inventory Gap',
    'Safe Source Surplus',
    'Shortage Risk',
    'Excess Risk',
    'Urgency Score',
  ];

  const rows = metrics.map((m) => [
    m.sku,
    `"${m.skuName.replace(/"/g, '""')}"`,
    m.category,
    `"${m.locationName.replace(/"/g, '""')}"`,
    m.usableStock,
    m.dailyDemand,
    m.daysOfCover,
    m.inventoryGap,
    m.safeSourceSurplus,
    m.isShortageRisk ? 'YES' : 'NO',
    m.isExcessRisk ? 'YES' : 'NO',
    m.urgencyScore,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function triggerDownload(content: string, filename: string, mime: string = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
