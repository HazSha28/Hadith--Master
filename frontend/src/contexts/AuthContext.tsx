import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { createUserData, updateLastLogin, UserData } from '../services/userService';

// Unified UserProfile type (merging UserProfile and UserData)
export interface UserProfile extends UserData {
  uid: string;
  email: string | null;
  fullName: string;
}

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, fullName: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth persistence
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error('Error setting auth persistence:', error);
      }
    };

    initializeAuth();
  }, []);

  // Fetch or create user profile
  const fetchProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      let snap = await getDoc(userRef);

      if (!snap.exists()) {
        // Create profile if it doesn't exist
        const newProfile: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          status: 'pending',
          role: 'user',
          preferences: { theme: 'light', notifications: true }
        };
        await setDoc(userRef, newProfile);
        snap = await getDoc(userRef);
      } else {
        // Update last login
        await updateLastLogin(firebaseUser.uid);
      }

      const data = snap.data() as UserData;
      setProfile({
        ...data,
        fullName: data.displayName || ''
      } as UserProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // Sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: fullName });

    // Initial profile creation is handled by the onAuthStateChanged listener -> fetchProfile
    // but we can also trigger it explicitly here if needed.
    return result;
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  const value = {
    currentUser,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
