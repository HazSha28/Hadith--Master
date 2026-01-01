import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('Testing Firebase connection...');
  
  try {
    // Test 1: Check if auth is initialized
    console.log('Auth initialized:', !!auth);
    console.log('Auth config:', auth.config);
    
    // Test 2: Check if db is initialized
    console.log('Firestore initialized:', !!db);
    
    // Test 3: Try to create a test user
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('Test user created:', userCredential.user.uid);
      
      // Test 4: Try to write to Firestore
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, {
        email: testEmail,
        createdAt: new Date(),
        test: true
      });
      console.log('Test document written to Firestore');
      
      // Test 5: Try to read from Firestore
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        console.log('Test document read successfully:', docSnap.data());
      } else {
        console.log('Test document not found');
      }
      
      // Clean up
      await userCredential.user.delete();
      console.log('Test user deleted');
      
    } catch (error: any) {
      console.error('Test user creation failed:', error.code, error.message);
      
      // If user already exists, try to sign in
      if (error.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log('Test user signed in:', userCredential.user.uid);
          
          // Test reading existing document
          const userDoc = doc(db, 'users', userCredential.user.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            console.log('Existing document read:', docSnap.data());
          }
        } catch (signInError: any) {
          console.error('Test sign in failed:', signInError.code, signInError.message);
        }
      }
    }
    
    console.log('Firebase test completed');
    
  } catch (error) {
    console.error('Firebase connection test failed:', error);
  }
};

// Run this test in browser console
export const runTest = () => {
  testFirebaseConnection();
};
