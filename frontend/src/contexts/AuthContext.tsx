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
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
  const fetchProfile = async (firebaseUser: User, retryCount = 0) => {
    try {
      console.log(`Fetching profile for user ${firebaseUser.uid}, attempt ${retryCount + 1}`);
      const userRef = doc(db, 'users', firebaseUser.uid);
      let snap = await getDoc(userRef);

      if (!snap.exists()) {
        console.log('Profile does not exist, creating new profile...');
        // Create profile if it doesn't exist
        const newProfile: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          createdAt: serverTimestamp() as any,
          lastLoginAt: serverTimestamp() as any,
          status: 'pending',
          role: 'user',
          preferences: { theme: 'light', notifications: true }
        };
        
        await setDoc(userRef, newProfile);
        console.log('Profile created in Firestore');
        
        // Wait a moment for the document to be available
        await new Promise(resolve => setTimeout(resolve, 1000));
        snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          if (retryCount < 2) {
            console.log('Profile not found after creation, retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchProfile(firebaseUser, retryCount + 1);
          } else {
            throw new Error('Failed to create user profile after multiple attempts');
          }
        }
      } else {
        console.log('Profile exists, updating last login...');
        // Update last login
        await updateLastLogin(firebaseUser.uid);
      }

      const data = snap.data() as UserData;
      const userProfile: UserProfile = {
        ...data,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: data.displayName || ''
      };
      
      setProfile(userProfile);
      console.log('User profile loaded successfully:', firebaseUser.uid);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (retryCount < 2) {
        console.log('Retrying profile fetch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(firebaseUser, retryCount + 1);
      }
      // Don't set profile to null on error, keep existing state
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      if (user) {
        console.log('Fetching profile for user:', user.uid);
        await fetchProfile(user);
        console.log('Profile fetch completed for user:', user.uid);
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
    try {
      console.log('Starting signup process for:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth user created:', result.user.uid);
      
      await updateProfile(result.user, { displayName: fullName });
      console.log('Firebase auth profile updated with displayName:', fullName);
      
      // Profile creation is handled by the onAuthStateChanged listener -> fetchProfile
      // but we can also trigger it explicitly here if needed.
      return result;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
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
