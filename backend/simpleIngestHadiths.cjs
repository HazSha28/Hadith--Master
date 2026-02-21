#!/usr/bin/env node

/**
 * Simple Hadith Data Ingestion Script
 * Basic implementation to get started with authentic hadith data
 */

const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

// Book configuration
const BOOKS = {
  'sahih-al-bukhari': {
    name: 'Sahih al-Bukhari',
    total_hadiths: 7563,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/bukhari.json'
  },
  'sahih-muslim': {
    name: 'Sahih Muslim',
    total_hadiths: 7190,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/muslim.json'
  },
  'sunan-abu-dawud': {
    name: 'Sunan Abu Dawud',
    total_hadiths: 5274,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/abudawud.json'
  },
  'jami-at-tirmidhi': {
    name: 'Jamiʿ at-Tirmidhi',
    total_hadiths: 3956,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/tirmidhi.json'
  },
  'sunan-an-nasai': {
    name: 'Sunan an-Nasa\'i',
    total_hadiths: 5761,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/nasai.json'
  },
  'sunan-ibn-majah': {
    name: 'Sunan Ibn Majah',
    total_hadiths: 4341,
    source: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/ibnmajah.json'
  }
};

class SimpleHadithIngestion {
  constructor() {
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      startTime: new Date()
    };
  }

  /**
   * Transform raw hadith to required structure
   */
  transformHadith(rawHadith, bookKey) {
    const book = BOOKS[bookKey];
    
    return {
      // Required fields
      book_name: book.name,
      book_id: bookKey,
      hadith_number: rawHadith.id?.toString() || '',
      kitab: rawHadith.book?.title || 'Unknown',
      bab: rawHadith.chapter?.title || 'Unknown',
      arabic_text: rawHadith.arabic || '',
      english_translation: rawHadith.english?.text || '',
      urdu_translation: '', // Will be added later
      narrator: rawHadith.english?.narrator || '',
      isnad: rawHadith.english?.narrator || '',
      matn: rawHadith.arabic || '',
      grade: this.determineGrade(bookKey),
      scholar_verification: `From ${book.name} - authentic collection`,
      themes: this.extractThemes(rawHadith),
      keywords: this.extractKeywords(rawHadith),
      authenticity_level: this.getAuthenticityLevel(bookKey),
      source_reference: `${book.name}, Hadith ${rawHadith.id}`,
      cross_references: [],

      // Metadata
      metadata: {
        verification_required: false,
        processing_status: 'processed',
        last_updated: new Date().toISOString(),
        source_api: 'ahmedbaset',
        batch_id: `batch_${Date.now()}`,
        quality_score: this.calculateQualityScore(rawHadith)
      }
    };
  }

  /**
   * Determine grade based on book
   */
  determineGrade(bookKey) {
    const grades = {
      'sahih-al-bukhari': 'Sahih',
      'sahih-muslim': 'Sahih',
      'sunan-abu-dawud': 'Hasan',
      'jami-at-tirmidhi': 'Hasan',
      'sunan-an-nasai': 'Hasan',
      'sunan-ibn-majah': 'Da\'if'
    };
    return grades[bookKey] || 'Unknown';
  }

  /**
   * Get authenticity level
   */
  getAuthenticityLevel(bookKey) {
    const levels = {
      'sahih-al-bukhari': 'High',
      'sahih-muslim': 'High',
      'sunan-abu-dawud': 'Medium',
      'jami-at-tirmidhi': 'Medium',
      'sunan-an-nasai': 'Medium',
      'sunan-ibn-majah': 'Low'
    };
    return levels[bookKey] || 'Unknown';
  }

  /**
   * Extract themes from hadith text
   */
  extractThemes(hadith) {
    const text = `${hadith.arabic || ''} ${hadith.english?.text || ''}`.toLowerCase();
    const themes = [];

    // Theme keywords
    const themeKeywords = {
      'faith': ['faith', 'iman', 'belief', 'allah', 'god'],
      'prayer': ['prayer', 'salah', 'pray', 'mosque'],
      'charity': ['charity', 'sadaqah', 'zakat', 'give', 'poor'],
      'fasting': ['fast', 'ramadan', 'iftar', 'suhoor'],
      'pilgrimage': ['hajj', 'pilgrimage', 'mecca', 'kaaba'],
      'manners': ['manners', 'etiquette', 'behavior', 'character'],
      'knowledge': ['knowledge', 'learn', 'study', 'scholar'],
      'business': ['business', 'trade', 'money', 'transaction'],
      'marriage': ['marriage', 'wife', 'husband', 'family'],
      'character': ['character', 'honest', 'truthful', 'kind']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general'];
  }

  /**
   * Extract keywords for search
   */
  extractKeywords(hadith) {
    const keywords = new Set();
    
    // From English text
    if (hadith.english?.text) {
      const words = hadith.english.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3);
      words.forEach(word => keywords.add(word));
    }

    // Add narrator
    if (hadith.english?.narrator) {
      keywords.add(hadith.english.narrator.toLowerCase());
    }

    return Array.from(keywords).slice(0, 15);
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(hadith) {
    let score = 0;
    
    if (hadith.arabic && hadith.arabic.length > 10) score += 30;
    if (hadith.english?.text && hadith.english.text.length > 10) score += 25;
    if (hadith.english?.narrator) score += 15;
    if (hadith.book || hadith.chapter) score += 15;
    if (hadith.id) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Fetch hadith data from API
   */
  async fetchHadiths(bookKey) {
    const book = BOOKS[bookKey];
    
    try {
      console.log(`📥 Fetching ${book.name} from ${book.source}...`);
      
      const response = await axios.get(book.source, {
        timeout: 30000,
        headers: { 'User-Agent': 'Hadith-Master/1.0' }
      });
      
      console.log(`✅ Fetched data structure:`, typeof response.data);
      
      // Handle different data structures
      let hadiths = [];
      
      if (Array.isArray(response.data)) {
        // Direct array
        hadiths = response.data;
      } else if (response.data && response.data.hadiths && Array.isArray(response.data.hadiths)) {
        // Object with hadiths array
        hadiths = response.data.hadiths;
      } else if (response.data && typeof response.data === 'object') {
        // Single object, might be a single hadith
        hadiths = [response.data];
      } else {
        console.warn('⚠️  Unexpected data structure:', response.data);
        throw new Error(`Invalid data structure for ${bookKey}`);
      }
      
      console.log(`✅ Fetched ${hadiths.length} hadiths`);
      return hadiths;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${book.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Process a single book
   */
  async processBook(bookKey) {
    try {
      console.log(`\n🔄 Processing ${bookKey}...`);
      
      // Fetch raw data
      const rawData = await this.fetchHadiths(bookKey);
      
      // Transform data
      const transformedData = [];
      for (const rawHadith of rawData) {
        try {
          const transformed = this.transformHadith(rawHadith, bookKey);
          transformedData.push(transformed);
          this.stats.successful++;
        } catch (error) {
          console.error(`❌ Failed to transform hadith ${rawHadith.id}:`, error.message);
          this.stats.failed++;
        }
        this.stats.totalProcessed++;
      }
      
      // Save to file
      const outputDir = path.join(process.cwd(), 'processed_hadiths');
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `${bookKey}_processed.json`;
      const filepath = path.join(outputDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(transformedData, null, 2), 'utf8');
      
      console.log(`💾 Saved ${transformedData.length} hadiths to ${filename}`);
      
      return { bookKey, count: transformedData.length, filepath };
      
    } catch (error) {
      console.error(`❌ Failed to process ${bookKey}:`, error.message);
      return { bookKey, error: error.message, count: 0 };
    }
  }

  /**
   * Process all books
   */
  async processAllBooks() {
    console.log('🕌 Hadith Master Data Ingestion');
    console.log(`📅 Started: ${this.stats.startTime.toISOString()}`);
    console.log(`📚 Processing ${Object.keys(BOOKS).length} books\n`);
    
    const results = [];
    
    for (const bookKey of Object.keys(BOOKS)) {
      const result = await this.processBook(bookKey);
      results.push(result);
    }
    
    // Generate summary
    this.generateSummary(results);
    
    return results;
  }

  /**
   * Generate processing summary
   */
  generateSummary(results) {
    const endTime = new Date();
    const duration = endTime - this.stats.startTime;
    const successful = results.filter(r => !r.error);
    const totalHadiths = successful.reduce((sum, r) => sum + (r.count || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful.length}/${results.length} books`);
    console.log(`📚 Total hadiths: ${totalHadiths.toLocaleString()}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`📈 Success rate: ${this.stats.totalProcessed > 0 ? ((this.stats.successful / this.stats.totalProcessed) * 100).toFixed(2) : 0}%`);
    
    console.log('\n📖 BOOK DETAILS:');
    successful.forEach(r => {
      console.log(`   ✅ ${BOOKS[r.bookKey].name}: ${(r.count || 0).toLocaleString()} hadiths`);
    });
    
    const failed = results.filter(r => r.error);
    if (failed.length > 0) {
      console.log('\n❌ FAILED BOOKS:');
      failed.forEach(r => {
        console.log(`   ❌ ${BOOKS[r.bookKey]?.name || r.bookKey}: ${r.error}`);
      });
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Review generated files in processed_hadiths/ directory');
    console.log('   2. Validate data with: node validateHadiths.js');
    console.log('   3. Upload to Firebase with: npm run upload-hadiths');
    
    console.log('='.repeat(60));
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    books: [],
    dryRun: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--books':
        config.books = args[++i]?.split(',') || [];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--help':
      case '-h':
        config.help = true;
        break;
    }
  }
  
  return config;
}

function showHelp() {
  console.log(`
🕌 Hadith Master Data Ingestion

USAGE:
  node simpleIngestHadiths.js [options]

OPTIONS:
  --books <book1,book2>    Specific books to process (default: all)
  --dry-run                Show what would be processed
  --help, -h               Show this help

AVAILABLE BOOKS:
  ${Object.keys(BOOKS).map(key => `  ${key} - ${BOOKS[key].name}`).join('\n')}

EXAMPLES:
  node simpleIngestHadiths.js                           # Process all books
  node simpleIngestHadiths.js --books sahih-al-bukhari   # Process one book
  node simpleIngestHadiths.js --dry-run                  # Preview processing
`);
}

// Main execution
async function main() {
  const config = parseArgs();
  
  if (config.help) {
    showHelp();
    return;
  }
  
  const processor = new SimpleHadithIngestion();
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE');
    console.log('Would process the following books:');
    
    const booksToProcess = config.books.length > 0 ? config.books : Object.keys(BOOKS);
    booksToProcess.forEach(bookKey => {
      console.log(`   📖 ${BOOKS[bookKey].name} (${BOOKS[bookKey].total_hadiths} hadiths)`);
    });
    
    console.log('\nRemove --dry-run flag to actually process the data');
    return;
  }
  
  try {
    await processor.processAllBooks();
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SimpleHadithIngestion;
