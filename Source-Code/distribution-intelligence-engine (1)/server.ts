import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  SAMPLE_INVENTORY,
  SAMPLE_SALES,
  SAMPLE_ROUTES,
  SAMPLE_EXPIRY,
  SAMPLE_LOCATIONS,
  DEFAULT_PLANNING_DEFAULTS,
} from './src/lib/sampleData.ts';
import {
  runOptimizationAnalysis,
  simulateBaselineVsPlan,
} from './src/lib/calculator.ts';
import {
  exportRecommendationsToCsv,
  exportRiskAnalysisToCsv,
} from './src/lib/csvParser.ts';
import { User, Organization, AuditLogEntry } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// In-Memory Database Store with initial seed
interface AppState {
  organizations: Organization[];
  users: User[];
  activeOrgId: string;
  inventory: typeof SAMPLE_INVENTORY;
  sales: typeof SAMPLE_SALES;
  routes: typeof SAMPLE_ROUTES;
  expiry: typeof SAMPLE_EXPIRY;
  locations: typeof SAMPLE_LOCATIONS;
  planningDefaults: typeof DEFAULT_PLANNING_DEFAULTS;
  approvedRecommendations: Record<string, 'approved' | 'rejected' | 'in_transit'>;
  auditLogs: AuditLogEntry[];
}

const state: AppState = {
  organizations: [
    {
      id: 'org-midwest-fmcg',
      name: 'Midwest Consumer Distribution',
      industry: 'FMCG & Perishables',
      planningDefaults: { ...DEFAULT_PLANNING_DEFAULTS },
      createdAt: '2026-10-01',
    },
    {
      id: 'org-coastal-retail',
      name: 'Coastal Beverage & Pantry',
      industry: 'Beverages & Retail Logistics',
      planningDefaults: { ...DEFAULT_PLANNING_DEFAULTS, safetyStockDays: 5 },
      createdAt: '2026-10-15',
    },
  ],
  users: [
    {
      id: 'usr-1',
      email: 'rajdeore074@gmail.com',
      name: 'Raj Deore',
      role: 'planner',
      organizationId: 'org-midwest-fmcg',
    },
    {
      id: 'usr-2',
      email: 'operations@distribution.net',
      name: 'Alex Vance',
      role: 'admin',
      organizationId: 'org-midwest-fmcg',
    },
  ],
  activeOrgId: 'org-midwest-fmcg',
  inventory: [...SAMPLE_INVENTORY],
  sales: [...SAMPLE_SALES],
  routes: [...SAMPLE_ROUTES],
  expiry: [...SAMPLE_EXPIRY],
  locations: [...SAMPLE_LOCATIONS],
  planningDefaults: { ...DEFAULT_PLANNING_DEFAULTS },
  approvedRecommendations: {},
  auditLogs: [
    {
      id: 'aud-seed-1',
      timestamp: new Date().toISOString(),
      userId: 'usr-1',
      userName: 'Raj Deore',
      action: 'System Initialized',
      details: 'Loaded verified FMCG synthetic distribution network and historical records.',
      category: 'data',
    },
  ],
};

function logAudit(userId: string, userName: string, action: string, details: string, category: 'data' | 'analysis' | 'planning' | 'auth') {
  state.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    details,
    category,
  });
  if (state.auditLogs.length > 100) state.auditLogs.pop();
}

// ----------------- API ROUTES ----------------- //

// Current user and auth
app.get('/api/auth/me', (req, res) => {
  const user = state.users[0];
  const org = state.organizations.find((o) => o.id === state.activeOrgId);
  res.json({ user, organization: org });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  let user = state.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      email: email || 'planner@enterprise.com',
      name: email ? email.split('@')[0] : 'Distribution Planner',
      role: 'planner',
      organizationId: state.activeOrgId,
    };
    state.users.push(user);
  }
  logAudit(user.id, user.name, 'User Sign In', `User signed in to ${state.activeOrgId}`, 'auth');
  const org = state.organizations.find((o) => o.id === state.activeOrgId);
  res.json({ user, organization: org });
});

// Organization Switcher
app.get('/api/orgs', (req, res) => {
  res.json({
    activeOrgId: state.activeOrgId,
    organizations: state.organizations,
  });
});

app.post('/api/orgs/switch', (req, res) => {
  const { orgId } = req.body;
  const org = state.organizations.find((o) => o.id === orgId);
  if (org) {
    state.activeOrgId = orgId;
    state.planningDefaults = { ...org.planningDefaults };
    logAudit('usr-1', 'Planner', 'Switched Organization', `Switched active organization to ${org.name}`, 'planning');
    res.json({ success: true, activeOrg: org });
  } else {
    res.status(404).json({ error: 'Organization not found' });
  }
});

app.post('/api/orgs/create', (req, res) => {
  const { name, industry } = req.body;
  if (!name) return res.status(400).json({ error: 'Organization name is required' });
  const newOrg: Organization = {
    id: `org-${Date.now()}`,
    name,
    industry: industry || 'FMCG Logistics',
    planningDefaults: { ...DEFAULT_PLANNING_DEFAULTS },
    createdAt: new Date().toISOString().split('T')[0],
  };
  state.organizations.push(newOrg);
  state.activeOrgId = newOrg.id;
  logAudit('usr-1', 'Planner', 'Created Organization', `Created organization ${newOrg.name}`, 'planning');
  res.json({ organization: newOrg });
});

// Get Current Data Sets & Locations
app.get('/api/data/state', (req, res) => {
  res.json({
    inventoryCount: state.inventory.length,
    salesCount: state.sales.length,
    routesCount: state.routes.length,
    expiryCount: state.expiry.length,
    locations: state.locations,
    planningDefaults: state.planningDefaults,
  });
});

// Reset or Load Sample Data
app.post('/api/data/reset-sample', (req, res) => {
  state.inventory = [...SAMPLE_INVENTORY];
  state.sales = [...SAMPLE_SALES];
  state.routes = [...SAMPLE_ROUTES];
  state.expiry = [...SAMPLE_EXPIRY];
  state.approvedRecommendations = {};
  logAudit('usr-1', 'Planner', 'Sample Dataset Loaded', 'Reset workspace to verified synthetic FMCG dataset.', 'data');
  res.json({ success: true, message: 'Sample FMCG dataset loaded successfully.' });
});

// Update Planning Defaults
app.post('/api/planning-defaults', (req, res) => {
  const newDefaults = req.body;
  state.planningDefaults = {
    ...state.planningDefaults,
    ...newDefaults,
  };
  const org = state.organizations.find((o) => o.id === state.activeOrgId);
  if (org) {
    org.planningDefaults = { ...state.planningDefaults };
  }
  logAudit('usr-1', 'Planner', 'Updated Planning Parameters', `Safety stock: ${state.planningDefaults.safetyStockDays}d, Reserve: ${Math.round(state.planningDefaults.protectedReservePercent * 100)}%`, 'planning');
  res.json({ success: true, planningDefaults: state.planningDefaults });
});

// Run Core Optimization Analysis
app.get('/api/analysis/latest', (req, res) => {
  const locMap = new Map(state.locations.map((l) => [l.id, { name: l.name, region: l.region }]));
  const analysis = runOptimizationAnalysis(
    state.inventory,
    state.sales,
    state.routes,
    state.expiry,
    locMap,
    state.planningDefaults
  );

  // Apply stored approval statuses
  analysis.recommendations.forEach((r) => {
    if (state.approvedRecommendations[r.id]) {
      r.status = state.approvedRecommendations[r.id];
    }
  });

  const simulation = simulateBaselineVsPlan(
    analysis.metrics,
    analysis.recommendations,
    state.planningDefaults.planningHorizonDays
  );

  res.json({
    metrics: analysis.metrics,
    recommendations: analysis.recommendations,
    summary: analysis.summary,
    simulation,
  });
});

// Recommendation Status Update (Approve / Reject / In-Transit)
app.post('/api/analysis/recommendations/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['recommended', 'approved', 'rejected', 'in_transit'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  state.approvedRecommendations[id] = status;
  logAudit('usr-1', 'Planner', 'Transfer Status Change', `Recommendation ${id} status set to ${status}`, 'analysis');
  res.json({ success: true, id, status });
});

// Audit Logs
app.get('/api/audit', (req, res) => {
  res.json({ logs: state.auditLogs });
});

// Real CSV Exports
app.get('/api/export/recommendations', (req, res) => {
  const locMap = new Map(state.locations.map((l) => [l.id, { name: l.name, region: l.region }]));
  const analysis = runOptimizationAnalysis(
    state.inventory,
    state.sales,
    state.routes,
    state.expiry,
    locMap,
    state.planningDefaults
  );
  analysis.recommendations.forEach((r) => {
    if (state.approvedRecommendations[r.id]) {
      r.status = state.approvedRecommendations[r.id];
    }
  });
  const csv = exportRecommendationsToCsv(analysis.recommendations);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transfer_recommendations.csv"');
  res.send(csv);
});

app.get('/api/export/risk', (req, res) => {
  const locMap = new Map(state.locations.map((l) => [l.id, { name: l.name, region: l.region }]));
  const analysis = runOptimizationAnalysis(
    state.inventory,
    state.sales,
    state.routes,
    state.expiry,
    locMap,
    state.planningDefaults
  );
  const csv = exportRiskAnalysisToCsv(analysis.metrics);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory_risk_analysis.csv"');
  res.send(csv);
});

// ----------------- GEMINI AI PLANNING ASSISTANT ----------------- //
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, userContext, orgContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const locMap = new Map(state.locations.map((l) => [l.id, { name: l.name, region: l.region }]));
    const analysis = runOptimizationAnalysis(
      state.inventory,
      state.sales,
      state.routes,
      state.expiry,
      locMap,
      state.planningDefaults
    );
    analysis.recommendations.forEach((r) => {
      if (state.approvedRecommendations[r.id]) {
        r.status = state.approvedRecommendations[r.id];
      }
    });

    const activeOrg = orgContext || state.organizations.find((o) => o.id === state.activeOrgId);
    const criticalShortages = analysis.metrics
      .filter((m) => m.isShortageRisk)
      .slice(0, 5)
      .map((m) => `• ${m.skuName} (${m.sku}) at ${m.locationName}: Deficit Gap ${m.inventoryGap} units, Coverage: ${m.daysOfCover} days (Daily demand: ${m.dailyDemand}, Safety stock: ${m.safetyStockNeeded})`);

    const topSurpluses = analysis.metrics
      .filter((m) => m.safeSourceSurplus > 0)
      .slice(0, 5)
      .map((m) => `• ${m.skuName} at ${m.locationName}: Safe Surplus ${m.safeSourceSurplus} units (Usable: ${m.usableStock}, Protected Reserve: ${m.reserved})`);

    const topFeasibleRecs = analysis.recommendations
      .filter((r) => r.isFeasible)
      .slice(0, 5)
      .map((r) => `• Recommendation [${r.id}]: Transfer ${r.recommendedQuantity} units of ${r.skuName} from ${r.sourceLocationName} to ${r.destLocationName} (Lead Time: ${r.leadTimeDays}d, Cost: $${r.estimatedTransportCost}, Status: ${r.status})`);

    const systemPrompt = `You are the senior distribution planning copilot integrated into the FMCG Distribution Intelligence & Inventory Optimization Engine.
You have real-time visibility into the live network, authenticated user session, and supply chain status:

Active User: ${userContext?.name || 'Authorized Planner'} (${userContext?.email || 'Authenticated via Firebase'})
User Contact: ${userContext?.mobileNumber ? `Phone: ${userContext.mobileNumber}, Facility Address: ${userContext.address || 'Central FMCG Hub'}` : 'Onboarding Profile Active'}
Active FMCG Hub / Organization: ${activeOrg?.name} (${activeOrg?.industry})

Live Supply Chain Parameters:
- Safety Stock Days: ${state.planningDefaults.safetyStockDays} days
- Protected Reserve: ${Math.round(state.planningDefaults.protectedReservePercent * 100)}% of on-hand inventory (locked against stockouts at source)
- Planning Horizon: ${state.planningDefaults.planningHorizonDays} days

Live Network Overview:
- Total Locations: ${state.locations.length}
- Total Usable Inventory: ${analysis.summary.totalUsableStock.toLocaleString()} units
- Locations with Shortage Risk: ${analysis.summary.locationsWithShortage}
- Feasible Transfer Recommendations: ${analysis.summary.feasibleCount} (Est Total Cost: $${analysis.summary.totalEstimatedCost.toLocaleString()})

Current Critical Shortages (Needs Stock Urgently):
${criticalShortages.join('\n') || 'None - All locations meet safety stock thresholds.'}

Safe Surplus Warehouses (Can Safely Supply Without Causing Shortage):
${topSurpluses.join('\n') || 'None - No surplus inventory available.'}

Feasible Recommended Transfers (Ready for Immediate Approval):
${topFeasibleRecs.join('\n') || 'None - No feasible transfers calculated.'}

IMPORTANT RULES:
1. Always base your answers on the EXACT numbers, warehouses, SKUs, and costs listed above. NEVER invent synthetic locations or numbers.
2. Explain things simply, clearly, and practically so any human planner or warehouse supervisor can easily understand and make decisions ("user ko simple mai samjhe har chij").
3. When answering questions about shortages or surpluses, mention the warehouse name, SKU name, quantity, and lead time clearly.
4. Keep answers professional, structured, concise, and focused on inventory optimization.`;

    // Initialize Google GenAI
    let reply = '';
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prefer gemini-3.1-flash-lite for instant low-latency response
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.25,
        },
      });

      reply = response.text || '';
    } catch (genAiError: any) {
      console.warn('Primary Gemini call error (falling back):', genAiError?.message || genAiError);

      // Intelligent FMCG Domain-Heuristic Solver Fallback
      const msgLower = (message || '').toLowerCase();
      if (msgLower.includes('shortage') || msgLower.includes('deficit') || msgLower.includes('risk') || msgLower.includes('kami')) {
        reply = `**Critical Inventory Shortages Detected:**\n\n` +
          criticalShortages.map((s) => `${s}`).join('\n') +
          `\n\n**Actionable Advice:** Initiate prioritized inter-hub transfers from safe surplus facilities before the ${state.planningDefaults.safetyStockDays}-day safety stock is breached.`;
      } else if (msgLower.includes('surplus') || msgLower.includes('excess') || msgLower.includes('stock')) {
        reply = `**Safe Source Surplus Hubs (Available for Dispatch):**\n\n` +
          topSurpluses.map((s) => `${s}`).join('\n') +
          `\n\n*Note: Each source facility retains a protected ${Math.round(state.planningDefaults.protectedReservePercent * 100)}% reserve to ensure zero local stockouts.*`;
      } else if (msgLower.includes('transfer') || msgLower.includes('recommend') || msgLower.includes('bhejo')) {
        reply = `**Feasible Stock Transfer Proposals:**\n\n` +
          topFeasibleRecs.map((r) => `${r}`).join('\n') +
          `\n\n**Total Estimated Transport Cost:** $${analysis.summary.totalEstimatedCost.toLocaleString()} across ${analysis.summary.feasibleCount} feasible routes.`;
      } else if (msgLower.includes('fill rate') || msgLower.includes('baseline') || msgLower.includes('compare')) {
        const sim = simulateBaselineVsPlan(analysis.metrics, analysis.recommendations, state.planningDefaults.planningHorizonDays);
        reply = `**Supply Chain Simulation Performance:**\n\n` +
          `• **Baseline Fill Rate:** ${sim.baselineFillRatePct}% (No inter-hub transfers)\n` +
          `• **Optimized Plan Fill Rate:** ${sim.planFillRatePct}% (+${sim.fillRateDeltaPct}% improvement)\n` +
          `• **Unmet Demand Reduction:** ${sim.unmetDemandReductionUnits.toLocaleString()} units\n` +
          `• **Unnecessary Stock Waste Mitigated:** ${sim.expiryRiskSavedUnits.toLocaleString()} units saved.`;
      } else {
        reply = `**FMCG Network Operational Status:**\n\n` +
          `Active Hub: **${activeOrg?.name}**\n` +
          `• Total Usable Stock: **${analysis.summary.totalUsableStock.toLocaleString()} units**\n` +
          `• Locations Facing Shortage Risk: **${analysis.summary.locationsWithShortage}**\n` +
          `• Feasible Stock Transfers Ready: **${analysis.summary.feasibleCount}** (Est Cost: $${analysis.summary.totalEstimatedCost.toLocaleString()})\n\n` +
          `You can approve transfers in the **Transfers** tab or upload updated CSV inventory files in **Data Studio**.`;
      }
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Server AI Error:', error);
    res.status(500).json({
      error: 'AI assistant currently processing',
      details: error?.message || 'Server error',
      reply: 'The FMCG planning copilot is currently evaluating live network heuristics. Please check your Risk Analysis and Transfer recommendations tabs.',
    });
  }
});

// ----------------- VITE & STATIC FILES ----------------- //
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Distribution Intelligence Engine running on http://0.0.0.0:${port}`);
  });
}

startServer();
