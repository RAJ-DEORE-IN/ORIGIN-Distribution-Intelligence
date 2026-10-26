export type Role = 'admin' | 'planner' | 'warehouse_mgr' | 'regional_mgr' | 'analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  mobileNumber?: string;
  address?: string;
  photoURL?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  planningDefaults: PlanningDefaults;
  createdAt: string;
}

export interface PlanningDefaults {
  safetyStockDays: number;
  protectedReservePercent: number; // e.g. 0.20 for 20%
  planningHorizonDays: number;     // e.g. 7 or 14 days
  costWeight: number;              // heuristic weighting 0-1
  urgencyWeight: number;
  packSizeEnforced: boolean;
  defaultPackSize: number;
}

export interface InventoryRecord {
  sku: string;
  skuName?: string;
  category?: string;
  locationId: string;
  locationName?: string;
  onHand: number;
  reserved: number;
  incoming: number;
  incomingNeedDate?: string;
  unitCost: number;
  recordDate: string;
}

export interface SalesRecord {
  sku: string;
  locationId: string;
  date: string;
  unitsSold: number;
}

export interface RouteRecord {
  sourceLocationId: string;
  destLocationId: string;
  leadTimeDays: number;
  costPerUnit: number;
  capacityUnits: number;
  isActive: boolean;
}

export interface ExpiryRecord {
  sku: string;
  locationId: string;
  batchId: string;
  quantity: number;
  expiryDate: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  region: string;
  type: 'distribution_center' | 'regional_depot' | 'retail_hub';
  maxCapacityUnits: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  dataset: 'inventory' | 'sales' | 'routes' | 'expiry';
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationSummary {
  isValid: boolean;
  hasBlockingErrors: boolean;
  totalRows: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  datasetsDetected: {
    inventoryRows: number;
    salesRows: number;
    routesRows: number;
    expiryRows: number;
  };
}

export interface SkuLocationMetrics {
  sku: string;
  skuName: string;
  category: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  expired: number;
  usableStock: number;
  dailyDemand: number;
  demandWindowDays: number;
  daysOfCover: number | 'infinite' | 'not_calculable';
  incomingEligible: number;
  safetyStockNeeded: number;
  inventoryGap: number;
  safeSourceSurplus: number;
  isShortageRisk: boolean;
  isExcessRisk: boolean;
  urgencyScore: number;
}

export interface TransferRecommendation {
  id: string;
  sku: string;
  skuName: string;
  category: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destLocationId: string;
  destLocationName: string;
  recommendedQuantity: number;
  destInventoryGap: number;
  sourceUsableStock: number;
  sourceProtectedReserve: number;
  sourceStockRemainingAfter: number;
  destDailyDemand: number;
  destDaysOfCoverBefore: number | 'infinite';
  destDaysOfCoverAfter: number;
  leadTimeDays: number;
  estimatedArrivalDays: number;
  unitCost: number;
  estimatedTransportCost: number;
  isFeasible: boolean;
  rejectionReason?: string;
  hardConstraintChecks: {
    hasEligibleRoute: boolean;
    hasDestinationNeed: boolean;
    hasSafeSourceSurplus: boolean;
    arrivalBeforeStockout: boolean;
    expiryCompliant: boolean;
    capacityCompliant: boolean;
  };
  rankingScore: number;
  rankingScoreBreakdown: {
    urgencyWeightContrib: number;
    shortageWeightContrib: number;
    costEfficiencyContrib: number;
  };
  reasoning: string;
  status: 'recommended' | 'approved' | 'rejected' | 'in_transit';
}

export interface SimulationOutcome {
  scenarioName: string;
  baselineUnmetDemandUnits: number;
  planUnmetDemandUnits: number;
  unmetDemandReductionUnits: number;
  unmetDemandReductionPct: number;
  baselineFillRatePct: number;
  planFillRatePct: number;
  fillRateDeltaPct: number;
  totalTransferCost: number;
  totalUnitsTransferred: number;
  feasibleTransfersCount: number;
  infeasibleCandidatesCount: number;
  expiryRiskSavedUnits: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  category: 'data' | 'analysis' | 'planning' | 'auth';
}
