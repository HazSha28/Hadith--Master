// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC53sa8nPeQA68X5FmgSTvLJmrc_AI_LSo",
  authDomain: "hadith-master-40045.firebaseapp.com",
  projectId: "hadith-master-40045",
  storageBucket: "hadith-master-40045.firebasestorage.app",
  messagingSenderId: "956247344001",
  appId: "1:956247344001:web:3f877101e43196426e5e80",
  measurementId: "G-N10ZYSJ709"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// For development with emulators (uncomment when needed)
/*
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectFunctionsEmulator } from 'firebase/functions';

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
*/
