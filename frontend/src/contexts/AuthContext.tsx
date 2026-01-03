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
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { createUserData, updateLastLogin } from '../services/userService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
      
      // Update last login time
      await updateLastLogin(result.user.uid);
      
      return result;
    } catch (error: any) {
      console.error('Sign in failed:', error.code, error.message);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up with:', email);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.uid);
      
      // Create user data in Firestore
      await createUserData(result.user);
      
      return result;
    } catch (error: any) {
      console.error('Sign up failed:', error.code, error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else {
        throw error;
      }
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    console.log('Attempting sign in with Google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign in with Google successful:', result.user.uid);
      
      // Check if user data exists, create if not
      try {
        await createUserData(result.user);
      } catch (error) {
        // User data might already exist, just update last login
        await updateLastLogin(result.user.uid);
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign in with Google failed:', error.code, error.message);
      throw error;
    }
  };

  // Sign out
  const signOut = () => {
    return firebaseSignOut(auth);
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
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