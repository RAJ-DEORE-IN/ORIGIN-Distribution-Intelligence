import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header.tsx';
import { FloatingNavBar } from './components/FloatingNavBar.tsx';
import { GeminiAssistantDrawer } from './components/GeminiAssistantDrawer.tsx';
import { GuidedTour } from './components/GuidedTour.tsx';
import { HelpModal } from './components/HelpModal.tsx';
import { AuthModal } from './views/AuthModal.tsx';
import { WelcomePortal } from './views/WelcomePortal.tsx';

import { OverviewView } from './views/OverviewView.tsx';
import { DataStudioView } from './views/DataStudioView.tsx';
import { NetworkView } from './views/NetworkView.tsx';
import { RiskAnalysisView } from './views/RiskAnalysisView.tsx';
import { RecommendationsView } from './views/RecommendationsView.tsx';
import { ScenarioLabView } from './views/ScenarioLabView.tsx';
import { EvidenceAuditView } from './views/EvidenceAuditView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

import {
  User,
  Organization,
  PlanningDefaults,
  SkuLocationMetrics,
  TransferRecommendation,
  SimulationOutcome,
  LocationInfo,
  AuditLogEntry,
  InventoryRecord,
  SalesRecord,
  RouteRecord,
  ExpiryRecord,
} from './types/index.ts';

import {
  SAMPLE_INVENTORY,
  SAMPLE_SALES,
  SAMPLE_ROUTES,
  SAMPLE_EXPIRY,
  SAMPLE_LOCATIONS,
  DEFAULT_PLANNING_DEFAULTS,
} from './lib/sampleData.ts';
import {
  runOptimizationAnalysis,
  simulateBaselineVsPlan,
} from './lib/calculator.ts';
import { onAuthUserChanged } from './lib/firebase.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // App State - Authenticated user from Firebase (default null until checked)
  const [user, setUser] = useState<User | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([
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
  ]);

  const [activeOrgId, setActiveOrgId] = useState<string>('org-midwest-fmcg');
  const [planningDefaults, setPlanningDefaults] = useState<PlanningDefaults>({
    ...DEFAULT_PLANNING_DEFAULTS,
  });

  const [inventory, setInventory] = useState<InventoryRecord[]>([...SAMPLE_INVENTORY]);
  const [sales, setSales] = useState<SalesRecord[]>([...SAMPLE_SALES]);
  const [routes, setRoutes] = useState<RouteRecord[]>([...SAMPLE_ROUTES]);
  const [expiry, setExpiry] = useState<ExpiryRecord[]>([...SAMPLE_EXPIRY]);
  const [locations, setLocations] = useState<LocationInfo[]>([...SAMPLE_LOCATIONS]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-init-1',
      timestamp: new Date().toISOString(),
      userId: 'usr-1',
      userName: 'Raj Deore',
      action: 'Workspace Initialized',
      details: 'Loaded verified FMCG synthetic distribution network.',
      category: 'data',
    },
  ]);

  // Derived Optimization Analysis
  const locMap = new Map(locations.map((l) => [l.id, { name: l.name, region: l.region }]));
  const analysis = runOptimizationAnalysis(
    inventory,
    sales,
    routes,
    expiry,
    locMap,
    planningDefaults
  );

  const simulation: SimulationOutcome = simulateBaselineVsPlan(
    analysis.metrics,
    analysis.recommendations,
    planningDefaults.planningHorizonDays
  );

  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];
  const activeShortages = analysis.metrics.filter((m) => m.isShortageRisk).length;
  const feasibleRecs = analysis.recommendations.filter((r) => r.isFeasible).length;

  const handleSwitchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setPlanningDefaults({ ...org.planningDefaults });
    }
  };

  const handleUpdateDefaults = (newDefaults: PlanningDefaults) => {
    setPlanningDefaults(newDefaults);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'usr-1',
        userName: user?.name || 'Planner',
        action: 'Updated Planning Parameters',
        details: `Safety stock: ${newDefaults.safetyStockDays}d, Reserve: ${Math.round(newDefaults.protectedReservePercent * 100)}%`,
        category: 'planning',
      },
      ...prev,
    ]);
  };

  const handleUpdateRecStatus = (
    id: string,
    status: 'recommended' | 'approved' | 'rejected' | 'in_transit'
  ) => {
    const targetRec = analysis.recommendations.find((r) => r.id === id);
    if (targetRec) {
      targetRec.status = status;
    }
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'usr-1',
        userName: user?.name || 'Planner',
        action: 'Transfer Status Change',
        details: `Recommendation ${id} marked as "${status}".`,
        category: 'analysis',
      },
      ...prev,
    ]);
  };

  const handleResetSample = async () => {
    setInventory([...SAMPLE_INVENTORY]);
    setSales([...SAMPLE_SALES]);
    setRoutes([...SAMPLE_ROUTES]);
    setExpiry([...SAMPLE_EXPIRY]);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'usr-1',
        userName: user?.name || 'Planner',
        action: 'Loaded Sample Dataset',
        details: 'Restored verified synthetic FMCG distribution dataset.',
        category: 'data',
      },
      ...prev,
    ]);
  };

  const handleUploadInventory = (newRecords: InventoryRecord[]) => {
    setInventory(newRecords);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'usr-1',
        userName: user?.name || 'Planner',
        action: 'CSV Inventory Upload',
        details: `Ingested ${newRecords.length} validated inventory records.`,
        category: 'data',
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    const tourShown = localStorage.getItem('dist_tour_seen');
    if (!tourShown) {
      setIsTourOpen(true);
      localStorage.setItem('dist_tour_seen', 'true');
    }

    // Subscribe to real Firebase Google Authentication and Firestore profile updates
    const unsubscribe = onAuthUserChanged((firebaseProfile) => {
      if (firebaseProfile) {
        setUser(firebaseProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen text-[#1c1c1e] antialiased">
      {/* 3 FIXED LIQUID BACKGROUND BLUR GLOBES */}
      <div className="background-blur blur-one" />
      <div className="background-blur blur-two" />
      <div className="background-blur blur-three" />

      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome-portal"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <WelcomePortal
              currentUser={user}
              onEnterWorkspace={() => setShowWelcome(false)}
              onLoginSuccess={(u, org) => {
                setUser(u);
                if (org) handleSwitchOrg(org.id);
                setShowWelcome(false);
              }}
              onSignOut={() => setUser(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace-dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Liquid Glass Header Bar */}
            <Header
              currentTab={currentTab}
              user={user}
              organization={activeOrg}
              organizations={organizations}
              onSwitchOrg={handleSwitchOrg}
              onOpenHelp={() => setIsHelpOpen(true)}
              onStartTour={() => setIsTourOpen(true)}
              onResetSample={handleResetSample}
              onOpenAuth={() => setIsAuthOpen(true)}
              onToggleAi={() => setIsAiOpen(!isAiOpen)}
              onOpenWelcome={() => setShowWelcome(true)}
            />

            {/* Main Viewport Container with Smooth Page Slide Animations */}
            <main className="mx-auto w-[min(1360px,94%)] pt-20 sm:pt-24 pb-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 18, scale: 0.988 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.988 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentTab === 'overview' && (
                    <OverviewView
                      metrics={analysis.metrics}
                      recommendations={analysis.recommendations}
                      simulation={simulation}
                      organization={activeOrg}
                      onNavigateTab={setCurrentTab}
                      onOpenAi={() => setIsAiOpen(true)}
                    />
                  )}

                  {currentTab === 'datastudio' && (
                    <DataStudioView
                      inventoryCount={inventory.length}
                      salesCount={sales.length}
                      routesCount={routes.length}
                      expiryCount={expiry.length}
                      onResetSample={handleResetSample}
                      onUploadInventory={handleUploadInventory}
                    />
                  )}

                  {currentTab === 'network' && (
                    <NetworkView
                      locations={locations}
                      routes={routes}
                      metrics={analysis.metrics}
                    />
                  )}

                  {currentTab === 'riskanalysis' && (
                    <RiskAnalysisView metrics={analysis.metrics} />
                  )}

                  {currentTab === 'recommendations' && (
                    <RecommendationsView
                      recommendations={analysis.recommendations}
                      onUpdateStatus={handleUpdateRecStatus}
                    />
                  )}

                  {currentTab === 'scenariolab' && (
                    <ScenarioLabView
                      currentDefaults={planningDefaults}
                      locations={locations}
                      inventory={inventory}
                      sales={sales}
                      routes={routes}
                      expiry={expiry}
                      onApplyDefaults={handleUpdateDefaults}
                    />
                  )}

                  {currentTab === 'evidence' && (
                    <EvidenceAuditView auditLogs={auditLogs} />
                  )}

                  {currentTab === 'settings' && (
                    <SettingsView
                      organization={activeOrg}
                      planningDefaults={planningDefaults}
                      currentUser={user}
                      onUpdateDefaults={handleUpdateDefaults}
                      onStartTour={() => setIsTourOpen(true)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Realistic Hyper Liquid Glass Bottom Navigation */}
            <FloatingNavBar
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              onToggleAi={() => setIsAiOpen(!isAiOpen)}
              isAiOpen={isAiOpen}
              activeShortageCount={activeShortages}
              feasibleRecCount={feasibleRecs}
            />

            {/* Gemini AI Distribution Copilot Liquid Glass Drawer */}
            <GeminiAssistantDrawer
              isOpen={isAiOpen}
              onClose={() => setIsAiOpen(false)}
              recommendations={analysis.recommendations}
              metrics={analysis.metrics}
              onApproveTransfer={(id) => handleUpdateRecStatus(id, 'approved')}
              user={user}
              organization={activeOrg}
            />

            {/* Guided Tour Modal */}
            <GuidedTour
              isOpen={isTourOpen}
              onClose={() => setIsTourOpen(false)}
              onNavigateTab={setCurrentTab}
            />

            {/* Metric Glossary & Math Modal */}
            <HelpModal
              isOpen={isHelpOpen}
              onClose={() => setIsHelpOpen(false)}
            />

            {/* Auth & Account Liquid Modal */}
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setIsAuthOpen(false)}
              currentUser={user}
              onLoginSuccess={(u, org) => {
                setUser(u);
                if (org) handleSwitchOrg(org.id);
              }}
              onSignOut={() => setUser(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
