// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);
// Auth
export const auth = getAuth(app);

// Connect to local emulators
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);
