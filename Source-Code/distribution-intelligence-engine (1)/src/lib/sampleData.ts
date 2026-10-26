import {
  InventoryRecord,
  SalesRecord,
  RouteRecord,
  ExpiryRecord,
  LocationInfo,
  PlanningDefaults,
} from '../types/index.ts';

export const SAMPLE_LOCATIONS: LocationInfo[] = [
  {
    id: 'LOC-CENTRAL',
    name: 'Central Logistics Hub',
    region: 'Midwest Central',
    type: 'distribution_center',
    maxCapacityUnits: 150000,
  },
  {
    id: 'LOC-NORTH',
    name: 'North Regional Depot',
    region: 'Upper Midwest',
    type: 'regional_depot',
    maxCapacityUnits: 65000,
  },
  {
    id: 'LOC-METRO',
    name: 'Metro Retail Fulfillment',
    region: 'Great Lakes Metro',
    type: 'retail_hub',
    maxCapacityUnits: 45000,
  },
  {
    id: 'LOC-WEST',
    name: 'Western Regional Center',
    region: 'Front Range',
    type: 'distribution_center',
    maxCapacityUnits: 110000,
  },
  {
    id: 'LOC-COAST',
    name: 'Coastal Transit Depot',
    region: 'Eastern Gateway',
    type: 'regional_depot',
    maxCapacityUnits: 55000,
  },
];

export const DEFAULT_PLANNING_DEFAULTS: PlanningDefaults = {
  safetyStockDays: 4,
  protectedReservePercent: 0.2, // 20% reserved
  planningHorizonDays: 7,
  costWeight: 0.35,
  urgencyWeight: 0.65,
  packSizeEnforced: true,
  defaultPackSize: 24, // Standard FMCG case carton
};

export const SAMPLE_INVENTORY: InventoryRecord[] = [
  // SKU-101: Pure Dairy Milk 1L
  {
    sku: 'SKU-101',
    skuName: 'Pure Dairy Milk 1L',
    category: 'Dairy',
    locationId: 'LOC-CENTRAL',
    locationName: 'Central Logistics Hub',
    onHand: 14200,
    reserved: 2840,
    incoming: 4000,
    unitCost: 1.85,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-101',
    skuName: 'Pure Dairy Milk 1L',
    category: 'Dairy',
    locationId: 'LOC-NORTH',
    locationName: 'North Regional Depot',
    onHand: 620,
    reserved: 124,
    incoming: 0,
    unitCost: 1.85,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-101',
    skuName: 'Pure Dairy Milk 1L',
    category: 'Dairy',
    locationId: 'LOC-METRO',
    locationName: 'Metro Retail Fulfillment',
    onHand: 380,
    reserved: 76,
    incoming: 0,
    unitCost: 1.85,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-101',
    skuName: 'Pure Dairy Milk 1L',
    category: 'Dairy',
    locationId: 'LOC-WEST',
    locationName: 'Western Regional Center',
    onHand: 8500,
    reserved: 1700,
    incoming: 2000,
    unitCost: 1.85,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-101',
    skuName: 'Pure Dairy Milk 1L',
    category: 'Dairy',
    locationId: 'LOC-COAST',
    locationName: 'Coastal Transit Depot',
    onHand: 2400,
    reserved: 480,
    incoming: 0,
    unitCost: 1.85,
    recordDate: '2026-10-24',
  },

  // SKU-102: Cold Brew Espresso 250ml
  {
    sku: 'SKU-102',
    skuName: 'Cold Brew Espresso 250ml',
    category: 'Beverages',
    locationId: 'LOC-CENTRAL',
    locationName: 'Central Logistics Hub',
    onHand: 19800,
    reserved: 3960,
    incoming: 0,
    unitCost: 1.45,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-102',
    skuName: 'Cold Brew Espresso 250ml',
    category: 'Beverages',
    locationId: 'LOC-NORTH',
    locationName: 'North Regional Depot',
    onHand: 4200,
    reserved: 840,
    incoming: 0,
    unitCost: 1.45,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-102',
    skuName: 'Cold Brew Espresso 250ml',
    category: 'Beverages',
    locationId: 'LOC-METRO',
    locationName: 'Metro Retail Fulfillment',
    onHand: 450,
    reserved: 90,
    incoming: 0,
    unitCost: 1.45,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-102',
    skuName: 'Cold Brew Espresso 250ml',
    category: 'Beverages',
    locationId: 'LOC-WEST',
    locationName: 'Western Regional Center',
    onHand: 9200,
    reserved: 1840,
    incoming: 1500,
    unitCost: 1.45,
    recordDate: '2026-10-24',
  },

  // SKU-103: Artisan Whole Wheat Loaf 500g
  {
    sku: 'SKU-103',
    skuName: 'Artisan Whole Wheat Loaf 500g',
    category: 'Bakery',
    locationId: 'LOC-CENTRAL',
    locationName: 'Central Logistics Hub',
    onHand: 5600,
    reserved: 1120,
    incoming: 2000,
    unitCost: 2.1,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-103',
    skuName: 'Artisan Whole Wheat Loaf 500g',
    category: 'Bakery',
    locationId: 'LOC-NORTH',
    locationName: 'North Regional Depot',
    onHand: 180,
    reserved: 36,
    incoming: 0,
    unitCost: 2.1,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-103',
    skuName: 'Artisan Whole Wheat Loaf 500g',
    category: 'Bakery',
    locationId: 'LOC-METRO',
    locationName: 'Metro Retail Fulfillment',
    onHand: 240,
    reserved: 48,
    incoming: 0,
    unitCost: 2.1,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-103',
    skuName: 'Artisan Whole Wheat Loaf 500g',
    category: 'Bakery',
    locationId: 'LOC-COAST',
    locationName: 'Coastal Transit Depot',
    onHand: 3100,
    reserved: 620,
    incoming: 500,
    unitCost: 2.1,
    recordDate: '2026-10-24',
  },

  // SKU-104: Sparkling Mineral Water 1.5L
  {
    sku: 'SKU-104',
    skuName: 'Sparkling Mineral Water 1.5L',
    category: 'Beverages',
    locationId: 'LOC-CENTRAL',
    locationName: 'Central Logistics Hub',
    onHand: 24000,
    reserved: 4800,
    incoming: 5000,
    unitCost: 0.95,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-104',
    skuName: 'Sparkling Mineral Water 1.5L',
    category: 'Beverages',
    locationId: 'LOC-NORTH',
    locationName: 'North Regional Depot',
    onHand: 950,
    reserved: 190,
    incoming: 0,
    unitCost: 0.95,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-104',
    skuName: 'Sparkling Mineral Water 1.5L',
    category: 'Beverages',
    locationId: 'LOC-METRO',
    locationName: 'Metro Retail Fulfillment',
    onHand: 620,
    reserved: 124,
    incoming: 0,
    unitCost: 0.95,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-104',
    skuName: 'Sparkling Mineral Water 1.5L',
    category: 'Beverages',
    locationId: 'LOC-WEST',
    locationName: 'Western Regional Center',
    onHand: 16500,
    reserved: 3300,
    incoming: 0,
    unitCost: 0.95,
    recordDate: '2026-10-24',
  },

  // SKU-105: Greek Yogurt Honey 150g
  {
    sku: 'SKU-105',
    skuName: 'Greek Yogurt Honey 150g',
    category: 'Dairy',
    locationId: 'LOC-CENTRAL',
    locationName: 'Central Logistics Hub',
    onHand: 11200,
    reserved: 2240,
    incoming: 3000,
    unitCost: 1.15,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-105',
    skuName: 'Greek Yogurt Honey 150g',
    category: 'Dairy',
    locationId: 'LOC-NORTH',
    locationName: 'North Regional Depot',
    onHand: 420,
    reserved: 84,
    incoming: 0,
    unitCost: 1.15,
    recordDate: '2026-10-24',
  },
  {
    sku: 'SKU-105',
    skuName: 'Greek Yogurt Honey 150g',
    category: 'Dairy',
    locationId: 'LOC-METRO',
    locationName: 'Metro Retail Fulfillment',
    onHand: 310,
    reserved: 62,
    incoming: 0,
    unitCost: 1.15,
    recordDate: '2026-10-24',
  },
];

// Generate 7-day sales records
export const SAMPLE_SALES: SalesRecord[] = [];
const days = [
  '2026-10-18',
  '2026-10-19',
  '2026-10-20',
  '2026-10-21',
  '2026-10-22',
  '2026-10-23',
  '2026-10-24',
];

const salesPatterns: Record<string, Record<string, number>> = {
  'SKU-101': {
    'LOC-CENTRAL': 320,
    'LOC-NORTH': 240,
    'LOC-METRO': 380,
    'LOC-WEST': 290,
    'LOC-COAST': 180,
  },
  'SKU-102': {
    'LOC-CENTRAL': 410,
    'LOC-NORTH': 190,
    'LOC-METRO': 460,
    'LOC-WEST': 310,
    'LOC-COAST': 140,
  },
  'SKU-103': {
    'LOC-CENTRAL': 160,
    'LOC-NORTH': 110,
    'LOC-METRO': 210,
    'LOC-WEST': 140,
    'LOC-COAST': 95,
  },
  'SKU-104': {
    'LOC-CENTRAL': 480,
    'LOC-NORTH': 310,
    'LOC-METRO': 540,
    'LOC-WEST': 390,
    'LOC-COAST': 220,
  },
  'SKU-105': {
    'LOC-CENTRAL': 290,
    'LOC-NORTH': 200,
    'LOC-METRO': 350,
    'LOC-WEST': 240,
    'LOC-COAST': 130,
  },
};

for (const sku of Object.keys(salesPatterns)) {
  for (const loc of Object.keys(salesPatterns[sku])) {
    const base = salesPatterns[sku][loc];
    days.forEach((date, index) => {
      // Deterministic slight day-of-week curve
      const variance = (index % 3 === 0 ? 1.15 : index % 2 === 0 ? 0.95 : 1.02);
      const units = Math.round(base * variance);
      SAMPLE_SALES.push({
        sku,
        locationId: loc,
        date,
        unitsSold: units,
      });
    });
  }
}

export const SAMPLE_ROUTES: RouteRecord[] = [
  // Central Hub to destinations
  {
    sourceLocationId: 'LOC-CENTRAL',
    destLocationId: 'LOC-NORTH',
    leadTimeDays: 1,
    costPerUnit: 0.42,
    capacityUnits: 6000,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-CENTRAL',
    destLocationId: 'LOC-METRO',
    leadTimeDays: 1,
    costPerUnit: 0.38,
    capacityUnits: 8000,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-CENTRAL',
    destLocationId: 'LOC-WEST',
    leadTimeDays: 2,
    costPerUnit: 0.85,
    capacityUnits: 5000,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-CENTRAL',
    destLocationId: 'LOC-COAST',
    leadTimeDays: 2,
    costPerUnit: 0.72,
    capacityUnits: 5000,
    isActive: true,
  },

  // Western DC to destinations
  {
    sourceLocationId: 'LOC-WEST',
    destLocationId: 'LOC-NORTH',
    leadTimeDays: 2,
    costPerUnit: 0.95,
    capacityUnits: 4000,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-WEST',
    destLocationId: 'LOC-METRO',
    leadTimeDays: 3,
    costPerUnit: 1.25,
    capacityUnits: 3500,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-WEST',
    destLocationId: 'LOC-CENTRAL',
    leadTimeDays: 2,
    costPerUnit: 0.85,
    capacityUnits: 6000,
    isActive: true,
  },

  // Coastal to Metro
  {
    sourceLocationId: 'LOC-COAST',
    destLocationId: 'LOC-METRO',
    leadTimeDays: 1,
    costPerUnit: 0.48,
    capacityUnits: 4500,
    isActive: true,
  },
  {
    sourceLocationId: 'LOC-COAST',
    destLocationId: 'LOC-CENTRAL',
    leadTimeDays: 2,
    costPerUnit: 0.72,
    capacityUnits: 4000,
    isActive: true,
  },
];

export const SAMPLE_EXPIRY: ExpiryRecord[] = [
  {
    sku: 'SKU-101',
    locationId: 'LOC-CENTRAL',
    batchId: 'B-MLK-2611-A',
    quantity: 8000,
    expiryDate: '2026-11-20',
  },
  {
    sku: 'SKU-101',
    locationId: 'LOC-CENTRAL',
    batchId: 'B-MLK-2611-B',
    quantity: 6200,
    expiryDate: '2026-12-05',
  },
  {
    sku: 'SKU-103',
    locationId: 'LOC-CENTRAL',
    batchId: 'B-BRD-2611-01',
    quantity: 3600,
    expiryDate: '2026-11-12',
  },
  {
    sku: 'SKU-103',
    locationId: 'LOC-CENTRAL',
    batchId: 'B-BRD-2611-02',
    quantity: 2000,
    expiryDate: '2026-11-28',
  },
  {
    sku: 'SKU-105',
    locationId: 'LOC-CENTRAL',
    batchId: 'B-YGT-2611-X',
    quantity: 11200,
    expiryDate: '2026-11-25',
  },
];
