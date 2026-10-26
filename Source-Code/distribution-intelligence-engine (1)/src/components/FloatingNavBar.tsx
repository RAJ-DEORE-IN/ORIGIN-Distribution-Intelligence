import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Database,
  Network,
  AlertTriangle,
  ArrowLeftRight,
  SlidersHorizontal,
  FileCheck,
  Settings,
  Sparkles,
} from 'lucide-react';

interface FloatingNavBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onToggleAi: () => void;
  isAiOpen: boolean;
  activeShortageCount?: number;
  feasibleRecCount?: number;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  currentTab,
  onTabChange,
  onToggleAi,
  isAiOpen,
  activeShortageCount = 0,
  feasibleRecCount = 0,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'datastudio', label: 'Data', icon: Database },
    { id: 'network', label: 'Network', icon: Network },
    {
      id: 'riskanalysis',
      label: 'Risk',
      icon: AlertTriangle,
      badge: activeShortageCount > 0 ? activeShortageCount : undefined,
    },
    // Center AI Copilot
    {
      id: 'recommendations',
      label: 'Transfers',
      icon: ArrowLeftRight,
      badge: feasibleRecCount > 0 ? feasibleRecCount : undefined,
    },
    { id: 'scenariolab', label: 'Scenario', icon: SlidersHorizontal },
    { id: 'evidence', label: 'Evidence', icon: FileCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="bottom-glass-nav overflow-x-auto no-scrollbar"
      aria-label="Liquid Glass Navigation"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Left 4 Tabs */}
      {tabs.slice(0, 4).map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item relative min-w-[58px] sm:min-w-[66px] ${isActive ? 'active' : ''}`}
            title={tab.label}
          >
            {/* Smooth Framer Motion Active Indicator (Physically anchored inside button - impossible to overshoot) */}
            {isActive && (
              <motion.div
                layoutId="bottomNavActivePill"
                className="nav-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              >
                <span className="active-dot" />
              </motion.div>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
              <div className="relative flex items-center justify-center">
                <Icon className="h-4 w-4" />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#e53935] px-1 text-[9px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </div>
          </button>
        );
      })}

      {/* CENTER LIQUID GLASS AI BUTTON WITH PULSE */}
      <button
        onClick={onToggleAi}
        className={`nav-item ai-button shrink-0 ${isAiOpen ? 'ring-2 ring-[#e53935]/40' : ''}`}
        title="Open Gemini Distribution AI Copilot"
      >
        <div className="ai-glow-icon">
          <Sparkles className="h-5 w-5 text-[#e53935]" />
        </div>
      </button>

      {/* Right 4 Tabs */}
      {tabs.slice(4).map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item relative min-w-[58px] sm:min-w-[66px] ${isActive ? 'active' : ''}`}
            title={tab.label}
          >
            {/* Smooth Framer Motion Active Indicator (Physically anchored inside button - impossible to overshoot) */}
            {isActive && (
              <motion.div
                layoutId="bottomNavActivePill"
                className="nav-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              >
                <span className="active-dot" />
              </motion.div>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
              <div className="relative flex items-center justify-center">
                <Icon className="h-4 w-4" />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
