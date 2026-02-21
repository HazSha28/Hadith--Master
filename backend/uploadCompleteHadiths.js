import { db, authenticateAsAdmin, batchWrite, clearCollection, getCollectionStats, verifyAdminAccess } from "./firebaseAdmin.js";
import { completeHadithsData, booksMetadata, hadithCategories, difficultyLevels } from "./completeHadithsData.js";

// Upload complete hadiths data with batch processing for efficiency
async function uploadCompleteHadithData() {
  try {
    console.log("🚀 Starting complete hadith data upload...");
    
    // Verify admin access first
    const hasAccess = await verifyAdminAccess();
    if (!hasAccess) {
      console.error("❌ Admin access required. Please set up service account key.");
      return;
    }
    
    // Upload main hadith collection
    console.log("📚 Uploading hadiths collection...");
    const hadithResults = await batchWrite("hadiths", completeHadithsData);
    
    // Upload books metadata
    console.log("📖 Uploading books metadata...");
    const booksResults = await batchWrite("books", booksMetadata);
    
    // Upload categories
    console.log("🏷️  Uploading categories...");
    const categoriesResults = await batchWrite("categories", hadithCategories);
    
    // Upload difficulty levels
    console.log("📊 Uploading difficulty levels...");
    const difficultyResults = await batchWrite("difficultyLevels", difficultyLevels);
    
    console.log("🎉 Complete hadith data upload finished!");
    console.log(`📊 Summary:`);
    console.log(`   - Hadiths: ${hadithResults.length}`);
    console.log(`   - Books: ${booksResults.length}`);
    console.log(`   - Categories: ${categoriesResults.length}`);
    console.log(`   - Difficulty Levels: ${difficultyResults.length}`);
    
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

// Get hadiths by book
async function getHadithsByBook(bookName) {
  try {
    const snapshot = await db.collection("hadiths").where("reference.book", "==", bookName).get();
    const bookHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📚 Found ${bookHadiths.length} hadiths from ${bookName}`);
    return bookHadiths;
  } catch (error) {
    console.error("❌ Error fetching hadiths by book:", error);
    return [];
  }
}

// Get hadiths by category
async function getHadithsByCategory(category) {
  try {
    const snapshot = await db.collection("hadiths").where("category", "==", category).get();
    const categoryHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📚 Found ${categoryHadiths.length} hadiths in category: ${category}`);
    return categoryHadiths;
  } catch (error) {
    console.error("❌ Error fetching hadiths by category:", error);
    return [];
  }
}

// Get hadiths by difficulty
async function getHadithsByDifficulty(difficulty) {
  try {
    const snapshot = await db.collection("hadiths").where("difficulty", "==", difficulty).get();
    const difficultyHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📚 Found ${difficultyHadiths.length} hadiths with difficulty: ${difficulty}`);
    return difficultyHadiths;
  } catch (error) {
    console.error("❌ Error fetching hadiths by difficulty:", error);
    return [];
  }
}

// Search hadiths by text
async function searchHadiths(searchTerm) {
  try {
    const snapshot = await db.collection("hadiths").get();
    const allHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const searchResults = allHadiths.filter(hadith => {
      const searchLower = searchTerm.toLowerCase();
      return (
        hadith.arabic.includes(searchTerm) ||
        hadith.english.text.toLowerCase().includes(searchLower) ||
        hadith.english.narrator.toLowerCase().includes(searchLower) ||
        hadith.reference.book.toLowerCase().includes(searchLower) ||
        hadith.chapter.toLowerCase().includes(searchLower) ||
        hadith.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
    
    console.log(`🔍 Found ${searchResults.length} hadiths matching: "${searchTerm}"`);
    return searchResults;
  } catch (error) {
    console.error("❌ Error searching hadiths:", error);
    return [];
  }
}

// Get random hadith from specific book
async function getRandomHadithFromBook(bookName) {
  try {
    const bookHadiths = await getHadithsByBook(bookName);
    if (bookHadiths.length === 0) {
      console.log(`❌ No hadiths found for book: ${bookName}`);
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * bookHadiths.length);
    const randomHadith = bookHadiths[randomIndex];
    
    console.log(`🎲 Random hadith from ${bookName}:`);
    console.log(`   Arabic: ${randomHadith.arabic}`);
    console.log(`   English: ${randomHadith.english.text}`);
    console.log(`   Narrator: ${randomHadith.english.narrator}`);
    console.log(`   Reference: ${randomHadith.reference.book} ${randomHadith.reference.hadithNumber}`);
    
    return randomHadith;
  } catch (error) {
    console.error("❌ Error getting random hadith:", error);
    return null;
  }
}

// Get statistics about the hadith collection
async function getCollectionStats() {
  try {
    const collections = ["hadiths", "books", "categories", "difficultyLevels"];
    const stats = {};
    
    for (const collectionName of collections) {
      const stat = await getCollectionStats(collectionName);
      stats[collectionName] = stat.count;
    }
    
    // Get additional stats for hadiths
    const hadithsSnapshot = await db.collection("hadiths").get();
    const allHadiths = hadithsSnapshot.docs.map(doc => doc.data());
    
    // Stats by book
    const bookStats = {};
    allHadiths.forEach(hadith => {
      const book = hadith.reference.book;
      bookStats[book] = (bookStats[book] || 0) + 1;
    });
    
    // Stats by category
    const categoryStats = {};
    allHadiths.forEach(hadith => {
      const category = hadith.category;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // Stats by difficulty
    const difficultyStats = {};
    allHadiths.forEach(hadith => {
      const difficulty = hadith.difficulty;
      difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
    });
    
    console.log("📊 Hadith Collection Statistics:");
    console.log(`   Total Hadiths: ${allHadiths.length}`);
    console.log("\n   By Book:");
    Object.entries(bookStats).forEach(([book, count]) => {
      console.log(`     ${book}: ${count}`);
    });
    console.log("\n   By Category:");
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`     ${category}: ${count}`);
    });
    console.log("\n   By Difficulty:");
    Object.entries(difficultyStats).forEach(([difficulty, count]) => {
      console.log(`     ${difficulty}: ${count}`);
    });
    
    return {
      total: allHadiths.length,
      byBook: bookStats,
      byCategory: categoryStats,
      byDifficulty: difficultyStats,
      collections: stats
    };
  } catch (error) {
    console.error("❌ Error getting collection stats:", error);
    return null;
  }
}

// Clear all hadith data (use with caution!)
async function clearAllHadithData() {
  try {
    console.log("⚠️  WARNING: This will delete all hadith data!");
    console.log("⚠️  Type 'DELETE' to confirm...");
    
    // This would need interactive confirmation in a real app
    // For now, we'll just log the function exists
    console.log("❌ Clear function disabled for safety");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
  }
}

// Command line interface
const command = process.argv[2];
const param = process.argv[3];

switch (command) {
  case 'upload':
    uploadCompleteHadithData();
    break;
  case 'book':
    if (param) {
      getHadithsByBook(param);
    } else {
      console.log("Usage: node uploadCompleteHadiths.js book <book-name>");
    }
    break;
  case 'category':
    if (param) {
      getHadithsByCategory(param);
    } else {
      console.log("Usage: node uploadCompleteHadiths.js category <category-name>");
    }
    break;
  case 'difficulty':
    if (param) {
      getHadithsByDifficulty(param);
    } else {
      console.log("Usage: node uploadCompleteHadiths.js difficulty <beginner|intermediate|advanced>");
    }
    break;
  case 'search':
    if (param) {
      searchHadiths(param);
    } else {
      console.log("Usage: node uploadCompleteHadiths.js search <search-term>");
    }
    break;
  case 'random':
    if (param) {
      getRandomHadithFromBook(param);
    } else {
      console.log("Usage: node uploadCompleteHadiths.js random <book-name>");
    }
    break;
  case 'stats':
    getCollectionStats();
    break;
  case 'clear':
    clearAllHadithData();
    break;
  default:
    console.log("Available commands:");
    console.log("  upload                    - Upload complete hadith dataset");
    console.log("  book <book-name>          - Get hadiths by book");
    console.log("  category <category>       - Get hadiths by category");
    console.log("  difficulty <level>        - Get hadiths by difficulty");
    console.log("  search <term>             - Search hadiths");
    console.log("  random <book-name>        - Get random hadith from book");
    console.log("  stats                     - Get collection statistics");
    console.log("  clear                     - Clear all data (DANGEROUS)");
    console.log("\nBook names:");
    booksMetadata.forEach(book => {
      console.log(`  - ${book.name}`);
    });
    console.log("\nCategories:");
    hadithCategories.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });
    console.log("\nDifficulty levels:");
    difficultyLevels.forEach(diff => {
      console.log(`  - ${diff.level}`);
    });
    break;
}
