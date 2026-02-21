// Firebase Admin SDK for backend operations
// This file provides admin authentication for uploading hadiths data

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let serviceAccount;
let db;

try {
  // Try to load service account key
  const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  db = admin.firestore();
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.log('⚠️  Service account key not found, falling back to client SDK');
  console.log('   To use admin privileges, create a service account key:');
  console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Save as serviceAccountKey.json in the backend folder');
  
  // Fallback to client SDK (limited permissions)
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const firebaseConfig = {
      // Your Firebase config from frontend
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase Client SDK initialized (limited permissions)');
  } catch (fallbackError) {
    console.error('❌ Failed to initialize Firebase:', fallbackError);
    process.exit(1);
  }
}

export { db, admin };

// Admin authentication helper
export async function authenticateAsAdmin() {
  if (admin.apps.length > 0) {
    // Using Admin SDK - full permissions
    console.log('🔑 Using Admin SDK authentication');
    return { isAdmin: true, db };
  } else {
    // Using Client SDK - need to authenticate with admin account
    console.log('🔑 Please authenticate with admin account');
    console.log('   Run: node uploadCompleteHadiths.js login');
    return { isAdmin: false, db };
  }
}

// Batch operations helper
export async function batchWrite(collectionName, documents) {
  const batch = db.batch();
  const collectionRef = db.collection(collectionName);
  const results = [];
  
  // Process in batches of 500 (Firebase limit)
  for (let i = 0; i < documents.length; i += 500) {
    const batchDocs = documents.slice(i, i + 500);
    const currentBatch = db.batch();
    
    for (const doc of batchDocs) {
      const docRef = collectionRef.doc(); // Auto-generate ID
      currentBatch.set(docRef, doc);
      results.push(docRef.id);
    }
    
    try {
      await currentBatch.commit();
      console.log(`✅ Batch ${Math.floor(i/500) + 1}: ${batchDocs.length} documents uploaded`);
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i/500) + 1} failed:`, error);
      throw error;
    }
  }
  
  return results;
}

// Clear collection helper
export async function clearCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🗑️  Cleared collection: ${collectionName}`);
    return snapshot.size;
  } catch (error) {
    console.error(`❌ Failed to clear collection ${collectionName}:`, error);
    throw error;
  }
}

// Get collection statistics
export async function getCollectionStats(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return {
      count: snapshot.size,
      collection: collectionName
    };
  } catch (error) {
    console.error(`❌ Failed to get stats for ${collectionName}:`, error);
    return { count: 0, collection: collectionName };
  }
}

// Verify admin access
export async function verifyAdminAccess() {
  try {
    // Try to read a protected collection
    const testDoc = await db.collection('hadiths').limit(1).get();
    console.log('✅ Admin access verified');
    return true;
  } catch (error) {
    console.error('❌ Admin access denied:', error.message);
    return false;
  }
}
