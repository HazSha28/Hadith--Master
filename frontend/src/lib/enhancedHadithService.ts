// Enhanced Hadith Service for Comprehensive Hadith Data
// Works with the new data structure from our ingestion system

export interface EnhancedHadith {
  // Core Information
  book_name: string;
  book_id: string;
  hadith_number: string;
  kitab: string;
  bab: string;
  arabic_text: string;
  english_translation: string;
  urdu_translation: string;
  narrator: string;
  isnad: string;
  matn: string;
  grade: string;
  scholar_verification: string;
  
  // Classification
  themes: string[];
  keywords: string[];
  authenticity_level: string;
  source_reference: string;
  cross_references: CrossReference[];
  
  // Metadata
  metadata: {
    verification_required: boolean;
    processing_status: string;
    last_updated: string;
    source_api: string;
    batch_id: string;
    quality_score: number;
  };
}

export interface CrossReference {
  book: string;
  reference: string;
  theme: string;
  description: string;
}

export interface BookMetadata {
  book_id: string;
  name: string;
  total_hadiths: number;
  authenticity: string;
  description: string;
  chapters: ChapterInfo[];
}

export interface ChapterInfo {
  id: number;
  title: string;
  arabic_title: string;
  hadith_count: number;
}

export interface SearchFilters {
  book_id?: string;
  authenticity_level?: string;
  themes?: string[];
  grade?: string;
  narrator?: string;
  quality_score_min?: number;
  verification_required?: boolean;
}

export interface SearchResult {
  hadiths: EnhancedHadith[];
  total: number;
  page: number;
  limit: number;
  facets: {
    books: { [key: string]: number };
    themes: { [key: string]: number };
    authenticity_levels: { [key: string]: number };
    grades: { [key: string]: number };
  };
}

// Local data cache for development/demo
let localHadithCache: { [key: string]: EnhancedHadith[] } = {};
let bookMetadataCache: BookMetadata[] = [];

// Load sample data for development
async function loadSampleData(): Promise<void> {
  if (Object.keys(localHadithCache).length > 0) return;

  try {
    // Try to load from processed files first
    const response = await fetch('/api/hadiths/sample');
    if (response.ok) {
      const data = await response.json();
      localHadithCache = data.hadiths;
      bookMetadataCache = data.metadata;
      return;
    }
  } catch (error) {
    console.log('Using fallback sample data');
  }

  // Fallback sample data
  const sampleHadiths: EnhancedHadith[] = [
    {
      book_name: "Sahih al-Bukhari",
      book_id: "sahih-al-bukhari",
      hadith_number: "1",
      kitab: "The Book of Revelation",
      bab: "The Beginning of Revelation",
      arabic_text: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
      english_translation: "Verily actions are by intentions, and for every person is what he intended. So whoever emigrated for worldly benefits or for a woman to marry, his emigration was for what he emigrated for.",
      urdu_translation: "اعمال کے صرف نیتوں سے ہیں، اور ہر شخص کے لیے وہی ہے جس کی نیت ہے۔ پس جس کی ہجرت دنیا کی کسی چیز کو حاصل کرنے یا کسی عورت سے شادی کرنے کے لیے ہوگی، تو اس کی ہجرت اسی چیز کے لیے ہے جس کے لیے وہ ہجرت کر رہا ہے۔",
      narrator: "Umar ibn Al-Khattab",
      isnad: "Umar ibn Al-Khattab → narrated by Al-Bukhari",
      matn: "Verily actions are by intentions, and for every person is what he intended.",
      grade: "Sahih",
      scholar_verification: "Verified from Sahih al-Bukhari, Hadith 1. This is the first hadith in the collection and establishes the fundamental principle of intention in Islamic jurisprudence.",
      themes: ["faith", "actions", "intentions", "islamic-principles"],
      keywords: ["actions", "intentions", "faith", "ummah", "migration", "marriage"],
      authenticity_level: "High",
      source_reference: "Sahih al-Bukhari, Hadith 1, Book of Revelation",
      cross_references: [
        {
          book: "Sahih Muslim",
          reference: "Muslim 33:4705",
          theme: "intentions",
          description: "Actions are judged by intentions"
        }
      ],
      metadata: {
        verification_required: false,
        processing_status: "processed",
        last_updated: "2026-01-02T06:33:18.658Z",
        source_api: "ahmedbaset",
        batch_id: "batch_1704196155123_abc123",
        quality_score: 98
      }
    },
    {
      book_name: "Sahih Muslim",
      book_id: "sahih-muslim",
      hadith_number: "1",
      kitab: "The Book of Faith",
      bab: "The Beginning of Faith",
      arabic_text: "بَنِي الإِسْلَامِ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ",
      english_translation: "Islam is built upon five: testimony that there is no deity but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving zakat, pilgrimage to the House, and fasting Ramadan.",
      urdu_translation: "اسلام پانچ چیزوں پر قائم ہے: گواہی دینا کہ کوئی معبود نہیں ہے سوائے اللہ کے، اور محمد اللہ کے رسول ہیں، نماز قائم کرنا، زکوٰة دینا، بیت اللہ کا حج کرنا، اور رمضان میں روزے رکھنا۔",
      narrator: "Abdullah ibn Umar",
      isnad: "Abdullah ibn Umar → narrated by Muslim",
      matn: "Islam is built upon five: testimony that there is no deity but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving zakat, pilgrimage to the House, and fasting Ramadan.",
      grade: "Sahih",
      scholar_verification: "Verified from Sahih Muslim, Hadith 1. This hadith outlines the five pillars of Islam.",
      themes: ["faith", "pillars-of-islam", "worship", "islamic-principles"],
      keywords: ["islam", "pillars", "faith", "prayer", "zakat", "hajj", "fasting"],
      authenticity_level: "High",
      source_reference: "Sahih Muslim, Hadith 1, Book of Faith",
      cross_references: [
        {
          book: "Sahih al-Bukhari",
          reference: "Bukhari 8:2",
          theme: "pillars-of-islam",
          description: "The five pillars of Islam"
        }
      ],
      metadata: {
        verification_required: false,
        processing_status: "processed",
        last_updated: "2026-01-02T06:33:18.658Z",
        source_api: "ahmedbaset",
        batch_id: "batch_1704196155123_abc123",
        quality_score: 97
      }
    }
  ];

  // Cache by book
  localHadithCache = {
    "sahih-al-bukhari": [sampleHadiths[0]],
    "sahih-muslim": [sampleHadiths[1]]
  };

  bookMetadataCache = [
    {
      book_id: "sahih-al-bukhari",
      name: "Sahih al-Bukhari",
      total_hadiths: 7563,
      authenticity: "Most authentic collection",
      description: "The most authentic collection of hadith after the Quran",
      chapters: [
        { id: 1, title: "The Book of Revelation", arabic_title: "كتاب بدء الوحى", hadith_count: 7 }
      ]
    },
    {
      book_id: "sahih-muslim",
      name: "Sahih Muslim", 
      total_hadiths: 7190,
      authenticity: "Most authentic collection",
      description: "Second most authentic collection of hadith",
      chapters: [
        { id: 1, title: "The Book of Faith", arabic_title: "كتاب الإيمان", hadith_count: 6 }
      ]
    }
  ];
}

// Enhanced hadith service functions
export class EnhancedHadithService {
  /**
   * Get a random hadith from all books
   */
  static async getRandomHadith(filters?: SearchFilters): Promise<EnhancedHadith> {
    await loadSampleData();
    
    let allHadiths: EnhancedHadith[] = [];
    
    // Apply filters
    if (filters?.book_id) {
      allHadiths = localHadithCache[filters.book_id] || [];
    } else {
      Object.values(localHadithCache).forEach(hadiths => {
        allHadiths.push(...hadiths);
      });
    }

    // Apply additional filters
    if (filters) {
      allHadiths = allHadiths.filter(hadith => {
        if (filters.authenticity_level && hadith.authenticity_level !== filters.authenticity_level) return false;
        if (filters.grade && hadith.grade !== filters.grade) return false;
        if (filters.themes && !filters.themes.some(theme => hadith.themes.includes(theme))) return false;
        if (filters.quality_score_min && hadith.metadata.quality_score < filters.quality_score_min) return false;
        if (filters.verification_required !== undefined && hadith.metadata.verification_required !== filters.verification_required) return false;
        return true;
      });
    }

    if (allHadiths.length === 0) {
      throw new Error('No hadiths found matching the criteria');
    }

    return allHadiths[Math.floor(Math.random() * allHadiths.length)];
  }

  /**
   * Search hadiths with advanced filters
   */
  static async searchHadiths(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    await loadSampleData();
    
    let allHadiths: EnhancedHadith[] = [];
    
    // Get hadiths from specified books or all books
    if (filters?.book_id) {
      allHadiths = localHadithCache[filters.book_id] || [];
    } else {
      Object.values(localHadithCache).forEach(hadiths => {
        allHadiths.push(...hadiths);
      });
    }

    // Apply search query
    let filteredHadiths = allHadiths;
    if (query) {
      const queryLower = query.toLowerCase();
      filteredHadiths = allHadiths.filter(hadith => 
        hadith.arabic_text.includes(query) ||
        hadith.english_translation.toLowerCase().includes(queryLower) ||
        hadith.urdu_translation.toLowerCase().includes(queryLower) ||
        hadith.narrator.toLowerCase().includes(queryLower) ||
        hadith.keywords.some(keyword => keyword.toLowerCase().includes(queryLower)) ||
        hadith.themes.some(theme => theme.toLowerCase().includes(queryLower))
      );
    }

    // Apply additional filters
    if (filters) {
      filteredHadiths = filteredHadiths.filter(hadith => {
        if (filters.authenticity_level && hadith.authenticity_level !== filters.authenticity_level) return false;
        if (filters.grade && hadith.grade !== filters.grade) return false;
        if (filters.themes && !filters.themes.some(theme => hadith.themes.includes(theme))) return false;
        if (filters.narrator && !hadith.narrator.toLowerCase().includes(filters.narrator.toLowerCase())) return false;
        if (filters.quality_score_min && hadith.metadata.quality_score < filters.quality_score_min) return false;
        if (filters.verification_required !== undefined && hadith.metadata.verification_required !== filters.verification_required) return false;
        return true;
      });
    }

    // Calculate facets
    const facets = this.calculateFacets(filteredHadiths);

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedHadiths = filteredHadiths.slice(startIndex, startIndex + limit);

    return {
      hadiths: paginatedHadiths,
      total: filteredHadiths.length,
      page,
      limit,
      facets
    };
  }

  /**
   * Get hadith by book and number
   */
  static async getHadithByReference(bookId: string, hadithNumber: string): Promise<EnhancedHadith | null> {
    await loadSampleData();
    
    const bookHadiths = localHadithCache[bookId] || [];
    return bookHadiths.find(hadith => hadith.hadith_number === hadithNumber) || null;
  }

  /**
   * Get hadiths by theme
   */
  static async getHadithsByTheme(theme: string, limit: number = 20): Promise<EnhancedHadith[]> {
    await loadSampleData();
    
    const allHadiths: EnhancedHadith[] = [];
    Object.values(localHadithCache).forEach(hadiths => {
      allHadiths.push(...hadiths);
    });

    return allHadiths
      .filter(hadith => hadith.themes.includes(theme))
      .slice(0, limit);
  }

  /**
   * Get hadiths by narrator
   */
  static async getHadithsByNarrator(narrator: string, limit: number = 20): Promise<EnhancedHadith[]> {
    await loadSampleData();
    
    const allHadiths: EnhancedHadith[] = [];
    Object.values(localHadithCache).forEach(hadiths => {
      allHadiths.push(...hadiths);
    });

    return allHadiths
      .filter(hadith => hadith.narrator.toLowerCase().includes(narrator.toLowerCase()))
      .slice(0, limit);
  }

  /**
   * Get cross-references for a hadith
   */
  static async getCrossReferences(hadith: EnhancedHadith): Promise<EnhancedHadith[]> {
    await loadSampleData();
    
    const crossRefs: EnhancedHadith[] = [];
    
    for (const crossRef of hadith.cross_references) {
      const refHadith = await this.getHadithByReference(
        crossRef.book.toLowerCase().replace(/\s+/g, '-'),
        crossRef.reference.split(':').pop() || ''
      );
      if (refHadith) {
        crossRefs.push(refHadith);
      }
    }
    
    return crossRefs;
  }

  /**
   * Get book metadata
   */
  static async getBookMetadata(): Promise<BookMetadata[]> {
    await loadSampleData();
    return bookMetadataCache;
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    totalHadiths: number;
    totalBooks: number;
    authenticityDistribution: { [key: string]: number };
    themeDistribution: { [key: string]: number };
    averageQualityScore: number;
  }> {
    await loadSampleData();
    
    const allHadiths: EnhancedHadith[] = [];
    Object.values(localHadithCache).forEach(hadiths => {
      allHadiths.push(...hadiths);
    });

    const authenticityDistribution: { [key: string]: number } = {};
    const themeDistribution: { [key: string]: number } = {};
    let totalQualityScore = 0;

    allHadiths.forEach(hadith => {
      // Authenticity distribution
      authenticityDistribution[hadith.authenticity_level] = 
        (authenticityDistribution[hadith.authenticity_level] || 0) + 1;
      
      // Theme distribution
      hadith.themes.forEach(theme => {
        themeDistribution[theme] = (themeDistribution[theme] || 0) + 1;
      });
      
      // Quality score
      totalQualityScore += hadith.metadata.quality_score;
    });

    return {
      totalHadiths: allHadiths.length,
      totalBooks: Object.keys(localHadithCache).length,
      authenticityDistribution,
      themeDistribution,
      averageQualityScore: allHadiths.length > 0 ? totalQualityScore / allHadiths.length : 0
    };
  }

  /**
   * Calculate search facets
   */
  private static calculateFacets(hadiths: EnhancedHadith[]) {
    const facets = {
      books: {} as { [key: string]: number },
      themes: {} as { [key: string]: number },
      authenticity_levels: {} as { [key: string]: number },
      grades: {} as { [key: string]: number }
    };

    hadiths.forEach(hadith => {
      // Books
      facets.books[hadith.book_name] = (facets.books[hadith.book_name] || 0) + 1;
      
      // Themes
      hadith.themes.forEach(theme => {
        facets.themes[theme] = (facets.themes[theme] || 0) + 1;
      });
      
      // Authenticity levels
      facets.authenticity_levels[hadith.authenticity_level] = 
        (facets.authenticity_levels[hadith.authenticity_level] || 0) + 1;
      
      // Grades
      facets.grades[hadith.grade] = (facets.grades[hadith.grade] || 0) + 1;
    });

    return facets;
  }
}

// Export convenience functions
export const getRandomHadith = EnhancedHadithService.getRandomHadith.bind(EnhancedHadithService);
export const searchHadiths = EnhancedHadithService.searchHadiths.bind(EnhancedHadithService);
export const getHadithByReference = EnhancedHadithService.getHadithByReference.bind(EnhancedHadithService);
export const getHadithsByTheme = EnhancedHadithService.getHadithsByTheme.bind(EnhancedHadithService);
export const getHadithsByNarrator = EnhancedHadithService.getHadithsByNarrator.bind(EnhancedHadithService);
export const getCrossReferences = EnhancedHadithService.getCrossReferences.bind(EnhancedHadithService);
export const getBookMetadata = EnhancedHadithService.getBookMetadata.bind(EnhancedHadithService);
export const getStatistics = EnhancedHadithService.getStatistics.bind(EnhancedHadithService);
