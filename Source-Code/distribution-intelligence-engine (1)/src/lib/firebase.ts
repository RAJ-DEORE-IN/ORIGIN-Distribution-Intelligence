import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types/index.ts';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID if present in config
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Connectivity validation
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline: checking configuration');
    }
  }
}

testFirestoreConnection();

/**
 * Fetch or initialize real user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile from Firestore:', err);
    return null;
  }
}

/**
 * Save user profile (name, mobileNumber, address, role, org) to Firestore
 */
export async function saveUserProfile(user: User): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        ...user,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
    throw err;
  }
}

/**
 * Real Google Sign-in popup flow
 */
export async function signInWithGoogle(): Promise<{ fbUser: FirebaseUser; profile: User | null }> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const profile = await getUserProfile(fbUser.uid);
  return { fbUser, profile };
}

/**
 * Listen for Firebase auth state changes and fetch profile
 */
export function onAuthUserChanged(
  callback: (user: User | null, fbUser: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        callback(profile, fbUser);
      } else {
        // Needs onboarding
        callback(
          {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Authorized User',
            role: 'planner',
            organizationId: 'org-midwest-fmcg',
            photoURL: fbUser.photoURL || undefined,
          },
          fbUser
        );
      }
    } else {
      callback(null, null);
    }
  });
}

/**
 * Sign out flow
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

