import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Package,
  Clock,
  Bot,
  LogIn,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  LogOut,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { User, Organization } from '../types/index.ts';
import {
  signInWithGoogle,
  getUserProfile,
  saveUserProfile,
  signOutUser,
} from '../lib/firebase.ts';

interface WelcomePortalProps {
  currentUser: User | null;
  onEnterWorkspace: () => void;
  onLoginSuccess: (user: User, org: Organization) => void;
  onSignOut: () => void;
}

const FLOWING_STATEMENTS = [
  'Eliminating regional FMCG stockouts using 7-day demand moving averages',
  'Automating inter-warehouse transfers with vehicle capacity & pack-size rounding',
  'Protecting shelf life and reducing waste with First-Expired-First-Out (FEFO) triage',
  'Grounded with Google Gemini AI for instant natural-language supply chain intelligence',
];

export const WelcomePortal: React.FC<WelcomePortalProps> = ({
  currentUser,
  onEnterWorkspace,
  onLoginSuccess,
  onSignOut,
}) => {
  const [statementIndex, setStatementIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email login state
  const [emailInput, setEmailInput] = useState('rajdeore074@gmail.com');
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Onboarding state if user signs in without mobile/address
  const [onboardingUser, setOnboardingUser] = useState<User | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');

  // Auto-cycle the flowing statements
  useEffect(() => {
    const interval = setInterval(() => {
      setStatementIndex((prev) => (prev + 1) % FLOWING_STATEMENTS.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { fbUser, profile } = await signInWithGoogle();
      if (profile && profile.mobileNumber && profile.address) {
        const org: Organization = {
          id: profile.organizationId || 'org-midwest-fmcg',
          name: 'Midwest Consumer Distribution',
          industry: 'FMCG & Perishables',
          planningDefaults: {
            safetyStockDays: 4,
            protectedReservePercent: 0.15,
            planningHorizonDays: 7,
            costWeight: 0.5,
            urgencyWeight: 0.5,
            packSizeEnforced: true,
            defaultPackSize: 10,
          },
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(profile, org);
        onEnterWorkspace();
      } else {
        setOnboardingUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Distribution Planner',
          role: 'planner',
          organizationId: 'org-midwest-fmcg',
          photoURL: fbUser.photoURL || undefined,
          mobileNumber: profile?.mobileNumber || '',
          address: profile?.address || '',
        });
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setShowEmailInput(true);
        setAuthError('Popup blocked by browser sandbox. Enter your email below to continue.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Email Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLoading(true);
    setAuthError(null);
    try {
      const uid = `usr-${emailInput.trim().replace(/[^a-zA-Z0-9]/g, '_')}`;
      const existingProfile = await getUserProfile(uid);

      if (existingProfile && existingProfile.mobileNumber && existingProfile.address) {
        const org: Organization = {
          id: existingProfile.organizationId || 'org-midwest-fmcg',
          name: 'Midwest Consumer Distribution',
          industry: 'FMCG & Perishables',
          planningDefaults: {
            safetyStockDays: 4,
            protectedReservePercent: 0.15,
            planningHorizonDays: 7,
            costWeight: 0.5,
            urgencyWeight: 0.5,
            packSizeEnforced: true,
            defaultPackSize: 10,
          },
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(existingProfile, org);
        onEnterWorkspace();
      } else {
        setOnboardingUser({
          id: uid,
          email: emailInput.trim(),
          name: emailInput.split('@')[0].replace('.', ' '),
          role: 'planner',
          organizationId: 'org-midwest-fmcg',
          mobileNumber: existingProfile?.mobileNumber || '',
          address: existingProfile?.address || '',
        });
      }
    } catch (err: any) {
      setAuthError('Error authenticating with email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete profile onboarding
  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingUser) return;

    setIsLoading(true);
    try {
      const finalUser: User = {
        ...onboardingUser,
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
      };
      await saveUserProfile(finalUser);

      const org: Organization = {
        id: 'org-midwest-fmcg',
        name: 'Midwest Consumer Distribution',
        industry: 'FMCG & Perishables',
        planningDefaults: {
          safetyStockDays: 4,
          protectedReservePercent: 0.15,
          planningHorizonDays: 7,
          costWeight: 0.5,
          urgencyWeight: 0.5,
          packSizeEnforced: true,
          defaultPackSize: 10,
        },
        createdAt: new Date().toISOString(),
      };

      onLoginSuccess(finalUser, org);
      setOnboardingUser(null);
      onEnterWorkspace();
    } catch (err) {
      setAuthError('Could not save profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between px-4 py-8 sm:py-12 z-20">
      {/* Top Bar Branding */}
      <div className="mx-auto w-[min(1240px,100%)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-xl shadow-black/10">
            <div className="grid grid-cols-2 gap-1 p-1">
              <div className="h-1.5 w-1.5 rounded-xs bg-white" />
              <div className="h-1.5 w-1.5 rounded-xs bg-white/80" />
              <div className="h-1.5 w-1.5 rounded-xs bg-white/80" />
              <div className="h-1.5 w-1.5 rounded-xs bg-[#e53935]" />
            </div>
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-slate-900 leading-tight">
              ORIGIN ENGINE
            </div>
            <div className="text-[11px] font-semibold text-slate-500 leading-tight">
              Distribution Intelligence & Inventory Optimization
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="liquid-glass-panel px-3.5 py-1.5 flex items-center gap-2 shadow-sm text-xs font-semibold text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>Optimization Engine Online</span>
        </div>
      </div>

      {/* Main Hero & Content Flow Section */}
      <div className="mx-auto w-[min(1240px,100%)] my-auto py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Vision & Dynamic Flowing Animation */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Top Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-3.5 py-1.5 border border-white/80 shadow-xs mb-5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-extrabold tracking-wide uppercase text-slate-800">
                FMCG Supply Chain Intelligence
              </span>
            </motion.div>

            {/* Core Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]"
            >
              Stop stockouts. <br />
              Eliminate spoilage. <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 bg-clip-text text-transparent">
                Optimized in real time.
              </span>
            </motion.h1>

            {/* Dynamic Animated Flowing Statement */}
            <div className="h-16 sm:h-14 mt-5 flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={statementIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-700"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                  <span>{FLOWING_STATEMENTS[statementIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Feature Highlights Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 w-full"
            >
              <div className="liquid-slide p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">7-Day Demand Velocity</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Moving average forecasts identifying shortages before shelves run empty.
                  </p>
                </div>
              </div>

              <div className="liquid-slide p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Constrained Rebalancing</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Auto-recommends inter-hub transfers with vehicle payload and carton rounding.
                  </p>
                </div>
              </div>

              <div className="liquid-slide p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">FEFO Expiry Defense</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    First-Expired-First-Out sorting prevents perishable write-offs across hubs.
                  </p>
                </div>
              </div>

              <div className="liquid-slide p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-700 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Gemini AI Copilot</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Ask natural questions grounded directly in live inventory and route data.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Center-Stage Liquid Glass Login & Entry Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="liquid-glass-panel p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Soft decorative glow behind the card */}
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-rose-400/20 blur-2xl pointer-events-none" />

              {/* State 1: Active Logged In User */}
              {currentUser && !onboardingUser && (
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.name}
                        className="h-16 w-16 rounded-full border-2 border-white shadow-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-bold text-white shadow-md">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full mb-1">
                    Authenticated Session
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Welcome back, {currentUser.name}!
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">{currentUser.email}</p>

                  <div className="w-full space-y-2.5">
                    <button
                      onClick={onEnterWorkspace}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 px-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <span>Enter Workspace Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={onSignOut}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/50 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Switch Account / Sign Out</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State 2: Profile Onboarding (Name, Mobile, Address) */}
              {onboardingUser && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Complete Profile</h3>
                      <p className="text-[11px] text-slate-500">Provide distribution contact details</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveOnboarding} className="space-y-3 mt-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={onboardingUser.name}
                        onChange={(e) =>
                          setOnboardingUser({ ...onboardingUser, name: e.target.value })
                        }
                        required
                        className="w-full rounded-xl bg-white/70 border border-white/80 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>Mobile Number</span>
                      </label>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full rounded-xl bg-white/70 border border-white/80 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>Hub Office Address</span>
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Warehouse 4B, Sector 18 Logistics Hub..."
                        rows={2}
                        required
                        className="w-full rounded-xl bg-white/70 border border-white/80 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Saving Profile...</span>
                      ) : (
                        <>
                          <span>Save & Launch Workspace</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* State 3: Not Logged In - Hero Authentication Gateway */}
              {!currentUser && !onboardingUser && (
                <div>
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      Sign In to Origin
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      Distribution Portal
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Access verified FMCG inventory, transfer routes, and Gemini copilot.
                    </p>
                  </div>

                  {authError && (
                    <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      {authError}
                    </div>
                  )}

                  {/* Primary Google Sign-In Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-800 shadow-md border border-white/90 hover:bg-slate-50 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                  </button>

                  {/* Or divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300/60" />
                    </div>
                    <span className="relative bg-white/70 backdrop-blur-sm px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded-md">
                      Or
                    </span>
                  </div>

                  {/* Email Login Section */}
                  {showEmailInput ? (
                    <form onSubmit={handleEmailSignIn} className="space-y-2.5">
                      <div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Enter work email..."
                            required
                            className="w-full rounded-xl bg-white/80 border border-white/90 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-bold text-white hover:bg-black transition-all cursor-pointer"
                      >
                        <span>Continue with Email</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/50 border border-white/60 py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-white/80 transition-all cursor-pointer"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span>Sign in with Email ID</span>
                    </button>
                  )}

                  {/* Instant Demo Access Button */}
                  <div className="mt-5 pt-4 border-t border-slate-200/60 text-center">
                    <button
                      onClick={onEnterWorkspace}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer group"
                    >
                      <span>Explore Workspace (Demo Mode)</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Instant preview with simulated FMCG distribution network
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mx-auto w-[min(1240px,100%)] flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-white/40 text-[11px] font-medium text-slate-500">
        <div>
          Origin Distribution Intelligence &copy; 2026 &bull; FMCG Inventory Allocation Engine
        </div>
        <div className="flex items-center gap-4">
          <span>Problem Statement 2: FMCG Supply Chain</span>
          <span>&bull;</span>
          <span>Multi-Echelon Optimization</span>
        </div>
      </div>
    </div>
  );
};
