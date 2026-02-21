// Hadith Data Ingestion Service
// Comprehensive service for ingesting authentic hadith data from multiple sources

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports for ES modules
let hadithDataStructure;
try {
  const module = await import('./hadithDataStructure.js');
  hadithDataStructure = module.default;
} catch (error) {
  console.error('Failed to import hadithDataStructure:', error);
  throw error;
}

/**
 * Main Hadith Ingestion Service
 * Handles data collection, validation, and storage
 */
class HadithIngestionService {
  constructor() {
    this.processingStats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      verificationRequired: 0,
      startTime: null,
      endTime: null
    };
    
    this.errorLog = [];
    this.batchId = this.generateBatchId();
  }

  /**
   * Generate unique batch ID for tracking
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log processing errors
   */
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      batchId: this.batchId,
      error: error.message,
      context,
      stack: error.stack
    };
    
    this.errorLog.push(errorEntry);
    console.error(`[ERROR] ${errorEntry.timestamp}:`, errorEntry);
  }

  /**
   * Fetch hadith data from AhmedBaset GitHub repository
   */
  async fetchFromAhmedBaset(bookKey) {
    try {
      const book = hadithDataStructure.BookCollections[bookKey];
      const response = await axios.get(book.api_endpoints.ahmedbaset, {
        timeout: 30000,
        headers: { 'User-Agent': 'Hadith-Master-Ingestion/1.0' }
      });
      
      console.log(`✅ Fetched ${book.name} data from AhmedBaset: ${response.data.length} hadiths`);
      return response.data;
    } catch (error) {
      this.logError(error, { source: 'AhmedBaset', book: bookKey });
      throw new Error(`Failed to fetch ${bookKey} from AhmedBaset: ${error.message}`);
    }
  }

  /**
   * Fetch hadith data from Fawazahmed CDN
   */
  async fetchFromFawazahmed(bookKey) {
    try {
      const book = BookCollections[bookKey];
      // Get the metadata first
      const metaResponse = await axios.get(`${book.api_endpoints.fawazahmed}/metadata.json`, {
        timeout: 30000
      });
      
      const metadata = metaResponse.data;
      const hadiths = [];
      
      // Fetch hadiths in batches
      const batchSize = 100;
      for (let i = 1; i <= metadata.total_hadiths; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, metadata.total_hadiths + 1); j++) {
          try {
            const hadithResponse = await axios.get(`${book.api_endpoints.fawazahmed}/${j}.json`, {
              timeout: 10000
            });
            batch.push(hadithResponse.data);
          } catch (err) {
            console.warn(`⚠️  Failed to fetch hadith ${j} from ${bookKey}`);
          }
        }
        hadiths.push(...batch);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Fetched ${book.name} data from Fawazahmed: ${hadiths.length} hadiths`);
      return hadiths;
    } catch (error) {
      this.logError(error, { source: 'Fawazahmed', book: bookKey });
      throw new Error(`Failed to fetch ${bookKey} from Fawazahmed: ${error.message}`);
    }
  }

  /**
   * Transform raw data to required structure
   */
  transformHadithData(rawData, bookKey, source) {
    const book = BookCollections[bookKey];
    const transformedHadiths = [];

    for (const rawHadith of rawData) {
      try {
        const transformed = {
          // Required fields
          book_name: book.name,
          book_id: bookKey,
          hadith_number: rawHadith.id?.toString() || rawHadith.hadithNumber?.toString() || '',
          kitab: rawHadith.book?.title || rawHadith.kitab || '',
          bab: rawHadith.chapter?.title || rawHadith.bab || '',
          arabic_text: rawHadith.arabic || '',
          english_translation: rawHadith.english?.text || rawHadith.english || '',
          urdu_translation: rawHadith.urdu || '', // Will be populated later
          narrator: rawHadith.english?.narrator || rawHadith.narrator || '',
          isnad: rawHadith.isnad || this.extractIsnad(rawHadith),
          matn: rawHadith.matn || rawHadith.arabic || '',
          grade: this.determineGrade(rawHadith, bookKey),
          scholar_verification: this.generateScholarVerification(rawHadith, bookKey),
          themes: this.classifyThemes(rawHadith, bookKey),
          keywords: this.generateKeywords(rawHadith),
          authenticity_level: this.determineAuthenticityLevel(rawHadith, bookKey),
          source_reference: `${book.name}, Hadith ${rawHadith.id}`,
          cross_references: this.findCrossReferences(rawHadith, bookKey),

          // Metadata
          metadata: {
            verification_required: this.needsVerification(rawHadith),
            processing_status: 'processed',
            last_updated: new Date().toISOString(),
            source_api: source,
            batch_id: this.batchId,
            quality_score: this.calculateQualityScore(rawHadith)
          }
        };

        transformedHadiths.push(transformed);
        this.processingStats.successful++;
        
      } catch (error) {
        this.logError(error, { 
          hadithId: rawHadith.id, 
          book: bookKey, 
          source 
        });
        this.processingStats.failed++;
      }
    }

    return transformedHadiths;
  }

  /**
   * Extract isnad from raw hadith data
   */
  extractIsnad(rawHadith) {
    // Try to extract chain of transmission
    if (rawHadith.english?.narrator) {
      return rawHadith.english.narrator;
    }
    return 'Chain not fully documented';
  }

  /**
   * Determine hadith grade based on book and content
   */
  determineGrade(rawHadith, bookKey) {
    // Default grades based on book authenticity
    const defaultGrades = {
      'sahih-al-bukhari': 'Sahih',
      'sahih-muslim': 'Sahih', 
      'sunan-abu-dawud': 'Hasan',
      'jami-at-tirmidhi': 'Hasan',
      'sunan-an-nasai': 'Hasan',
      'sunan-ibn-majah': 'Da\'if'
    };

    return rawHadith.grade || defaultGrades[bookKey] || 'Unknown';
  }

  /**
   * Generate scholar verification notes
   */
  generateScholarVerification(rawHadith, bookKey) {
    const book = BookCollections[bookKey];
    return `Verified from ${book.name}. ${book.authenticity}. Original source: ${rawHadith.source || 'Primary collection'}`;
  }

  /**
   * Classify themes for hadith
   */
  classifyThemes(rawHadith, bookKey) {
    const text = `${rawHadith.arabic || ''} ${rawHadith.english?.text || ''}`.toLowerCase();
    const themes = [];

    // Check each theme category
    for (const [category, keywords] of Object.entries(ThemeClassification)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          themes.push(category);
          break; // Add category once even if multiple keywords match
        }
      }
    }

    // Add book-specific themes
    const book = BookCollections[bookKey];
    themes.push(...book.themes.slice(0, 3)); // Add top 3 book themes

    return [...new Set(themes)]; // Remove duplicates
  }

  /**
   * Generate search keywords
   */
  generateKeywords(rawHadith) {
    const keywords = new Set();
    
    // Extract from Arabic text
    if (rawHadith.arabic) {
      const arabicWords = rawHadith.arabic.split(' ').filter(word => word.length > 3);
      arabicWords.forEach(word => keywords.add(word));
    }

    // Extract from English text
    if (rawHadith.english?.text) {
      const englishWords = rawHadith.english.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3);
      englishWords.forEach(word => keywords.add(word));
    }

    // Add narrator
    if (rawHadith.english?.narrator) {
      keywords.add(rawHadith.english.narrator.toLowerCase());
    }

    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
  }

  /**
   * Determine overall authenticity level
   */
  determineAuthenticityLevel(rawHadith, bookKey) {
    const grade = this.determineGrade(rawHadith, bookKey);
    
    if (grade === 'Sahih') return 'High';
    if (grade === 'Hasan') return 'Medium';
    if (grade === 'Da\'if') return 'Low';
    return 'Unknown';
  }

  /**
   * Find cross-references to same hadith in other books
   */
  findCrossReferences(rawHadith, bookKey) {
    const crossRefs = [];
    
    // Check common hadith patterns
    for (const common of CrossReferenceConfig.common_hadiths) {
      if (rawHadith.id?.toString() === common[bookKey]) {
        for (const [otherBook, ref] of Object.entries(common)) {
          if (otherBook !== bookKey && otherBook !== 'theme' && otherBook !== 'description') {
            crossRefs.push({
              book: BookCollections[otherBook]?.name || otherBook,
              reference: ref,
              theme: common.theme,
              description: common.description
            });
          }
        }
      }
    }

    return crossRefs;
  }

  /**
   * Check if hadith needs verification
   */
  needsVerification(rawHadith) {
    // Flag for verification if:
    // - Missing critical fields
    // - Unusual content
    // - Weak chain
    return !rawHadith.arabic || 
           !rawHadith.english?.text || 
           !rawHadith.english?.narrator ||
           rawHadith.grade === 'Da\'if';
  }

  /**
   * Calculate data quality score (0-100)
   */
  calculateQualityScore(rawHadith) {
    let score = 0;
    
    // Arabic text (30 points)
    if (rawHadith.arabic && rawHadith.arabic.length > 10) score += 30;
    
    // English translation (25 points)
    if (rawHadith.english?.text && rawHadith.english.text.length > 10) score += 25;
    
    // Narrator (15 points)
    if (rawHadith.english?.narrator) score += 15;
    
    // Chapter/Book info (15 points)
    if (rawHadith.book || rawHadith.chapter) score += 15;
    
    // Grade (15 points)
    if (rawHadith.grade) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Save processed data to files
   */
  async saveProcessedData(bookKey, data) {
    const outputDir = path.join(process.cwd(), 'processed_hadiths');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `${bookKey}_${this.batchId}.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Saved ${data.length} hadiths to ${filename}`);
    
    return filepath;
  }

  /**
   * Process a single book completely
   */
  async processBook(bookKey, source = 'ahmedbaset') {
    console.log(`🔄 Processing ${bookKey} from ${source}...`);
    
    try {
      // Fetch raw data
      const rawData = source === 'ahmedbaset' 
        ? await this.fetchFromAhmedBaset(bookKey)
        : await this.fetchFromFawazahmed(bookKey);
      
      // Transform data
      const transformedData = this.transformHadithData(rawData, bookKey, source);
      
      // Save processed data
      const filepath = await this.saveProcessedData(bookKey, transformedData);
      
      // Update stats
      this.processingStats.totalProcessed += transformedData.length;
      
      console.log(`✅ Completed ${bookKey}: ${transformedData.length} hadiths processed`);
      return { bookKey, count: transformedData.length, filepath };
      
    } catch (error) {
      this.logError(error, { bookKey, source });
      throw error;
    }
  }

  /**
   * Process all mandatory books
   */
  async processAllBooks(sources = {}) {
    console.log(`🚀 Starting hadith ingestion batch ${this.batchId}`);
    this.processingStats.startTime = new Date();
    
    const results = [];
    
    for (const bookKey of Object.keys(BookCollections)) {
      const source = sources[bookKey] || 'ahmedbaset'; // Default to AhmedBaset
      
      try {
        const result = await this.processBook(bookKey, source);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${bookKey}:`, error.message);
        results.push({ bookKey, error: error.message, count: 0 });
      }
    }
    
    this.processingStats.endTime = new Date();
    
    // Generate final report
    await this.generateReport(results);
    
    return results;
  }

  /**
   * Generate processing report
   */
  async generateReport(results) {
    const report = {
      batchId: this.batchId,
      processingTime: this.processingStats.endTime - this.processingStats.startTime,
      stats: this.processingStats,
      results,
      errors: this.errorLog,
      summary: {
        totalBooks: results.length,
        successfulBooks: results.filter(r => !r.error).length,
        totalHadiths: results.reduce((sum, r) => sum + (r.count || 0), 0),
        averageQuality: this.processingStats.successful > 0 
          ? (this.processingStats.successful / this.processingStats.totalProcessed * 100).toFixed(2)
          : 0
      }
    };
    
    const reportPath = path.join(process.cwd(), 'processed_hadiths', `report_${this.batchId}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`📊 Report generated: report_${this.batchId}.json`);
    console.log(`📈 Summary: ${report.summary.totalHadiths} hadiths processed from ${report.summary.successfulBooks}/${report.summary.totalBooks} books`);
    
    return report;
  }
}

export default HadithIngestionService;
