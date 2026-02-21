#!/usr/bin/env node

/**
 * Hadith Data Validation Service
 * Comprehensive validation for processed hadith data
 */

import fs from 'fs/promises';
import path from 'path';
import { BookCollections } from './hadithDataStructure.js';

class HadithValidationService {
  constructor() {
    this.validationRules = {
      required: [
        'book_name', 'book_id', 'hadith_number', 'arabic_text',
        'english_translation', 'narrator', 'grade', 'themes', 
        'keywords', 'authenticity_level', 'source_reference'
      ],
      
      arrays: ['themes', 'keywords', 'cross_references'],
      
      enums: {
        grade: ['Sahih', 'Hasan', 'Da\'if', 'Maudu\'', 'Unknown'],
        authenticity_level: ['High', 'Medium', 'Low', 'Unknown'],
        book_id: Object.keys(BookCollections)
      },
      
      formats: {
        hadith_number: /^[0-9]+$/,
        book_id: /^[a-z-]+$/
      }
    };
    
    this.validationResults = {
      totalFiles: 0,
      totalHadiths: 0,
      validHadiths: 0,
      invalidHadiths: 0,
      errors: [],
      warnings: [],
      bookStats: {}
    };
  }

  /**
   * Validate a single hadith object
   */
  validateHadith(hadith, filename, index) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    for (const field of this.validationRules.required) {
      if (!hadith[field]) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof hadith[field] === 'string' && hadith[field].trim() === '') {
        errors.push(`Empty required field: ${field}`);
      }
    }
    
    // Check array fields
    for (const field of this.validationRules.arrays) {
      if (!Array.isArray(hadith[field])) {
        errors.push(`${field} must be an array`);
      } else if (hadith[field].length === 0) {
        warnings.push(`${field} is empty`);
      }
    }
    
    // Check enum values
    for (const [field, validValues] of Object.entries(this.validationRules.enums)) {
      if (hadith[field] && !validValues.includes(hadith[field])) {
        errors.push(`Invalid ${field}: "${hadith[field]}". Valid values: ${validValues.join(', ')}`);
      }
    }
    
    // Check format patterns
    for (const [field, pattern] of Object.entries(this.validationRules.formats)) {
      if (hadith[field] && !pattern.test(hadith[field])) {
        errors.push(`Invalid format for ${field}: "${hadith[field]}"`);
      }
    }
    
    // Content quality checks
    if (hadith.arabic_text) {
      if (hadith.arabic_text.length < 10) {
        warnings.push('Arabic text is very short');
      }
      if (!/[\u0600-\u06FF]/.test(hadith.arabic_text)) {
        warnings.push('Arabic text may not contain Arabic characters');
      }
    }
    
    if (hadith.english_translation) {
      if (hadith.english_translation.length < 10) {
        warnings.push('English translation is very short');
      }
    }
    
    // Check metadata
    if (hadith.metadata) {
      if (!hadith.metadata.batch_id) {
        warnings.push('Missing batch_id in metadata');
      }
      if (typeof hadith.metadata.quality_score !== 'number' || 
          hadith.metadata.quality_score < 0 || 
          hadith.metadata.quality_score > 100) {
        errors.push('Invalid quality_score (must be 0-100)');
      }
    } else {
      warnings.push('Missing metadata object');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hadithId: hadith.hadith_number || index,
      bookId: hadith.book_id,
      filename
    };
  }

  /**
   * Validate a single JSON file
   */
  async validateFile(filename) {
    const filePath = path.join(process.cwd(), 'processed_hadiths', filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('File must contain an array of hadiths');
      }
      
      const fileResults = {
        filename,
        totalHadiths: data.length,
        validHadiths: 0,
        invalidHadiths: 0,
        errors: [],
        warnings: []
      };
      
      console.log(`🔍 Validating ${filename} (${data.length} hadiths)...`);
      
      for (let i = 0; i < data.length; i++) {
        const result = this.validateHadith(data[i], filename, i);
        
        if (result.isValid) {
          fileResults.validHadiths++;
        } else {
          fileResults.invalidHadiths++;
        }
        
        fileResults.errors.push(...result.errors);
        fileResults.warnings.push(...result.warnings);
        
        // Update book stats
        const bookId = data[i].book_id;
        if (!this.validationResults.bookStats[bookId]) {
          this.validationResults.bookStats[bookId] = {
            total: 0,
            valid: 0,
            invalid: 0
          };
        }
        this.validationResults.bookStats[bookId].total++;
        if (result.isValid) {
          this.validationResults.bookStats[bookId].valid++;
        } else {
          this.validationResults.bookStats[bookId].invalid++;
        }
      }
      
      this.validationResults.totalHadiths += data.length;
      this.validationResults.validHadiths += fileResults.validHadiths;
      this.validationResults.invalidHadiths += fileResults.invalidHadiths;
      
      return fileResults;
      
    } catch (error) {
      throw new Error(`Failed to validate ${filename}: ${error.message}`);
    }
  }

  /**
   * Validate all processed hadith files
   */
  async validateAllFiles() {
    console.log('🔍 Starting comprehensive hadith data validation...\n');
    
    try {
      const processedDir = path.join(process.cwd(), 'processed_hadiths');
      const files = await fs.readdir(processedDir);
      const jsonFiles = files.filter(file => 
        file.endsWith('.json') && !file.includes('report')
      );
      
      if (jsonFiles.length === 0) {
        console.log('📁 No hadith data files found in processed_hadiths/ directory');
        console.log('💡 Run "npm run ingest-hadiths" first to generate data files');
        return;
      }
      
      this.validationResults.totalFiles = jsonFiles.length;
      
      console.log(`📁 Found ${jsonFiles.length} data files to validate\n`);
      
      const fileResults = [];
      
      for (const filename of jsonFiles) {
        try {
          const result = await this.validateFile(filename);
          fileResults.push(result);
        } catch (error) {
          console.error(`❌ ${error.message}`);
          this.validationResults.errors.push(error.message);
        }
      }
      
      this.generateReport(fileResults);
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate validation report
   */
  generateReport(fileResults) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 HADITH DATA VALIDATION REPORT');
    console.log('='.repeat(70));
    
    // Overall summary
    console.log(`📁 Files processed: ${this.validationResults.totalFiles}`);
    console.log(`📚 Total hadiths: ${this.validationResults.totalHadiths.toLocaleString()}`);
    console.log(`✅ Valid hadiths: ${this.validationResults.validHadiths.toLocaleString()}`);
    console.log(`❌ Invalid hadiths: ${this.validationResults.invalidHadiths.toLocaleString()}`);
    
    const validityRate = this.validationResults.totalHadiths > 0 
      ? ((this.validationResults.validHadiths / this.validationResults.totalHadiths) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Validity rate: ${validityRate}%`);
    
    // Book statistics
    console.log('\n📖 BOOK STATISTICS:');
    for (const [bookId, stats] of Object.entries(this.validationResults.bookStats)) {
      const bookName = BookCollections[bookId]?.name || bookId;
      const rate = stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : 0;
      console.log(`   ${bookName}: ${stats.valid}/${stats.total} (${rate}%)`);
    }
    
    // File details
    console.log('\n📄 FILE DETAILS:');
    for (const result of fileResults) {
      const status = result.invalidHadiths === 0 ? '✅' : '❌';
      const rate = result.totalHadiths > 0 
        ? ((result.validHadiths / result.totalHadiths) * 100).toFixed(1)
        : 0;
      
      console.log(`   ${status} ${result.filename}: ${result.validHadiths}/${result.totalHadiths} (${rate}%)`);
      
      if (result.errors.length > 0) {
        console.log(`      Errors: ${result.errors.slice(0, 3).join(', ')}`);
        if (result.errors.length > 3) {
          console.log(`      ... and ${result.errors.length - 3} more`);
        }
      }
    }
    
    // Common errors
    const allErrors = fileResults.flatMap(r => r.errors);
    const errorCounts = {};
    for (const error of allErrors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    }
    
    if (Object.keys(errorCounts).length > 0) {
      console.log('\n🚨 COMMON ERRORS:');
      const sortedErrors = Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      for (const [error, count] of sortedErrors) {
        console.log(`   (${count}x) ${error}`);
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.validationResults.invalidHadiths === 0) {
      console.log('   ✅ All hadiths passed validation! Ready for upload.');
      console.log('   🚀 Run "npm run upload-hadiths" to upload to Firebase');
    } else {
      console.log('   🔧 Fix invalid hadiths before uploading');
      console.log('   📝 Review common errors above for patterns');
      console.log('   🔄 Re-run validation after fixes');
    }
    
    if (this.validationResults.totalHadiths < 30000) {
      console.log('   ⚠️  Expected ~34,000 hadiths from 6 books');
      console.log('   📥 Consider running ingestion again if data is incomplete');
    }
    
    console.log('='.repeat(70));
    
    // Save detailed report
    this.saveDetailedReport(fileResults);
  }

  /**
   * Save detailed validation report
   */
  async saveDetailedReport(fileResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.validationResults,
      fileResults,
      validationRules: this.validationRules
    };
    
    const reportPath = path.join(process.cwd(), 'processed_hadiths', `validation_report_${Date.now()}.json`);
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`💾 Detailed report saved: ${path.basename(reportPath)}`);
    } catch (error) {
      console.warn('⚠️  Could not save detailed report:', error.message);
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new HadithValidationService();
  validator.validateAllFiles().catch(console.error);
}

export default HadithValidationService;
