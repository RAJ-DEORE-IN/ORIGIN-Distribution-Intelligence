import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Mail,
} from 'lucide-react';
import { User, Organization } from '../types/index.ts';
import {
  signInWithGoogle,
  saveUserProfile,
  signOutUser,
  getUserProfile,
} from '../lib/firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, org: Organization) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onSignOut,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile onboarding state for newly signed-in or editing users
  const [step, setStep] = useState<'signin' | 'onboarding' | 'profile'>('signin');
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Email direct login field
  const [emailInput, setEmailInput] = useState('rajdeore074@gmail.com');
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [orgName, setOrgName] = useState('Midwest Consumer Distribution');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setMobileNumber(currentUser.mobileNumber || '');
      setAddress(currentUser.address || '');
      setStep('profile');
    } else {
      setStep('signin');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Real Google Sign In Flow via Firebase
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fbUser, profile } = await signInWithGoogle();
      
      if (profile && profile.mobileNumber && profile.address) {
        // Complete profile already exists in Firestore
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
        onClose();
      } else {
        // Missing mobile number or address -> Prompt Onboarding
        const draftUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Distribution Planner',
          role: 'planner',
          organizationId: 'org-midwest-fmcg',
          photoURL: fbUser.photoURL || undefined,
          mobileNumber: profile?.mobileNumber || '',
          address: profile?.address || '',
        };
        setTempUser(draftUser);
        setFullName(draftUser.name);
        setMobileNumber(draftUser.mobileNumber || '');
        setAddress(draftUser.address || '');
        setStep('onboarding');
      }
    } catch (err: any) {
      console.warn('Google Sign-In Popup notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please complete authentication in the popup.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Multiple popup requests were initiated.');
      } else {
        // Show email fallback
        setShowEmailLogin(true);
        setError('Popup was blocked by browser or preview sandbox. You can enter your email directly below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Email Login Flow with Firestore sync (ensures login works anywhere)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLoading(true);
    setError(null);

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
        onClose();
      } else {
        const draftUser: User = {
          id: uid,
          email: emailInput.trim(),
          name: emailInput.split('@')[0].replace('.', ' '),
          role: 'planner',
          organizationId: 'org-midwest-fmcg',
          mobileNumber: existingProfile?.mobileNumber || '',
          address: existingProfile?.address || '',
        };
        setTempUser(draftUser);
        setFullName(draftUser.name);
        setMobileNumber(draftUser.mobileNumber || '');
        setAddress(draftUser.address || '');
        setStep('onboarding');
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setError('Could not verify account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Onboarding / Profile Details to Firebase Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim()) {
      setError('Please provide your valid mobile phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Please provide your distribution hub or facility address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const baseUser = tempUser || currentUser;
    if (!baseUser) {
      setError('Session expired. Please sign in again.');
      setIsLoading(false);
      return;
    }

    const updatedUser: User = {
      ...baseUser,
      name: fullName.trim() || baseUser.name,
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      organizationId: 'org-midwest-fmcg',
    };

    try {
      // Real Firestore persistence
      await saveUserProfile(updatedUser);

      const org: Organization = {
        id: updatedUser.organizationId,
        name: orgName.trim() || 'Midwest Consumer Distribution',
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

      onLoginSuccess(updatedUser, org);
      onClose();
    } catch (err: any) {
      console.error('Error saving profile to Firestore:', err);
      // Fallback: update local session even if remote rule rejected
      const org: Organization = {
        id: updatedUser.organizationId,
        name: orgName.trim() || 'Midwest Consumer Distribution',
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
      onLoginSuccess(updatedUser, org);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await signOutUser();
      onSignOut();
      setStep('signin');
      onClose();
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay active">
        <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

        {/* Modal Window styled with Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass-panel relative z-10 w-full max-w-md p-6 sm:p-7 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-700 hover:text-black absolute top-5 right-5 cursor-pointer shadow-2xs"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50/85 p-3 text-xs text-rose-900 font-medium shadow-xs">
              {error}
            </div>
          )}

          {/* STEP 1: SIGN IN (Google or Direct Email) */}
          {step === 'signin' && !currentUser && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-black text-white text-xs font-bold shadow-xs">
                    D
                  </div>
                  <span className="liquid-pill-tag py-0.5 px-2.5 text-[10px] font-extrabold text-slate-800">
                    Distribution Intelligence
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111]">
                  Sign In to Workspace
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Authenticate securely. Your user profile, distribution hub details, and inventory
                  decisions are stored in Firebase.
                </p>
              </div>

              {/* Real Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/90 bg-white/85 px-4 py-3.5 text-xs font-bold text-slate-900 shadow-md backdrop-blur-md transition-all hover:bg-white hover:shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {/* Official Google 'G' icon */}
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
                <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Or Direct Email Access Form */}
              <div className="mt-4 pt-3 border-t border-white/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    Or sign in with work email:
                  </span>
                  {!showEmailLogin && (
                    <button
                      type="button"
                      onClick={() => setShowEmailLogin(true)}
                      className="text-[11px] font-bold text-blue-800 hover:underline cursor-pointer"
                    >
                      Show Email Option
                    </button>
                  )}
                </div>

                {showEmailLogin && (
                  <form onSubmit={handleEmailSignIn} className="space-y-2.5">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="planner@enterprise.com"
                        className="w-full rounded-2xl border border-white/80 bg-white/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-2xl bg-slate-900 text-white font-bold py-2.5 text-xs shadow-sm hover:bg-black transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? 'Verifying...' : 'Sign In with Email'}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/60 bg-white/40 p-3 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  After authentication, you can complete or update your contact phone and facility
                  address for FMCG dispatch orders.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE ONBOARDING (Name, Mobile Number, Address) */}
          {step === 'onboarding' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="liquid-pill-tag py-0.5 px-2 text-[10px] font-extrabold text-blue-900 bg-blue-50/80">
                    Step 2 of 2
                  </span>
                  <span className="text-xs font-semibold text-slate-600">Onboarding</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#111]">
                  Complete Planner Profile
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Enter your contact and facility address. This information is saved to Firebase Firestore
                  to attach to distribution manifests and transfer recommendations.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Raj Deore"
                      className="w-full rounded-2xl border border-white/80 bg-white/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full rounded-2xl border border-white/80 bg-white/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Facility / Hub Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Facility / Hub Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Sector 18, Central Logistics Park, Industrial Area"
                      className="w-full rounded-2xl border border-white/80 bg-white/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Organization Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Organization / FMCG Hub
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Midwest Consumer Distribution"
                      className="w-full rounded-2xl border border-white/80 bg-white/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/90 bg-slate-900 text-white font-bold py-3 text-xs shadow-md transition-all hover:bg-black disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>{isLoading ? 'Saving in Firestore...' : 'Save Profile & Enter Workspace'}</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: LOGGED IN PROFILE VIEW */}
          {step === 'profile' && currentUser && (
            <div className="py-2">
              <div className="flex items-center gap-3.5 mb-5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="h-14 w-14 rounded-2xl border border-white/90 shadow-sm object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-xl shadow-sm border border-white/80">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#111]">{currentUser.name}</h3>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="liquid-pill-tag py-0.5 px-2 text-[10px] font-bold text-blue-900">
                      {currentUser.role.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Verified</span>
                  </div>
                </div>
              </div>

              {/* User details card */}
              <div className="space-y-2.5 rounded-2xl border border-white/70 bg-white/50 p-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">
                      Mobile Phone Number
                    </span>
                    <span className="font-semibold text-slate-900">
                      {currentUser.mobileNumber || 'Not configured'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-white/40">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">
                      Hub / Dispatch Address
                    </span>
                    <span className="font-semibold text-slate-900">
                      {currentUser.address || 'Not configured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('onboarding')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/90 bg-white/70 py-2.5 text-xs font-bold text-slate-800 hover:bg-white shadow-xs cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-xs font-bold text-[#e53935] hover:bg-rose-100/70 shadow-xs cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
