import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC53sa8nPeQA68X5FmgSTvLJmrc_AI_LSo",
  authDomain: "hadith-master-40045.firebaseapp.com",
  projectId: "hadith-master-40045",
  storageBucket: "hadith-master-40045.appspot.com",
  messagingSenderId: "956247344001",
  appId: "1:956247344001:web:3f877101e43196426e5e80",
  measurementId: "G-N10ZYSJ709"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);
