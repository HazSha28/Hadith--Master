// Script to setup initial admin users
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - you need to add your config here
const firebaseConfig = {
  // Add your Firebase config from frontend/src/firebase.ts
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
const db = getFirestore(app);

// Initial admin users to add
const initialAdmins = [
  {
    uid: '9EQwVF9srSQkLd5LWsLmdaPQePd2',
    email: 'tohazsha@gmail.com',
    displayName: 'Admin User 1'
  },
  {
    uid: 'XncNQ5wOQ3VzkEoK0AYuO8j4ngG2',
    email: 'macsabs@gmail.com',
    displayName: 'Admin User 2'
  }
];

async function setupAdmins() {
  console.log('Setting up admin users...');
  console.log('⚠️  Note: Make sure you have Firebase config in this file');
  
  for (const admin of initialAdmins) {
    try {
      const adminRef = doc(db, 'admins', admin.uid);
      await setDoc(adminRef, {
        uid: admin.uid,
        email: admin.email,
        displayName: admin.displayName,
        role: 'admin',
        createdAt: serverTimestamp(),
        addedBy: 'system'
      });
      
      console.log(`✅ Added admin: ${admin.email}`);
    } catch (error) {
      console.error(`❌ Error adding admin ${admin.email}:`, error);
    }
  }
  
  console.log('Admin setup complete!');
  console.log('💡 Now you can add admins manually in Firebase Console:');
  console.log('   1. Go to Firestore Database');
  console.log('   2. Create collection "admins"');
  console.log('   3. Add documents with UID as document ID');
}

setupAdmins().catch(console.error);
