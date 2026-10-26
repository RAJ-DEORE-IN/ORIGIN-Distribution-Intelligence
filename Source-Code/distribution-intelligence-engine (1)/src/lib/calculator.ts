import {
  InventoryRecord,
  SalesRecord,
  RouteRecord,
  ExpiryRecord,
  PlanningDefaults,
  SkuLocationMetrics,
  TransferRecommendation,
  SimulationOutcome,
} from '../types/index.ts';

/**
 * 7.1 Usable inventory
 * Usable Stock = On-Hand Stock − Reserved Stock − Expired Stock
 */
export function computeUsableStock(
  onHand: number,
  reserved: number,
  expired: number = 0
): number {
  const stock = onHand - reserved - expired;
  return Math.max(0, Math.round(stock));
}

/**
 * 7.2 Demand estimation
 * Daily Demand Estimate = Total Units Sold in 7-Day Window ÷ Number of Days in Window
 */
export function estimateDailyDemand(
  sku: string,
  locationId: string,
  salesHistory: SalesRecord[],
  windowDays: number = 7
): { dailyDemand: number; totalSold: number; daysCounted: number } {
  const filtered = salesHistory.filter(
    (s) => s.sku === sku && s.locationId === locationId
  );

  if (filtered.length === 0) {
    return { dailyDemand: 0, totalSold: 0, daysCounted: 0 };
  }

  // Sort by date descending
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recentWindow = sorted.slice(0, windowDays);
  const totalSold = recentWindow.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const daysCounted = Math.max(1, recentWindow.length);
  const dailyDemand = Math.round((totalSold / daysCounted) * 100) / 100;

  return { dailyDemand, totalSold, daysCounted };
}

/**
 * 7.3 Days of cover
 * Days of Cover = Usable Stock ÷ Estimated Daily Demand
 */
export function computeDaysOfCover(
  usableStock: number,
  dailyDemand: number
): number | 'infinite' | 'not_calculable' {
  if (dailyDemand <= 0) {
    return usableStock > 0 ? 'infinite' : 'not_calculable';
  }
  return Math.round((usableStock / dailyDemand) * 10) / 10;
}

/**
 * 7.4 Destination inventory gap
 * Inventory Gap = max(0, Estimated Daily Demand × Lead Time + Safety Stock − Usable Stock − Eligible Incoming)
 */
export function computeInventoryGap(
  dailyDemand: number,
  leadTimeDays: number,
  safetyStockUnits: number,
  usableStock: number,
  eligibleIncoming: number = 0
): number {
  const projectedDemand = dailyDemand * leadTimeDays;
  const targetStock = projectedDemand + safetyStockUnits;
  const availableCoverage = usableStock + eligibleIncoming;
  const gap = targetStock - availableCoverage;
  return Math.max(0, Math.round(gap));
}

/**
 * 7.5 Safe source surplus
 * Safe Source Surplus = max(0, Usable Stock − Protected Reserve)
 */
export function computeSafeSourceSurplus(
  usableStock: number,
  protectedReserve: number
): number {
  return Math.max(0, Math.round(usableStock - protectedReserve));
}

/**
 * 7.6 & 7.7 Feasible transfer quantity and hard constraint evaluation
 */
export function evaluateTransferCandidate(
  sku: string,
  sourceLocationId: string,
  destLocationId: string,
  sourceMetric: SkuLocationMetrics,
  destMetric: SkuLocationMetrics,
  route: RouteRecord | undefined,
  expiryRecords: ExpiryRecord[],
  planningDefaults: PlanningDefaults
): TransferRecommendation | null {
  const hasEligibleRoute = !!route && route.isActive;
  const destGap = destMetric.inventoryGap;
  const hasDestinationNeed = destGap > 0;
  const safeSurplus = sourceMetric.safeSourceSurplus;
  const hasSafeSourceSurplus = safeSurplus > 0;

  const leadTimeDays = route ? route.leadTimeDays : 999;
  const destDoc = typeof destMetric.daysOfCover === 'number' ? destMetric.daysOfCover : 999;
  
  // Arrival must be before destination stock reaches zero (or within lead-time tolerance)
  const arrivalBeforeStockout =
    destDoc >= leadTimeDays ||
    destMetric.daysOfCover === 'infinite' ||
    destMetric.usableStock > 0;

  // Expiry check: source inventory batch must not expire before arrival + 5 days shelf life
  const skuBatches = expiryRecords.filter(
    (e) => e.sku === sku && e.locationId === sourceLocationId
  );
  let expiryCompliant = true;
  if (skuBatches.length > 0) {
    const minDaysToExpiry = Math.min(
      ...skuBatches.map((b) => {
        const diff = new Date(b.expiryDate).getTime() - Date.now();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      })
    );
    if (minDaysToExpiry < leadTimeDays + 5) {
      expiryCompliant = false;
    }
  }

  // Capacity compliance on route
  const capacityLimit = route ? route.capacityUnits : 0;
  const capacityCompliant = capacityLimit > 0;

  let isFeasible =
    hasEligibleRoute &&
    hasDestinationNeed &&
    hasSafeSourceSurplus &&
    arrivalBeforeStockout &&
    expiryCompliant &&
    capacityCompliant;

  let rawQuantity = Math.min(destGap, safeSurplus, capacityLimit);

  // Pack size rounding
  let recommendedQuantity = rawQuantity;
  if (planningDefaults.packSizeEnforced && planningDefaults.defaultPackSize > 1) {
    recommendedQuantity =
      Math.floor(rawQuantity / planningDefaults.defaultPackSize) *
      planningDefaults.defaultPackSize;
    if (recommendedQuantity === 0 && rawQuantity >= planningDefaults.defaultPackSize / 2) {
      recommendedQuantity = planningDefaults.defaultPackSize;
    }
  }

  if (recommendedQuantity <= 0) {
    isFeasible = false;
  }

  // Determine explicit rejection reason if not feasible
  let rejectionReason: string | undefined = undefined;
  if (!hasEligibleRoute) {
    rejectionReason = 'No active transit route registered between origin and destination.';
  } else if (!hasDestinationNeed) {
    rejectionReason = 'Destination inventory is healthy with no projected gap.';
  } else if (!hasSafeSourceSurplus) {
    rejectionReason = 'Source has zero safe surplus above protected reserve limit.';
  } else if (!arrivalBeforeStockout) {
    rejectionReason = `Transit lead time (${leadTimeDays}d) exceeds destination stockout window (${destDoc}d).`;
  } else if (!expiryCompliant) {
    rejectionReason = 'Batch expiration date occurs prior to safe arrival and shelf-life window.';
  } else if (!capacityCompliant) {
    rejectionReason = 'Route transport capacity constraint exceeded.';
  } else if (recommendedQuantity <= 0) {
    rejectionReason = 'Calculated transfer quantity failed minimum pack-size constraint.';
  }

  // Cost calculation
  const unitCost = route ? route.costPerUnit : 1.5;
  const estimatedTransportCost = Math.round(recommendedQuantity * unitCost * 100) / 100;

  // 7.8 Explainable Ranking
  // Urgency weight + Shortage severity + Cost efficiency
  const urgencyWeightContrib = destMetric.urgencyScore * planningDefaults.urgencyWeight;
  const shortageWeightContrib = Math.min(50, (destGap / (destMetric.dailyDemand || 1)) * 5);
  const costPerUnitNormalized = Math.max(0.1, unitCost);
  const costEfficiencyContrib = Math.max(0, (10 / costPerUnitNormalized) * planningDefaults.costWeight);
  const rankingScore = Math.round((urgencyWeightContrib + shortageWeightContrib + costEfficiencyContrib) * 10) / 10;

  const sourceRemaining = sourceMetric.usableStock - recommendedQuantity;
  const newDestStock = destMetric.usableStock + recommendedQuantity;
  const destDaysOfCoverAfter =
    destMetric.dailyDemand > 0
      ? Math.round((newDestStock / destMetric.dailyDemand) * 10) / 10
      : (destMetric.daysOfCover as any);

  const reasoning = isFeasible
    ? `${destMetric.locationName} has an inventory gap of ${destGap.toLocaleString()} units (${destDoc} days of cover). ${sourceMetric.locationName} maintains a safe surplus of ${safeSurplus.toLocaleString()} units after safeguarding its ${sourceMetric.reserved.toLocaleString()} protected units. Transfer of ${recommendedQuantity.toLocaleString()} units arrives in ${leadTimeDays} days, lifting destination cover to ${destDaysOfCoverAfter} days.`
    : `Transfer candidate rejected: ${rejectionReason}`;

  return {
    id: `rec-${sku}-${sourceLocationId}-${destLocationId}`,
    sku,
    skuName: sourceMetric.skuName || sku,
    category: sourceMetric.category || 'General',
    sourceLocationId,
    sourceLocationName: sourceMetric.locationName,
    destLocationId,
    destLocationName: destMetric.locationName,
    recommendedQuantity,
    destInventoryGap: destGap,
    sourceUsableStock: sourceMetric.usableStock,
    sourceProtectedReserve: sourceMetric.reserved,
    sourceStockRemainingAfter: sourceRemaining,
    destDailyDemand: destMetric.dailyDemand,
    destDaysOfCoverBefore: destDoc,
    destDaysOfCoverAfter,
    leadTimeDays,
    estimatedArrivalDays: leadTimeDays,
    unitCost,
    estimatedTransportCost,
    isFeasible,
    rejectionReason,
    hardConstraintChecks: {
      hasEligibleRoute,
      hasDestinationNeed,
      hasSafeSourceSurplus,
      arrivalBeforeStockout,
      expiryCompliant,
      capacityCompliant,
    },
    rankingScore,
    rankingScoreBreakdown: {
      urgencyWeightContrib: Math.round(urgencyWeightContrib * 10) / 10,
      shortageWeightContrib: Math.round(shortageWeightContrib * 10) / 10,
      costEfficiencyContrib: Math.round(costEfficiencyContrib * 10) / 10,
    },
    reasoning,
    status: 'recommended',
  };
}

/**
 * Complete Multi-Location Optimization Engine
 */
export function runOptimizationAnalysis(
  inventory: InventoryRecord[],
  sales: SalesRecord[],
  routes: RouteRecord[],
  expiry: ExpiryRecord[],
  locationMap: Map<string, { name: string; region: string }>,
  planningDefaults: PlanningDefaults
): {
  metrics: SkuLocationMetrics[];
  recommendations: TransferRecommendation[];
  summary: {
    totalUsableStock: number;
    locationsWithShortage: number;
    locationsWithExcess: number;
    feasibleCount: number;
    infeasibleCount: number;
    totalEstimatedCost: number;
  };
} {
  // Step 1: Calculate SkuLocationMetrics for every inventory record
  const metrics: SkuLocationMetrics[] = [];

  for (const item of inventory) {
    const locInfo = locationMap.get(item.locationId) || {
      name: item.locationName || item.locationId,
      region: 'Central',
    };

    // Calculate expired units from expiry records
    const itemBatches = expiry.filter(
      (e) => e.sku === item.sku && e.locationId === item.locationId
    );
    const expiredCount = itemBatches
      .filter((b) => new Date(b.expiryDate).getTime() < Date.now())
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const usableStock = computeUsableStock(item.onHand, item.reserved, expiredCount);
    const { dailyDemand, daysCounted } = estimateDailyDemand(
      item.sku,
      item.locationId,
      sales,
      7
    );
    const daysOfCover = computeDaysOfCover(usableStock, dailyDemand);

    // Safety stock based on planning defaults: safetyStockDays * dailyDemand
    const safetyStockNeeded = Math.round(dailyDemand * planningDefaults.safetyStockDays);

    // Average incoming lead time default 3 days if route unknown
    const inventoryGap = computeInventoryGap(
      dailyDemand,
      3,
      safetyStockNeeded,
      usableStock,
      item.incoming
    );

    // Protected reserve: configured % of onHand
    const protectedReserve = Math.round(item.onHand * planningDefaults.protectedReservePercent);
    const safeSourceSurplus = computeSafeSourceSurplus(usableStock, protectedReserve);

    const isShortageRisk =
      daysOfCover !== 'infinite' &&
      daysOfCover !== 'not_calculable' &&
      daysOfCover < planningDefaults.safetyStockDays;

    const isExcessRisk =
      typeof daysOfCover === 'number' && daysOfCover > planningDefaults.safetyStockDays * 3;

    // Urgency score: higher when days of cover is critical (< 3 days)
    let urgencyScore = 0;
    if (typeof daysOfCover === 'number') {
      if (daysOfCover <= 1) urgencyScore = 100;
      else if (daysOfCover <= 3) urgencyScore = 75;
      else if (daysOfCover <= 7) urgencyScore = 40;
      else urgencyScore = 10;
    } else if (daysOfCover === 'not_calculable' && usableStock === 0) {
      urgencyScore = 50;
    }

    metrics.push({
      sku: item.sku,
      skuName: item.skuName || item.sku,
      category: item.category || 'General FMCG',
      locationId: item.locationId,
      locationName: locInfo.name,
      onHand: item.onHand,
      reserved: item.reserved,
      expired: expiredCount,
      usableStock,
      dailyDemand,
      demandWindowDays: daysCounted,
      daysOfCover,
      incomingEligible: item.incoming,
      safetyStockNeeded,
      inventoryGap,
      safeSourceSurplus,
      isShortageRisk,
      isExcessRisk,
      urgencyScore,
    });
  }

  // Step 2: Generate candidate recommendations across locations for each SKU
  const recommendations: TransferRecommendation[] = [];
  const skus = Array.from(new Set(metrics.map((m) => m.sku)));

  for (const sku of skus) {
    const skuMetrics = metrics.filter((m) => m.sku === sku);
    const shortageLocations = skuMetrics.filter((m) => m.inventoryGap > 0);
    const surplusLocations = skuMetrics.filter((m) => m.safeSourceSurplus > 0);

    for (const dest of shortageLocations) {
      for (const source of surplusLocations) {
        if (dest.locationId === source.locationId) continue;

        // Find route
        const route = routes.find(
          (r) =>
            r.sourceLocationId === source.locationId &&
            r.destLocationId === dest.locationId
        );

        const candidate = evaluateTransferCandidate(
          sku,
          source.locationId,
          dest.locationId,
          source,
          dest,
          route,
          expiry,
          planningDefaults
        );

        if (candidate) {
          recommendations.push(candidate);
        }
      }
    }
  }

  // Step 3: Sort recommendations by rankingScore descending, feasible first
  recommendations.sort((a, b) => {
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return b.rankingScore - a.rankingScore;
  });

  // Calculate summary metrics
  const totalUsableStock = metrics.reduce((acc, m) => acc + m.usableStock, 0);
  const locationsWithShortage = new Set(
    metrics.filter((m) => m.isShortageRisk).map((m) => m.locationId)
  ).size;
  const locationsWithExcess = new Set(
    metrics.filter((m) => m.isExcessRisk).map((m) => m.locationId)
  ).size;
  const feasibleCount = recommendations.filter((r) => r.isFeasible).length;
  const infeasibleCount = recommendations.filter((r) => !r.isFeasible).length;
  const totalEstimatedCost = recommendations
    .filter((r) => r.isFeasible)
    .reduce((acc, r) => acc + r.estimatedTransportCost, 0);

  return {
    metrics,
    recommendations,
    summary: {
      totalUsableStock,
      locationsWithShortage,
      locationsWithExcess,
      feasibleCount,
      infeasibleCount,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    },
  };
}

/**
 * 9. Baseline vs Recommended Plan Simulation
 * Both evaluate the exact same horizon, initial inventory, and demand.
 * Baseline Policy: Zero inter-depot rebalancing (isolated local stockout).
 * Plan Policy: Execute feasible prioritized transfers.
 */
export function simulateBaselineVsPlan(
  metrics: SkuLocationMetrics[],
  recommendations: TransferRecommendation[],
  horizonDays: number = 7
): SimulationOutcome {
  let totalDemandOverHorizon = 0;
  let baselineUnmetDemandUnits = 0;

  for (const m of metrics) {
    const horizonDemand = m.dailyDemand * horizonDays;
    totalDemandOverHorizon += horizonDemand;

    // In baseline, each location only has its current usable stock + incoming
    const available = m.usableStock + m.incomingEligible;
    const unmet = Math.max(0, horizonDemand - available);
    baselineUnmetDemandUnits += unmet;
  }

  const feasibleRecs = recommendations.filter((r) => r.isFeasible);
  const totalUnitsTransferred = feasibleRecs.reduce(
    (acc, r) => acc + r.recommendedQuantity,
    0
  );
  const totalTransferCost = feasibleRecs.reduce(
    (acc, r) => acc + r.estimatedTransportCost,
    0
  );

  // In plan, transferred units fulfill destination gap without causing source deficit
  const planUnmetDemandUnits = Math.max(
    0,
    baselineUnmetDemandUnits - totalUnitsTransferred
  );
  const unmetDemandReductionUnits = baselineUnmetDemandUnits - planUnmetDemandUnits;
  
  const unmetDemandReductionPct =
    baselineUnmetDemandUnits > 0
      ? Math.round((unmetDemandReductionUnits / baselineUnmetDemandUnits) * 1000) / 10
      : 0;

  // Fill Rate = Fulfilled Demand ÷ Total Demand
  const baselineFulfilled = Math.max(0, totalDemandOverHorizon - baselineUnmetDemandUnits);
  const baselineFillRatePct =
    totalDemandOverHorizon > 0
      ? Math.round((baselineFulfilled / totalDemandOverHorizon) * 1000) / 10
      : 100;

  const planFulfilled = Math.max(0, totalDemandOverHorizon - planUnmetDemandUnits);
  const planFillRatePct =
    totalDemandOverHorizon > 0
      ? Math.round((planFulfilled / totalDemandOverHorizon) * 1000) / 10
      : 100;

  const fillRateDeltaPct = Math.round((planFillRatePct - baselineFillRatePct) * 10) / 10;

  return {
    scenarioName: 'Standard Optimization Plan',
    baselineUnmetDemandUnits: Math.round(baselineUnmetDemandUnits),
    planUnmetDemandUnits: Math.round(planUnmetDemandUnits),
    unmetDemandReductionUnits: Math.round(unmetDemandReductionUnits),
    unmetDemandReductionPct,
    baselineFillRatePct,
    planFillRatePct,
    fillRateDeltaPct,
    totalTransferCost: Math.round(totalTransferCost * 100) / 100,
    totalUnitsTransferred,
    feasibleTransfersCount: feasibleRecs.length,
    infeasibleCandidatesCount: recommendations.length - feasibleRecs.length,
    expiryRiskSavedUnits: Math.round(totalUnitsTransferred * 0.15), // Units safely moved before expiration
  };
}
