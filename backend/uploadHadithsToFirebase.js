#!/usr/bin/env node

/**
 * Firebase Upload Service for Hadith Data
 * Uploads validated hadith data to Firebase Firestore
 */

import { initializeApp, cert } from 'firebase/app';
import { getFirestore, collection, doc, setTimestamp, writeBatch } from 'firebase/firestore';
import fs from 'fs/promises';
import path from 'path';
import { BookCollections } from './hadithDataStructure.js';

class FirebaseUploadService {
  constructor() {
    this.firebaseConfig = {
      // These should be loaded from environment variables or config file
      projectId: process.env.FIREBASE_PROJECT_ID || 'hadith-master',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    };
    
    this.uploadStats = {
      totalFiles: 0,
      totalHadiths: 0,
      uploadedHadiths: 0,
      failedHadiths: 0,
      startTime: null,
      endTime: null,
      errors: []
    };
    
    this.batchSize = 500; // Firestore batch limit is 500
    this.app = null;
    this.db = null;
  }

  /**
   * Initialize Firebase connection
   */
  async initializeFirebase() {
    try {
      if (!this.firebaseConfig.privateKey) {
        throw new Error('Firebase private key not found. Set FIREBASE_PRIVATE_KEY environment variable.');
      }
      
      this.app = initializeApp({
        credential: cert(this.firebaseConfig),
        databaseURL: this.firebaseConfig.databaseURL
      });
      
      this.db = getFirestore(this.app);
      console.log('✅ Firebase connection established');
      
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      throw error;
    }
  }

  /**
   * Load hadith data from file
   */
  async loadHadithData(filename) {
    const filePath = path.join(process.cwd(), 'processed_hadiths', filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('File must contain an array of hadiths');
      }
      
      console.log(`📁 Loaded ${data.length} hadiths from ${filename}`);
      return data;
      
    } catch (error) {
      throw new Error(`Failed to load ${filename}: ${error.message}`);
    }
  }

  /**
   * Create collection name for a book
   */
  getCollectionName(bookId) {
    return `hadiths_${bookId}`;
  }

  /**
   * Prepare hadith document for Firestore
   */
  prepareHadithDocument(hadith) {
    const doc = { ...hadith };
    
    // Convert arrays to Firestore-compatible format
    doc.themes = hadith.themes || [];
    doc.keywords = hadith.keywords || [];
    doc.cross_references = hadith.cross_references || [];
    
    // Add timestamps
    doc.createdAt = new Date();
    doc.updatedAt = new Date();
    
    // Remove any undefined values
    Object.keys(doc).forEach(key => {
      if (doc[key] === undefined) {
        delete doc[key];
      }
    });
    
    return doc;
  }

  /**
   * Upload hadiths in batches
   */
  async uploadHadithsBatch(hadiths, collectionName) {
    let uploadedCount = 0;
    let failedCount = 0;
    
    console.log(`📤 Uploading ${hadiths.length} hadiths to ${collectionName}...`);
    
    // Process in batches
    for (let i = 0; i < hadiths.length; i += this.batchSize) {
      const batch = writeBatch(this.db);
      const batchHadiths = hadiths.slice(i, i + this.batchSize);
      
      console.log(`   Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(hadiths.length / this.batchSize)} (${batchHadiths.length} hadiths)`);
      
      for (const hadith of batchHadiths) {
        try {
          const docData = this.prepareHadithDocument(hadith);
          const docRef = doc(this.db, collectionName, hadith.hadith_number);
          
          batch.set(docRef, docData);
          uploadedCount++;
          
        } catch (error) {
          console.error(`   ❌ Failed to prepare hadith ${hadith.hadith_number}:`, error.message);
          this.uploadStats.errors.push({
            hadithNumber: hadith.hadith_number,
            error: error.message,
            book: hadith.book_id
          });
          failedCount++;
        }
      }
      
      try {
        await batch.commit();
        console.log(`   ✅ Batch committed successfully`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Failed to commit batch:`, error.message);
        failedCount += batchHadiths.length;
        this.uploadStats.errors.push({
          error: error.message,
          batch: Math.floor(i / this.batchSize) + 1,
          collection: collectionName
        });
      }
    }
    
    return { uploadedCount, failedCount };
  }

  /**
   * Upload a single file
   */
  async uploadFile(filename) {
    try {
      const hadiths = await this.loadHadithData(filename);
      
      if (hadiths.length === 0) {
        console.log(`⚠️  No hadiths to upload in ${filename}`);
        return { uploadedCount: 0, failedCount: 0 };
      }
      
      // Get book ID from first hadith
      const bookId = hadiths[0].book_id;
      if (!bookId || !BookCollections[bookId]) {
        throw new Error(`Invalid book_id in ${filename}: ${bookId}`);
      }
      
      const collectionName = this.getCollectionName(bookId);
      
      // Upload hadiths
      const result = await this.uploadHadithsBatch(hadiths, collectionName);
      
      // Create book metadata document
      await this.createBookMetadata(bookId, hadiths.length);
      
      console.log(`✅ Completed ${filename}: ${result.uploadedCount} uploaded, ${result.failedCount} failed`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      this.uploadStats.errors.push({
        filename,
        error: error.message
      });
      
      return { uploadedCount: 0, failedCount: 0 };
    }
  }

  /**
   * Create book metadata document
   */
  async createBookMetadata(bookId, hadithCount) {
    try {
      const book = BookCollections[bookId];
      const collectionName = 'books_metadata';
      
      const metadata = {
        bookId,
        name: book.name,
        totalHadiths: hadithCount,
        expectedTotal: book.total_hadiths,
        authenticity: book.authenticity,
        themes: book.themes,
        lastUpdated: new Date(),
        uploadBatchId: this.uploadStats.startTime?.toISOString(),
        collectionName: this.getCollectionName(bookId)
      };
      
      const docRef = doc(this.db, collectionName, bookId);
      await setDoc(docRef, metadata);
      
      console.log(`📋 Created metadata for ${book.name}`);
      
    } catch (error) {
      console.warn(`⚠️  Failed to create metadata for ${bookId}:`, error.message);
    }
  }

  /**
   * Upload all processed files
   */
  async uploadAllFiles() {
    console.log('🚀 Starting Firebase upload for hadith data...\n');
    
    try {
      await this.initializeFirebase();
      
      const processedDir = path.join(process.cwd(), 'processed_hadiths');
      const files = await fs.readdir(processedDir);
      const jsonFiles = files.filter(file => 
        file.endsWith('.json') && 
        !file.includes('report') && 
        !file.includes('validation')
      );
      
      if (jsonFiles.length === 0) {
        console.log('📁 No hadith data files found in processed_hadiths/ directory');
        console.log('💡 Run "npm run ingest-hadiths" first to generate data files');
        return;
      }
      
      this.uploadStats.totalFiles = jsonFiles.length;
      this.uploadStats.startTime = new Date();
      
      console.log(`📁 Found ${jsonFiles.length} data files to upload\n`);
      
      for (const filename of jsonFiles) {
        console.log(`\n📤 Processing ${filename}...`);
        
        const result = await this.uploadFile(filename);
        this.uploadStats.uploadedHadiths += result.uploadedCount;
        this.uploadStats.failedHadiths += result.failedCount;
        this.uploadStats.totalHadiths += result.uploadedCount + result.failedCount;
      }
      
      this.uploadStats.endTime = new Date();
      this.generateUploadReport();
      
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate upload report
   */
  generateUploadReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 FIREBASE UPLOAD REPORT');
    console.log('='.repeat(70));
    
    const duration = this.uploadStats.endTime - this.uploadStats.startTime;
    
    console.log(`📁 Files processed: ${this.uploadStats.totalFiles}`);
    console.log(`📚 Total hadiths: ${this.uploadStats.totalHadiths.toLocaleString()}`);
    console.log(`✅ Successfully uploaded: ${this.uploadStats.uploadedHadiths.toLocaleString()}`);
    console.log(`❌ Failed uploads: ${this.uploadStats.failedHadiths.toLocaleString()}`);
    console.log(`⏱️  Upload duration: ${(duration / 1000).toFixed(2)} seconds`);
    
    const successRate = this.uploadStats.totalHadiths > 0 
      ? ((this.uploadStats.uploadedHadiths / this.uploadStats.totalHadiths) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Success rate: ${successRate}%`);
    
    // Show errors if any
    if (this.uploadStats.errors.length > 0) {
      console.log(`\n🚨 ERRORS (${this.uploadStats.errors.length}):`);
      this.uploadStats.errors.slice(0, 10).forEach(error => {
        console.log(`   ❌ ${error.error}`);
      });
      
      if (this.uploadStats.errors.length > 10) {
        console.log(`   ... and ${this.uploadStats.errors.length - 10} more errors`);
      }
    }
    
    // Next steps
    console.log('\n💡 NEXT STEPS:');
    if (this.uploadStats.failedHadiths === 0) {
      console.log('   ✅ All hadiths uploaded successfully!');
      console.log('   🔍 Verify data in Firebase Console');
      console.log('   🚀 Update frontend to use new collections');
    } else {
      console.log('   🔧 Review and fix upload errors');
      console.log('   🔄 Re-run upload for failed items');
    }
    
    console.log('   📚 Collections created:');
    for (const bookId of Object.keys(BookCollections)) {
      console.log(`   - hadiths_${bookId}`);
    }
    console.log('   - books_metadata');
    
    console.log('='.repeat(70));
  }

  /**
   * Test Firebase connection
   */
  async testConnection() {
    try {
      await this.initializeFirebase();
      
      // Test write
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'Firebase connection test'
      };
      
      const docRef = doc(this.db, 'tests', 'connection');
      await setDoc(docRef, testDoc);
      
      console.log('✅ Firebase connection test successful');
      
      // Clean up test document
      // Note: In production, you might want to keep this for monitoring
      
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
class FirebaseUploadCLI {
  constructor() {
    this.service = new FirebaseUploadService();
    this.args = this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      process.exit(0);
    }
    
    return {
      test: args.includes('--test'),
      dryRun: args.includes('--dry-run')
    };
  }

  showHelp() {
    console.log(`
🕌 Firebase Upload Service for Hadith Data

USAGE:
  node uploadHadithsToFirebase.js [options]

OPTIONS:
  --test          Test Firebase connection only
  --dry-run       Show what would be uploaded without actually uploading
  --help, -h      Show this help message

EXAMPLES:
  node uploadHadithsToFirebase.js              # Upload all files
  node uploadHadithsToFirebase.js --test      # Test connection
  node uploadHadithsToFirebase.js --dry-run   # Preview upload

ENVIRONMENT VARIABLES:
  FIREBASE_PROJECT_ID      Firebase project ID
  FIREBASE_CLIENT_EMAIL    Firebase service account email
  FIREBASE_PRIVATE_KEY     Firebase service account private key
  FIREBASE_DATABASE_URL    Firebase database URL

FEATURES:
  ✅ Batch uploads (500 hadiths per batch)
  ✅ Automatic collection creation
  ✅ Book metadata generation
  ✅ Error handling and logging
  ✅ Progress tracking
  ✅ UTF-8 support for Arabic text
`);
  }

  async run() {
    console.log('🕌 Firebase Upload Service for Hadith Data');
    console.log(`📅 Started: ${new Date().toISOString()}`);
    
    try {
      if (this.args.test) {
        await this.service.testConnection();
      } else if (this.args.dryRun) {
        console.log('🔍 DRY RUN MODE - No actual uploads will be performed');
        // TODO: Implement dry run logic
      } else {
        await this.service.uploadAllFiles();
      }
      
      console.log(`\n✅ Completed: ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('\n❌ FATAL ERROR:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new FirebaseUploadCLI();
  cli.run().catch(console.error);
}

export default FirebaseUploadService;
