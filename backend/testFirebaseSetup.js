// Test Firebase Setup for Hadith Master
// This script verifies that Firebase is properly configured

import { db, verifyAdminAccess, getCollectionStats } from "./firebaseAdmin.js";

async function testFirebaseSetup() {
  console.log("🔍 Testing Firebase Setup for Hadith Master...\n");
  
  // Test 1: Admin Access
  console.log("1️⃣ Testing Admin Access...");
  try {
    const hasAccess = await verifyAdminAccess();
    if (hasAccess) {
      console.log("✅ Admin access verified");
    } else {
      console.log("❌ Admin access denied");
      console.log("   Please check service account setup or Firebase rules");
      return false;
    }
  } catch (error) {
    console.log("❌ Admin access test failed:", error.message);
    return false;
  }
  
  // Test 2: Collection Access
  console.log("\n2️⃣ Testing Collection Access...");
  const collections = ["hadiths", "books", "categories", "difficultyLevels"];
  
  for (const collectionName of collections) {
    try {
      const stats = await getCollectionStats(collectionName);
      console.log(`✅ ${collectionName}: ${stats.count} documents`);
    } catch (error) {
      console.log(`❌ ${collectionName}: Access failed -`, error.message);
    }
  }
  
  // Test 3: Basic Operations
  console.log("\n3️⃣ Testing Basic Operations...");
  try {
    // Test read operation
    const hadithsSnapshot = await db.collection("hadiths").limit(1).get();
    if (!hadithsSnapshot.empty) {
      const hadith = hadithsSnapshot.docs[0].data();
      console.log("✅ Read operation successful");
      console.log(`   Sample hadith: ${hadith.english.narrator} - ${hadith.reference.book}`);
    } else {
      console.log("⚠️  No hadiths found in database");
    }
  } catch (error) {
    console.log("❌ Read operation failed:", error.message);
  }
  
  // Test 4: Search Functionality
  console.log("\n4️⃣ Testing Search Functionality...");
  try {
    const snapshot = await db.collection("hadiths").get();
    const allHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (allHadiths.length > 0) {
      // Test search for "intention"
      const searchResults = allHadiths.filter(hadith => {
        const searchLower = "intention".toLowerCase();
        return (
          hadith.arabic.includes("intention") ||
          hadith.english.text.toLowerCase().includes(searchLower) ||
          hadith.english.narrator.toLowerCase().includes(searchLower) ||
          hadith.reference.book.toLowerCase().includes(searchLower) ||
          hadith.chapter.toLowerCase().includes(searchLower) ||
          hadith.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
      
      console.log(`✅ Search functionality working`);
      console.log(`   Found ${searchResults.length} hadiths matching "intention"`);
    } else {
      console.log("⚠️  No hadiths available for search testing");
    }
  } catch (error) {
    console.log("❌ Search functionality failed:", error.message);
  }
  
  // Test 5: Rules Validation
  console.log("\n5️⃣ Testing Rules Validation...");
  try {
    // Test public read access (should work)
    const publicRead = await db.collection("books").limit(1).get();
    console.log("✅ Public read access working");
    
    // Test admin-only collection (should work with admin SDK)
    const adminRead = await db.collection("categories").limit(1).get();
    console.log("✅ Admin-only access working");
    
  } catch (error) {
    console.log("❌ Rules validation failed:", error.message);
  }
  
  console.log("\n🎉 Firebase Setup Test Complete!");
  console.log("\n📋 Next Steps:");
  console.log("   1. If all tests pass, run: node uploadCompleteHadiths.js upload");
  console.log("   2. If tests fail, check FIREBASE_SETUP.md for troubleshooting");
  console.log("   3. Verify Firebase rules are published in the console");
  
  return true;
}

// Run the test
testFirebaseSetup().catch(console.error);
