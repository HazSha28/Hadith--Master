// Enhanced Hadith Data Structure for Complete Dataset
// Meets all requirements for authentic hadith collection and storage

/**
 * Complete Hadith Data Structure
 * Follows the strict requirements specified for authentic hadith collection
 */
export const HadithDataStructure = {
  // Mandatory fields for each hadith
  required: {
    book_name: "",           // e.g., "Sahih al-Bukhari"
    book_id: "",            // e.g., "bukhari"
    hadith_number: "",      // Original hadith number
    kitab: "",              // Chapter/Book name in original
    bab: "",                // Section/topic
    arabic_text: "",        // Original Arabic text (exact)
    english_translation: "", // Authentic English translation
    urdu_translation: "",   // Urdu translation
    narrator: "",           // Chain narrator
    isnad: "",             // Full chain of transmission
    matn: "",              // Text content of hadith
    grade: "",             // Sahih/Hasan/Da'if
    scholar_verification: "", // Scholar verification notes
    themes: [],            // Thematic classification
    keywords: [],           // Search keywords
    authenticity_level: "", // Overall authenticity rating
    source_reference: "",   // Complete reference
    cross_references: []    // References to same hadith in other books
  },

  // Metadata for tracking
  metadata: {
    verification_required: false, // Flag for disputed content
    processing_status: "pending", // Processing status
    last_updated: null,          // Last update timestamp
    source_api: "",              // Source API used
    batch_id: "",               // Batch processing ID
    quality_score: 0            // Data quality score (0-100)
  }
};

/**
 * Book Collection Configuration
 * Each book gets its own collection/table
 */
export const BookCollections = {
  "sahih-al-bukhari": {
    name: "Sahih al-Bukhari",
    total_hadiths: 7563,
    authenticity: "Most authentic collection",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/bukhari.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari"
    },
    themes: [
      "faith", "prayer", "charity", "fasting", "pilgrimage", 
      "business", "marriage", "manners", "knowledge", "character"
    ]
  },
  
  "sahih-muslim": {
    name: "Sahih Muslim", 
    total_hadiths: 7190,
    authenticity: "Second most authentic collection",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/muslim.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-muslim"
    },
    themes: [
      "faith", "purification", "prayer", "zakat", "fasting", 
      "pilgrimage", "marriage", "business", "manners", "character"
    ]
  },

  "sunan-abu-dawud": {
    name: "Sunan Abu Dawud",
    total_hadiths: 5274,
    authenticity: "Focus: Legal traditions & jurisprudence",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/abudawud.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud"
    },
    themes: [
      "jurisprudence", "worship", "transactions", "marriage", 
      "crime", "judiciary", "warfare", "sacrifice", "food", "medicine"
    ]
  },

  "jami-at-tirmidhi": {
    name: "Jamiʿ at-Tirmidhi",
    total_hadiths: 3956,
    authenticity: "Includes juristic commentary",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/tirmidhi.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-tirmidhi"
    },
    themes: [
      "jurisprudence", "hadith_science", "biography", "virtues", 
      "manners", "interpretation", "scholarship", "character"
    ]
  },

  "sunan-an-nasai": {
    name: "Sunan an-Nasa'i",
    total_hadiths: 5761,
    authenticity: "Known for strict authentication",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/nasai.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-nasai"
    },
    themes: [
      "purification", "prayer", "mosques", "funerals", "zakat", 
      "fasting", "pilgrimage", "marriage", "business", "medicine"
    ]
  },

  "sunan-ibn-majah": {
    name: "Sunan Ibn Majah",
    total_hadiths: 4341,
    authenticity: "Covers all aspects of life",
    api_endpoints: {
      ahmedbaset: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/ibnmajah.json",
      fawazahmed: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-ibnmajah"
    },
    themes: [
      "introduction", "faith", "prayer", "mosques", "funerals", 
      "zakat", "fasting", "pilgrimage", "marriage", "business"
    ]
  }
};

/**
 * Theme Classification System
 * Comprehensive categorization for search optimization
 */
export const ThemeClassification = {
  // Core Islamic themes
  core_islam: [
    "faith", "tawhid", "shirk", "iman", "islam", "ihsan", 
    "quran", "prophethood", "hereafter", "destiny"
  ],
  
  // Worship practices
  worship: [
    "prayer", "salah", "wudu", "mosque", "jumuah", "congregation",
    "fasting", "ramadan", "taraweeh", "zakat", "sadaqah", 
    "pilgrimage", "hajj", "umrah", "sacrifice"
  ],
  
  // Personal conduct
  character: [
    "manners", "etiquette", "honesty", "truthfulness", "patience",
    "gratitude", "humility", "forgiveness", "kindness", "generosity"
  ],
  
  // Social matters
  social: [
    "family", "marriage", "divorce", "parenting", "children",
    "neighbors", "friendship", "brotherhood", "community", "leadership"
  ],
  
  // Economic matters
  economic: [
    "business", "trade", "transactions", "contracts", "interest",
    "debt", "inheritance", "wealth", "poverty", "charity"
  ],
  
  // Legal matters
  legal: [
    "jurisprudence", "fiqh", "judiciary", "testimony", "witnesses",
    "punishment", "crime", "justice", "rights", "disputes"
  ],
  
  // Knowledge and education
  knowledge: [
    "education", "learning", "scholarship", "teaching", "books",
    "wisdom", "counsel", "remembrance", "reflection", "contemplation"
  ],
  
  // Health and wellness
  health: [
    "medicine", "health", "sickness", "treatment", "prevention",
    "diet", "nutrition", "hygiene", "mental_health", "wellbeing"
  ]
};

/**
 * Authenticity Levels
 * Standard classification system
 */
export const AuthenticityLevels = {
  SAHIH: {
    level: "Sahih",
    description: "Authentic - The highest level of authenticity",
    criteria: ["Continuous chain", "Reliable narrators", "No contradictions", "Free from defects"]
  },
  
  HASAN: {
    level: "Hasan", 
    description: "Good - Acceptable but with minor weaknesses",
    criteria: ["Mostly reliable narrators", "Minor issues in chain", "Generally accepted"]
  },
  
  DAEF: {
    level: "Da'if",
    description: "Weak - Has significant weaknesses in chain",
    criteria: ["Unreliable narrators", "Gaps in chain", "Contradictions", "Defects present"]
  },
  
  MAUDU: {
    level: "Maudu'",
    description: "Fabricated - False attribution to Prophet",
    criteria: ["Known fabricators", "Impossible content", "Contradicts Quran"]
  }
};

/**
 * Cross-Reference Configuration
 * For linking hadiths across different books
 */
export const CrossReferenceConfig = {
  // Similar hadiths that appear in multiple books
  common_hadiths: [
    {
      theme: "intentions",
      bukhari: "1:1",
      muslim: "33:4705",
      description: "Actions are judged by intentions"
    },
    {
      theme: "faith_branches",
      bukhari: "2:37", 
      muslim: "1:63",
      description: "Faith has seventy-something branches"
    },
    {
      theme: "muslim_definition",
      bukhari: "2:9",
      muslim: "1:45",
      description: "Muslim is one from whom others are safe"
    }
  ],
  
  // Narrator-based cross-references
  narrator_patterns: {
    "Abu Hurairah": ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah"],
    "Aisha": ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai"],
    "Umar ibn Khattab": ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai"],
    "Ibn Abbas": ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah"]
  }
};

export default {
  HadithDataStructure,
  BookCollections,
  ThemeClassification,
  AuthenticityLevels,
  CrossReferenceConfig
};
