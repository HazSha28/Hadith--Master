// Test script to verify user profile creation
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const testProfileCreation = async () => {
  try {
    console.log('Starting profile creation test...');
    
    // Create a test user
    const testEmail = 'testuser@example.com';
    const testPassword = 'test123456';
    const testFullName = 'Test User';
    
    console.log('Creating test user...');
    const result = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Firebase auth user created:', result.user.uid);
    
    // Update display name
    await updateProfile(result.user, { displayName: testFullName });
    console.log('Display name updated:', testFullName);
    
    // Create user profile in Firestore
    const userRef = doc(db, 'users', result.user.uid);
    const userData = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: testFullName,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      status: 'pending',
      role: 'user',
      preferences: {
        theme: 'light',
        notifications: true
      }
    };
    
    console.log('Creating user profile in Firestore...');
    await setDoc(userRef, userData);
    console.log('User profile created successfully');
    
    // Verify the profile was created
    console.log('Verifying profile creation...');
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      console.log('✅ Profile creation successful!');
      console.log('Profile data:', docSnap.data());
    } else {
      console.log('❌ Profile creation failed - document not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for manual testing
export { testProfileCreation };
