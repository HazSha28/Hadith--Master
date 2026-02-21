#!/usr/bin/env node

/**
 * Hadith Data Ingestion Main Script
 * 
 * Usage:
 * node ingestHadiths.js [options]
 * 
 * Options:
 * --books <book1,book2>    Specific books to process (default: all)
 * --source <api>           Source API: ahmedbaset or fawazahmed (default: ahmedbaset)
 * --validate-only          Only validate existing data
 * --dry-run                Process without saving
 * --batch-size <number>    Batch size for processing (default: 100)
 * --output-dir <path>      Output directory (default: ./processed_hadiths)
 * 
 * Examples:
 * node ingestHadiths.js                                    # Process all books from AhmedBaset
 * node ingestHadiths.js --books sahih-al-bukhari,sahih-muslim --source fawazahmed
 * node ingestHadiths.js --validate-only
 * node ingestHadiths.js --dry-run --batch-size 50
 */

import HadithIngestionService from './hadithIngestionService.js';
import { BookCollections } from './hadithDataStructure.js';

class HadithIngestionCLI {
  constructor() {
    this.args = this.parseArgs();
    this.service = new HadithIngestionService();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
      books: [],
      source: 'ahmedbaset',
      validateOnly: false,
      dryRun: false,
      batchSize: 100,
      outputDir: './processed_hadiths'
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--books':
          parsed.books = args[++i]?.split(',') || [];
          break;
        case '--source':
          parsed.source = args[++i];
          if (!['ahmedbaset', 'fawazahmed'].includes(parsed.source)) {
            console.error('❌ Invalid source. Use: ahmedbaset or fawazahmed');
            process.exit(1);
          }
          break;
        case '--validate-only':
          parsed.validateOnly = true;
          break;
        case '--dry-run':
          parsed.dryRun = true;
          break;
        case '--batch-size':
          parsed.batchSize = parseInt(args[++i]) || 100;
          break;
        case '--output-dir':
          parsed.outputDir = args[++i];
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
        default:
          if (args[i].startsWith('--')) {
            console.error(`❌ Unknown option: ${args[i]}`);
            process.exit(1);
          }
      }
    }

    // Validate books
    if (parsed.books.length > 0) {
      const invalidBooks = parsed.books.filter(book => !BookCollections[book]);
      if (invalidBooks.length > 0) {
        console.error(`❌ Invalid books: ${invalidBooks.join(', ')}`);
        console.error('Available books:', Object.keys(BookCollections).join(', '));
        process.exit(1);
      }
    }

    return parsed;
  }

  showHelp() {
    console.log(`
🕌 Hadith Master Data Ingestion Tool

USAGE:
  node ingestHadiths.js [options]

OPTIONS:
  --books <book1,book2>    Specific books to process (default: all)
  --source <api>           Source API: ahmedbaset or fawazahmed (default: ahmedbaset)
  --validate-only          Only validate existing data
  --dry-run                Process without saving
  --batch-size <number>    Batch size for processing (default: 100)
  --output-dir <path>      Output directory (default: ./processed_hadiths)
  --help, -h               Show this help message

AVAILABLE BOOKS:
  ${Object.keys(BookCollections).map(key => `  ${key} - ${BookCollections[key].name}`).join('\n')}

EXAMPLES:
  node ingestHadiths.js                                    # Process all books from AhmedBaset
  node ingestHadiths.js --books sahih-al-bukhari,sahih-muslim --source fawazahmed
  node ingestHadiths.js --validate-only
  node ingestHadiths.js --dry-run --batch-size 50

SOURCE APIS:
  ahmedbaset   - GitHub JSON dataset (50,884 hadiths, 17 books)
  fawazahmed   - CDN API with multiple languages and grades

FEATURES:
  ✅ Authentic hadith sources only
  ✅ Complete data structure validation
  ✅ Theme classification and keywords
  ✅ Cross-referencing between books
  ✅ Quality scoring and verification
  ✅ UTF-8 encoding for Arabic text
  ✅ Error handling and logging
  ✅ Batch processing with progress tracking
`);
  }

  async validateExistingData() {
    console.log('🔍 Validating existing hadith data...');
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const processedDir = path.join(process.cwd(), 'processed_hadiths');
      
      try {
        const files = await fs.readdir(processedDir);
        const jsonFiles = files.filter(file => file.endsWith('.json') && !file.includes('report'));
        
        console.log(`📁 Found ${jsonFiles.length} data files`);
        
        let totalHadiths = 0;
        let totalErrors = 0;
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(processedDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            if (Array.isArray(data)) {
              totalHadiths += data.length;
              
              // Validate structure
              for (const hadith of data) {
                const errors = this.validateHadithStructure(hadith);
                if (errors.length > 0) {
                  totalErrors++;
                  console.warn(`⚠️  Structure errors in ${file}, hadith ${hadith.hadith_number}:`, errors);
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            totalErrors++;
          }
        }
        
        console.log(`✅ Validation complete:`);
        console.log(`   Total hadiths: ${totalHadiths}`);
        console.log(`   Files processed: ${jsonFiles.length}`);
        console.log(`   Structure errors: ${totalErrors}`);
        console.log(`   Data integrity: ${totalErrors === 0 ? '✅ PASSED' : '❌ FAILED'}`);
        
        return { totalHadiths, totalErrors, files: jsonFiles.length };
        
      } catch (error) {
        console.log('📁 No existing data found');
        return { totalHadiths: 0, totalErrors: 0, files: 0 };
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }
  }

  validateHadithStructure(hadith) {
    const errors = [];
    const required = [
      'book_name', 'book_id', 'hadith_number', 'arabic_text',
      'english_translation', 'narrator', 'grade', 'themes', 'keywords'
    ];
    
    for (const field of required) {
      if (!hadith[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Check arrays
    if (!Array.isArray(hadith.themes)) {
      errors.push('Themes must be an array');
    }
    
    if (!Array.isArray(hadith.keywords)) {
      errors.push('Keywords must be an array');
    }
    
    if (!Array.isArray(hadith.cross_references)) {
      errors.push('Cross references must be an array');
    }
    
    return errors;
  }

  async processBooks() {
    const booksToProcess = this.args.books.length > 0 
      ? this.args.books 
      : Object.keys(BookCollections);
    
    console.log(`🚀 Processing ${booksToProcess.length} books from ${this.args.source}`);
    
    if (this.args.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be saved');
    }
    
    const results = [];
    
    for (const bookKey of booksToProcess) {
      console.log(`\n📖 Processing: ${BookCollections[bookKey].name}`);
      
      try {
        if (this.args.dryRun) {
          // Simulate processing
          console.log(`   📊 Would fetch from ${this.args.source}`);
          console.log(`   🔧 Would transform data structure`);
          console.log(`   💾 Would save to ${this.args.outputDir}/${bookKey}_*.json`);
          
          results.push({
            bookKey,
            count: Math.floor(Math.random() * 1000) + 100, // Mock count
            status: 'simulated'
          });
        } else {
          const result = await this.service.processBook(bookKey, this.args.source);
          results.push(result);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process ${bookKey}:`, error.message);
        results.push({
          bookKey,
          error: error.message,
          count: 0,
          status: 'failed'
        });
      }
    }
    
    return results;
  }

  async generateSummary(results) {
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    const totalHadiths = successful.reduce((sum, r) => sum + (r.count || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful.length}/${results.length} books`);
    console.log(`❌ Failed: ${failed.length} books`);
    console.log(`📚 Total hadiths processed: ${totalHadiths.toLocaleString()}`);
    
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL BOOKS:');
      successful.forEach(r => {
        console.log(`   ${BookCollections[r.bookKey].name}: ${(r.count || 0).toLocaleString()} hadiths`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED BOOKS:');
      failed.forEach(r => {
        console.log(`   ${BookCollections[r.bookKey]?.name || r.bookKey}: ${r.error}`);
      });
    }
    
    console.log('\n🎯 NEXT STEPS:');
    if (this.args.dryRun) {
      console.log('   Remove --dry-run flag to actually process and save data');
    } else {
      console.log('   1. Review generated files in processed_hadiths/ directory');
      console.log('   2. Run "node ingestHadiths.js --validate-only" to verify data integrity');
      console.log('   3. Run "npm run upload-hadiths" to upload to Firebase');
    }
    
    console.log('='.repeat(60));
    
    return {
      successful: successful.length,
      failed: failed.length,
      totalHadiths,
      results
    };
  }

  async run() {
    console.log('🕌 Hadith Master Data Ingestion Service');
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`⚙️  Configuration:`, this.args);
    
    try {
      let results;
      
      if (this.args.validateOnly) {
        results = await this.validateExistingData();
      } else {
        results = await this.processBooks();
        await this.generateSummary(results);
      }
      
      console.log(`\n✅ Completed: ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('\n❌ FATAL ERROR:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }
}

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new HadithIngestionCLI();
  cli.run().catch(console.error);
}

export default HadithIngestionCLI;
