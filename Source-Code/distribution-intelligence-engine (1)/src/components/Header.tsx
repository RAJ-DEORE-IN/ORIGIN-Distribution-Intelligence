import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Sparkles,
  Building2,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  User as UserIcon,
  LogIn,
  Check,
} from 'lucide-react';
import { Organization, User } from '../types/index.ts';

interface HeaderProps {
  currentTab: string;
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  onSwitchOrg: (orgId: string) => void;
  onOpenHelp: () => void;
  onStartTour: () => void;
  onResetSample: () => void;
  onOpenAuth: () => void;
  onToggleAi: () => void;
  onOpenWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  user,
  organization,
  organizations,
  onSwitchOrg,
  onOpenHelp,
  onStartTour,
  onResetSample,
  onOpenAuth,
  onToggleAi,
  onOpenWelcome,
}) => {
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [showResetFeedback, setShowResetFeedback] = useState(false);

  const handleResetClick = () => {
    onResetSample();
    setShowResetFeedback(true);
    setTimeout(() => setShowResetFeedback(false), 2200);
  };

  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(1360px,94%)] pointer-events-none select-none">
      <div className="flex items-center justify-between gap-2.5">
        {/* TOP-LEFT FLOATING BAR: Sleek Animated Logo Mark Only (text removed as requested) */}
        <div className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenWelcome || onToggleAi}
            title="Origin Distribution Portal & Overview"
            className="liquid-glass-panel flex h-11 w-11 items-center justify-center p-0 shadow-lg cursor-pointer transition-all hover:bg-white/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white shadow-md">
              <div className="grid grid-cols-2 gap-0.5 p-1">
                <div className="h-1.5 w-1.5 rounded-xs bg-white" />
                <div className="h-1.5 w-1.5 rounded-xs bg-white/80" />
                <div className="h-1.5 w-1.5 rounded-xs bg-white/80" />
                <div className="h-1.5 w-1.5 rounded-xs bg-[#e53935]" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* TOP-RIGHT FLOATING BARS: Distinct Separate Floating Liquid Glass Islands */}
        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
          {/* FLOATING ISLAND 1: Organization Switcher Bar */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="liquid-glass-panel flex h-11 items-center gap-2 px-3 sm:px-3.5 shadow-lg transition-all hover:bg-white/70 cursor-pointer"
              title="Select Active FMCG Organization"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/5 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-slate-800" />
              </div>
              <span className="max-w-[100px] sm:max-w-[140px] truncate text-xs font-bold text-slate-900">
                {organization?.name || 'FMCG Hub'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {orgDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="liquid-glass-panel absolute right-0 mt-2 w-64 p-2 shadow-2xl z-50"
                >
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Switch FMCG Network Hub
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        onSwitchOrg(org.id);
                        setOrgDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                        org.id === organization?.id
                          ? 'bg-white/80 font-bold text-slate-900 shadow-2xs'
                          : 'text-slate-700 hover:bg-white/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-500">{org.industry}</div>
                      </div>
                      {org.id === organization?.id && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FLOATING ISLAND 2: Tools Bar (Reload Sample, Tour, Help Glossary) - No overlap, full visibility */}
          <div className="liquid-glass-panel relative flex h-11 items-center gap-1 px-2 shadow-lg">
            {/* Quick Sample Dataset Reset */}
            <button
              onClick={handleResetClick}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:text-black hover:bg-white/60 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Reload verified synthetic FMCG sample dataset"
            >
              {showResetFeedback ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Guided Tour Walkthrough (Always visible on all screens) */}
            <button
              onClick={onStartTour}
              className="flex h-8 w-8 items-center justify-center rounded-full text-amber-600 hover:text-amber-700 hover:bg-white/60 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Start Interactive Guided Tour"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>

            {/* Help & Formula Glossary (Always visible on all screens) */}
            <button
              onClick={onOpenHelp}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:text-black hover:bg-white/60 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Supply Chain Mathematical Formulas & Blueprint Glossary"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>

            {/* Reset confirmation badge */}
            <AnimatePresence>
              {showResetFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black text-white text-[10px] font-bold px-2.5 py-0.5 shadow-md pointer-events-none"
                >
                  Sample Dataset Reloaded ✓
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FLOATING ISLAND 3: Real Google Account User Profile Bar (Firebase tag removed as requested) */}
          <div className="pointer-events-auto">
            {user ? (
              <button
                onClick={onOpenAuth}
                className="liquid-glass-panel flex h-11 items-center gap-2 px-3 shadow-lg transition-all hover:bg-white/70 cursor-pointer"
                title={`Signed in as ${user.name} (${user.email})`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="h-7 w-7 rounded-full border border-white/90 shadow-2xs object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow-2xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Clean user name without any "Firebase" subtitle */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 max-w-[110px] truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-tight capitalize">
                    {user.role}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="liquid-glass-panel flex h-11 items-center gap-2 px-3.5 shadow-lg transition-all hover:bg-white/80 cursor-pointer text-xs font-bold text-slate-900"
                title="Sign in with Google Account"
              >
                <LogIn className="h-3.5 w-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
