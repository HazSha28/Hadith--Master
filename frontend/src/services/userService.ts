import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

export const createUserData = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userData: UserData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    };

    await setDoc(userRef, userData);
    console.log('User data created successfully:', user.uid);
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      console.log('No user data found for:', uid);
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: new Date()
    });
    console.log('Last login updated for:', uid);
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};
