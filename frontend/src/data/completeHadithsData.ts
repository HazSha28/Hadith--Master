// Complete Hadiths Data for Frontend
// This file contains authentic hadiths from all six canonical books

export interface HadithData {
  id: number;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: string;
    bookNumber: number;
    hadithNumber: number;
  };
  chapter: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface BookMetadata {
  name: string;
  fullName: string;
  author: string;
  description: string;
  totalHadiths: number;
  categories: string[];
  difficulty: string;
  language: string;
  year: string;
  compiler: string;
}

export interface CategoryData {
  name: string;
  description: string;
  difficulty: string;
}

export interface DifficultyLevel {
  level: string;
  description: string;
  color: string;
}

// Complete hadiths dataset
export const completeHadithsDataset: HadithData[] = [
  // SAHIH AL-BUKHARI HADITHS
  {
    id: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    english: {
      narrator: "Umar ibn Al-Khattab",
      text: "Verily actions are by intentions, and for every person is what he intended."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 1,
      hadithNumber: 1
    },
    chapter: "The Book of Revelation",
    category: "faith",
    difficulty: "beginner",
    tags: ["intention", "faith", "actions"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 2,
    arabic: "الْإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً",
    english: {
      narrator: "Abu Hurairah",
      text: "Faith has seventy-something branches, the highest of which is saying 'La ilaha illallah' and the lowest of which is removing something harmful from the road."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 2,
      hadithNumber: 37
    },
    chapter: "The Book of Faith",
    category: "faith",
    difficulty: "beginner",
    tags: ["faith", "branches", "charity"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 3,
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "The Muslim is the one from whose tongue and hand the Muslims are safe."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 2,
      hadithNumber: 9
    },
    chapter: "The Book of Faith",
    category: "manners",
    difficulty: "beginner",
    tags: ["muslim", "safety", "character"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 4,
    arabic: "إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ",
    english: {
      narrator: "Abu Hurairah",
      text: "When you stand for prayer, wash your faces and your forearms up to the elbows, wipe your heads, and wash your feet up to the ankles."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 4,
      hadithNumber: 6
    },
    chapter: "The Book of Ablution",
    category: "worship",
    difficulty: "beginner",
    tags: ["wudu", "prayer", "purification"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 5,
    arabic: "مَنْ صَلَّى صَلَاةَ الصُّبْحِ فِي جَمَاعَةٍ فَهُوَ فِي ذِمَّةِ اللَّهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Whoever prays the morning prayer in congregation is under the protection of Allah."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 11,
      hadithNumber: 6
    },
    chapter: "The Book of Prayer Times",
    category: "prayer",
    difficulty: "intermediate",
    tags: ["prayer", "congregation", "protection"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 6,
    arabic: "الصِّيَامُ جُنَّةٌ",
    english: {
      narrator: "Abu Hurairah",
      text: "Fasting is a shield."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 30,
      hadithNumber: 11
    },
    chapter: "The Book of Fasting",
    category: "fasting",
    difficulty: "beginner",
    tags: ["fasting", "protection", "ramadan"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 7,
    arabic: "مَنْ أَنْفَقَ زَوْجَيْنِ فِي سَبِيلِ اللَّهِ نُودِيَ مِنْ أَبْوَابِ الْجَنَّةِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Whoever spends two pairs (of anything) in the cause of Allah will be called from the gates of Paradise."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 52,
      hadithNumber: 12
    },
    chapter: "The Book of Jihad",
    category: "charity",
    difficulty: "intermediate",
    tags: ["charity", "jannah", "spending"],
    createdAt: new Date(),
    isActive: true
  },

  // SAHIH MUSLIM HADITHS
  {
    id: 8,
    arabic: "إِذَا قَالَ أَحَدُكُمْ آمِينَ وَقَالَتِ الْمَلَائِكَةُ فِي السَّمَاءِ آمِينَ",
    english: {
      narrator: "Abu Hurairah",
      text: "When one of you says Amin and the angels in the heavens say Amin, and they coincide, his past sins will be forgiven."
    },
    reference: {
      book: "Sahih Muslim",
      bookNumber: 1,
      hadithNumber: 410
    },
    chapter: "The Book of Prayer",
    category: "prayer",
    difficulty: "beginner",
    tags: ["prayer", "amen", "forgiveness"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 9,
    arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    english: {
      narrator: "Abu Dharr",
      text: "Your smiling in the face of your brother is charity."
    },
    reference: {
      book: "Sahih Muslim",
      bookNumber: 5,
      hadithNumber: 2664
    },
    chapter: "The Book of Charity",
    category: "charity",
    difficulty: "beginner",
    tags: ["charity", "smile", "brotherhood"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 10,
    arabic: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
    english: {
      narrator: "Abu Malik al-Ash'ari",
      text: "Purity is half of faith."
    },
    reference: {
      book: "Sahih Muslim",
      bookNumber: 1,
      hadithNumber: 223
    },
    chapter: "The Book of Faith",
    category: "faith",
    difficulty: "beginner",
    tags: ["purity", "faith", "cleanliness"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 11,
    arabic: "مَنْ أَصْبَحَ مِنْكُمْ آمِنًا فِي سِرْبِهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Whoever among you wakes up in the morning secure in his dwelling, healthy in his body, and has his food for the day, it is as if the whole world has been gathered for him."
    },
    reference: {
      book: "Sahih Muslim",
      bookNumber: 8,
      hadithNumber: 3187
    },
    chapter: "The Book of Remembrance",
    category: "gratitude",
    difficulty: "intermediate",
    tags: ["gratitude", "blessings", "security"],
    createdAt: new Date(),
    isActive: true
  },

  // SUNAN ABU DAWUD HADITHS
  {
    id: 12,
    arabic: "سَيِّدُ الْقَوْمِ خَادِمُهُمْ",
    english: {
      narrator: "Abu Qatadah",
      text: "The leader of a people is their servant."
    },
    reference: {
      book: "Sunan Abu Dawud",
      bookNumber: 42,
      hadithNumber: 5143
    },
    chapter: "The Book of Manners",
    category: "leadership",
    difficulty: "intermediate",
    tags: ["leadership", "service", "humility"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 13,
    arabic: "الْبِرُّ حُسْنُ الْخُلُقِ",
    english: {
      narrator: "Abu al-Darda",
      text: "Righteousness is good character."
    },
    reference: {
      book: "Sunan Abu Dawud",
      bookNumber: 42,
      hadithNumber: 4781
    },
    chapter: "The Book of Manners",
    category: "character",
    difficulty: "beginner",
    tags: ["character", "righteousness", "ethics"],
    createdAt: new Date(),
    isActive: true
  },

  // JAMI' AT-TIRMIDHI HADITHS
  {
    id: 14,
    arabic: "مَنْ حَسُنَ إِسْلَامُ الْمَرْءِ كَانَ تَرْكُهُ مَا لَا يَعْنِيهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Part of the perfection of a person's Islam is their leaving aside that which does not concern them."
    },
    reference: {
      book: "Jami' at-Tirmidhi",
      bookNumber: 37,
      hadithNumber: 2786
    },
    chapter: "The Book of Manners",
    category: "manners",
    difficulty: "beginner",
    tags: ["manners", "perfection", "islam"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 15,
    arabic: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
    english: {
      narrator: "Abu Hurairah",
      text: "The world is a prison for the believer and a paradise for the disbeliever."
    },
    reference: {
      book: "Jami' at-Tirmidhi",
      bookNumber: 39,
      hadithNumber: 2324
    },
    chapter: "The Book of Zuhd",
    category: "worldly",
    difficulty: "intermediate",
    tags: ["world", "paradise", "prison"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 16,
    arabic: "لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Wealth is not in abundance of goods, but wealth is in contentment of the soul."
    },
    reference: {
      book: "Jami' at-Tirmidhi",
      bookNumber: 35,
      hadithNumber: 2373
    },
    chapter: "The Book of Zuhd",
    category: "wealth",
    difficulty: "intermediate",
    tags: ["wealth", "contentment", "soul"],
    createdAt: new Date(),
    isActive: true
  },

  // SUNAN AN-NASA'I HADITHS
  {
    id: 17,
    arabic: "الْمُؤْمِنُ الَّذِي يُخَالِطُ النَّاسَ وَيَصْبِرُ عَلَى أَذَاهُمْ",
    english: {
      narrator: "Ibn Umar",
      text: "The believer who mixes with people and patiently endures their harm is better than the believer who does not mix with people and does not patiently endure their harm."
    },
    reference: {
      book: "Sunan an-Nasa'i",
      bookNumber: 8,
      hadithNumber: 103
    },
    chapter: "The Book of Manners",
    category: "social",
    difficulty: "intermediate",
    tags: ["social", "patience", "interaction"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 18,
    arabic: "مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً",
    english: {
      narrator: "Abu Hurairah",
      text: "Whoever sends blessings upon me once, Allah will send blessings upon him ten times."
    },
    reference: {
      book: "Sunan an-Nasa'i",
      bookNumber: 43,
      hadithNumber: 24
    },
    chapter: "The Book of Prayer",
    category: "prayer",
    difficulty: "beginner",
    tags: ["blessings", "prayer", "prophet"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 19,
    arabic: "إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَمَلُهُ",
    english: {
      narrator: "Abu Hurairah",
      text: "When a person dies, his deeds come to an end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him."
    },
    reference: {
      book: "Sunan an-Nasa'i",
      bookNumber: 36,
      hadithNumber: 3651
    },
    chapter: "The Book of Charity",
    category: "legacy",
    difficulty: "intermediate",
    tags: ["legacy", "charity", "knowledge", "children"],
    createdAt: new Date(),
    isActive: true
  },

  // SUNAN IBN MAJAH HADITHS
  {
    id: 20,
    arabic: "الْمُسْلِمُ أَخُو الْمُسْلِمِ",
    english: {
      narrator: "Anas ibn Malik",
      text: "The Muslim is the brother of the Muslim. He does not betray him, lie to him, or forsake him."
    },
    reference: {
      book: "Sunan Ibn Majah",
      bookNumber: 36,
      hadithNumber: 3932
    },
    chapter: "The Book of Manners",
    category: "brotherhood",
    difficulty: "beginner",
    tags: ["brotherhood", "trust", "loyalty"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 21,
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا",
    english: {
      narrator: "Abu Hurairah",
      text: "Whoever takes a path seeking knowledge, Allah will make easy for him a path to Paradise."
    },
    reference: {
      book: "Sunan Ibn Majah",
      bookNumber: 1,
      hadithNumber: 225
    },
    chapter: "The Book of Knowledge",
    category: "knowledge",
    difficulty: "beginner",
    tags: ["knowledge", "paradise", "learning"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 22,
    arabic: "اتَّقُوا اللَّهَ وَاصْلِحُوا ذَاتَ بَيْنِكُمْ",
    english: {
      narrator: "Abu Ayyub al-Ansari",
      text: "Fear Allah and reconcile among yourselves, for indeed I make my will among you that you should fear Allah and reconcile among yourselves."
    },
    reference: {
      book: "Sunan Ibn Majah",
      bookNumber: 36,
      hadithNumber: 3937
    },
    chapter: "The Book of Manners",
    category: "reconciliation",
    difficulty: "intermediate",
    tags: ["reconciliation", "unity", "fear of Allah"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 23,
    arabic: "الدُّعَاءُ هُوَ الْعِبَادَةُ",
    english: {
      narrator: "An-Nu'man ibn Bashir",
      text: "Supplication is worship."
    },
    reference: {
      book: "Sunan Ibn Majah",
      bookNumber: 38,
      hadithNumber: 3828
    },
    chapter: "The Book of Supplication",
    category: "supplication",
    difficulty: "beginner",
    tags: ["supplication", "worship", "dua"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 24,
    arabic: "إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا",
    english: {
      narrator: "Abu Hurairah",
      text: "Indeed, Allah has ninety-nine names. Whoever enumerates them will enter Paradise."
    },
    reference: {
      book: "Sunan Ibn Majah",
      bookNumber: 38,
      hadithNumber: 3866
    },
    chapter: "The Book of Supplication",
    category: "allah",
    difficulty: "intermediate",
    tags: ["allah", "names", "paradise"],
    createdAt: new Date(),
    isActive: true
  }
];

// Book metadata
export const booksMetadata: BookMetadata[] = [
  {
    name: "Sahih al-Bukhari",
    fullName: "Sahih al-Bukhari",
    author: "Imam Muhammad ibn Ismail al-Bukhari",
    description: "Most authentic collection of hadiths",
    totalHadiths: 7563,
    categories: ["faith", "prayer", "fasting", "charity", "pilgrimage", "marriage", "business"],
    difficulty: "beginner",
    language: "Arabic",
    year: "846 CE",
    compiler: "Imam al-Bukhari"
  },
  {
    name: "Sahih Muslim",
    fullName: "Sahih Muslim",
    author: "Imam Muslim ibn al-Hajjaj al-Nisaburi",
    description: "Second most authentic collection",
    totalHadiths: 7190,
    categories: ["faith", "prayer", "purification", "charity", "fasting", "pilgrimage"],
    difficulty: "beginner",
    language: "Arabic",
    year: "847 CE",
    compiler: "Imam Muslim"
  },
  {
    name: "Sunan Abu Dawud",
    fullName: "Sunan Abu Dawud",
    author: "Imam Abu Dawud al-Sijistani",
    description: "Focus on legal traditions and jurisprudence",
    totalHadiths: 5274,
    categories: ["jurisprudence", "prayer", "charity", "manners", "marriage", "trade"],
    difficulty: "intermediate",
    language: "Arabic",
    year: "848 CE",
    compiler: "Imam Abu Dawud"
  },
  {
    name: "Jami' at-Tirmidhi",
    fullName: "Jami' at-Tirmidhi",
    author: "Imam al-Tirmidhi",
    description: "Comprehensive collection with juristic analysis",
    totalHadiths: 3956,
    categories: ["faith", "manners", "jurisprudence", "character", "spirituality"],
    difficulty: "intermediate",
    language: "Arabic",
    year: "849 CE",
    compiler: "Imam al-Tirmidhi"
  },
  {
    name: "Sunan an-Nasa'i",
    fullName: "Sunan an-Nasa'i",
    author: "Imam an-Nasa'i",
    description: "Rigorous authentication and detailed chains",
    totalHadiths: 5761,
    categories: ["prayer", "purification", "charity", "manners", "jurisprudence"],
    difficulty: "intermediate",
    language: "Arabic",
    year: "850 CE",
    compiler: "Imam an-Nasa'i"
  },
  {
    name: "Sunan Ibn Majah",
    fullName: "Sunan Ibn Majah",
    author: "Imam Ibn Majah",
    description: "Complete collection covering all aspects of life",
    totalHadiths: 4341,
    categories: ["knowledge", "manners", "supplication", "character", "jurisprudence"],
    difficulty: "intermediate",
    language: "Arabic",
    year: "851 CE",
    compiler: "Imam Ibn Majah"
  }
];

// Categories
export const hadithCategories: CategoryData[] = [
  { name: "faith", description: "Hadiths about belief, faith, and creed", difficulty: "beginner" },
  { name: "prayer", description: "Hadiths about salah and worship", difficulty: "beginner" },
  { name: "charity", description: "Hadiths about sadaqah and generosity", difficulty: "beginner" },
  { name: "manners", description: "Hadiths about etiquette and character", difficulty: "beginner" },
  { name: "fasting", description: "Hadiths about Ramadan and fasting", difficulty: "intermediate" },
  { name: "pilgrimage", description: "Hadiths about Hajj and Umrah", difficulty: "intermediate" },
  { name: "marriage", description: "Hadiths about family and relationships", difficulty: "intermediate" },
  { name: "business", description: "Hadiths about trade and economics", difficulty: "intermediate" },
  { name: "jurisprudence", description: "Hadiths about Islamic law", difficulty: "advanced" },
  { name: "spirituality", description: "Hadiths about spiritual development", difficulty: "advanced" },
  { name: "knowledge", description: "Hadiths about seeking and teaching knowledge", difficulty: "beginner" },
  { name: "supplication", description: "Hadiths about dua and remembrance", difficulty: "beginner" },
  { name: "worship", description: "Hadiths about acts of worship", difficulty: "beginner" },
  { name: "character", description: "Hadiths about moral character", difficulty: "beginner" },
  { name: "leadership", description: "Hadiths about leadership and governance", difficulty: "intermediate" },
  { name: "social", description: "Hadiths about social interactions", difficulty: "intermediate" },
  { name: "legacy", description: "Hadiths about legacy and continuity", difficulty: "intermediate" },
  { name: "brotherhood", description: "Hadiths about brotherhood and unity", difficulty: "beginner" },
  { name: "reconciliation", description: "Hadiths about making peace", difficulty: "intermediate" },
  { name: "gratitude", description: "Hadiths about thankfulness", difficulty: "intermediate" },
  { name: "worldly", description: "Hadiths about worldly matters", difficulty: "intermediate" },
  { name: "wealth", description: "Hadiths about wealth and poverty", difficulty: "intermediate" },
  { name: "allah", description: "Hadiths about Allah's names and attributes", difficulty: "advanced" }
];

// Difficulty levels
export const difficultyLevels: DifficultyLevel[] = [
  { level: "beginner", description: "Easy to understand and practice", color: "green" },
  { level: "intermediate", description: "Requires some background knowledge", color: "yellow" },
  { level: "advanced", description: "Complex topics requiring scholarly guidance", color: "red" }
];

// Helper functions
export const getHadithsByBook = (bookName: string): HadithData[] => {
  return completeHadithsDataset.filter(hadith => hadith.reference.book === bookName);
};

export const getHadithsByCategory = (category: string): HadithData[] => {
  return completeHadithsDataset.filter(hadith => hadith.category === category);
};

export const getHadithsByDifficulty = (difficulty: string): HadithData[] => {
  return completeHadithsDataset.filter(hadith => hadith.difficulty === difficulty);
};

export const searchHadiths = (searchTerm: string): HadithData[] => {
  const term = searchTerm.toLowerCase();
  return completeHadithsDataset.filter(hadith => 
    hadith.arabic.includes(searchTerm) ||
    hadith.english.text.toLowerCase().includes(term) ||
    hadith.english.narrator.toLowerCase().includes(term) ||
    hadith.reference.book.toLowerCase().includes(term) ||
    hadith.chapter.toLowerCase().includes(term) ||
    hadith.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

export const getRandomHadith = (bookName?: string): HadithData => {
  const hadiths = bookName ? getHadithsByBook(bookName) : completeHadithsDataset;
  return hadiths[Math.floor(Math.random() * hadiths.length)];
};

export const getUniqueBooks = (): string[] => {
  return [...new Set(completeHadithsDataset.map(hadith => hadith.reference.book))];
};

export const getUniqueCategories = (): string[] => {
  return [...new Set(completeHadithsDataset.map(hadith => hadith.category))];
};

export const getUniqueTags = (): string[] => {
  const allTags = completeHadithsDataset.flatMap(hadith => hadith.tags);
  return [...new Set(allTags)];
};
