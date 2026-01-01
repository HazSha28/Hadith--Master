import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

interface Hadith {
  id: string;
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
  difficulty: string;
  tags: string[];
  createdAt: Date;
  isActive: boolean;
}

interface DailyHadithSchedule {
  id: string;
  date: string;
  hadithId: string;
  featured: boolean;
  sent: boolean;
  createdAt: Date;
}

const DAILY_HADITH_KEY = 'daily_hadith';
const DAILY_HADITH_DATE_KEY = 'daily_hadith_date';

// Firebase-based daily hadith service
export const getDailyHadith = async (): Promise<Hadith> => {
  const today = new Date().toDateString();
  
  // Check if we already have a hadith for today in localStorage
  const storedHadith = localStorage.getItem(DAILY_HADITH_KEY);
  const storedDate = localStorage.getItem(DAILY_HADITH_DATE_KEY);
  
  if (storedHadith && storedDate === today) {
    try {
      return JSON.parse(storedHadith);
    } catch (error) {
      console.error('Error parsing stored hadith:', error);
    }
  }
  
  try {
    // Try to get today's scheduled hadith from Firebase
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduleRef = collection(db, "dailyHadithSchedule");
    const scheduleQuery = query(scheduleRef, where("date", "==", todayStr), limit(1));
    const scheduleSnapshot = await getDocs(scheduleQuery);
    
    if (!scheduleSnapshot.empty) {
      const scheduleDoc = scheduleSnapshot.docs[0];
      const scheduleData = scheduleDoc.data() as DailyHadithSchedule;
      
      // Get the hadith details
      const hadithDoc = await getDoc(doc(db, "hadiths", scheduleData.hadithId));
      
      if (hadithDoc.exists()) {
        const hadith = {
          id: hadithDoc.id,
          ...hadithDoc.data()
        } as Hadith;
        
        // Store in localStorage for offline access
        localStorage.setItem(DAILY_HADITH_KEY, JSON.stringify(hadith));
        localStorage.setItem(DAILY_HADITH_DATE_KEY, today);
        
        return hadith;
      }
    }
    
    // If no scheduled hadith found, get a random hadith
    const hadithsRef = collection(db, "hadiths");
    const activeQuery = query(hadithsRef, where("isActive", "==", true));
    const hadithSnapshot = await getDocs(activeQuery);
    
    if (!hadithSnapshot.empty) {
      const randomDoc = hadithSnapshot.docs[Math.floor(Math.random() * hadithSnapshot.docs.length)];
      const hadith = {
        id: randomDoc.id,
        ...randomDoc.data()
      } as Hadith;
      
      // Store in localStorage
      localStorage.setItem(DAILY_HADITH_KEY, JSON.stringify(hadith));
      localStorage.setItem(DAILY_HADITH_DATE_KEY, today);
      
      return hadith;
    }
    
    throw new Error('No hadiths found in database');
    
  } catch (error) {
    console.error('Error fetching daily hadith from Firebase:', error);
    
    // Fallback to stored hadith if available
    if (storedHadith) {
      try {
        return JSON.parse(storedHadith);
      } catch (parseError) {
        console.error('Error parsing fallback hadith:', parseError);
      }
    }
    
    // Final fallback to a default hadith
    return {
      id: 'fallback',
      arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
      english: {
        narrator: 'Umar ibn Al-Khattab',
        text: 'Verily actions are by intentions, and for every person is what he intended.'
      },
      reference: {
        book: 'Sahih al-Bukhari',
        bookNumber: 1,
        hadithNumber: 1
      },
      chapter: 'The Book of Revelation',
      category: 'faith',
      difficulty: 'beginner',
      tags: ['intention', 'faith', 'actions'],
      createdAt: new Date(),
      isActive: true
    };
  }
};

export const isDailyHadithRefreshed = (): boolean => {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(DAILY_HADITH_DATE_KEY);
  return storedDate === today;
};

export const forceRefreshDailyHadith = async (): Promise<Hadith> => {
  // Clear stored data and fetch new hadith
  localStorage.removeItem(DAILY_HADITH_KEY);
  localStorage.removeItem(DAILY_HADITH_DATE_KEY);
  return getDailyHadith();
};

// Additional Firebase functions for hadith management
export const getAllHadiths = async (): Promise<Hadith[]> => {
  try {
    const hadithsRef = collection(db, "hadiths");
    const querySnapshot = await getDocs(hadithsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hadith[];
  } catch (error) {
    console.error('Error fetching all hadiths:', error);
    return [];
  }
};

export const getHadithsByCategory = async (category: string): Promise<Hadith[]> => {
  try {
    const hadithsRef = collection(db, "hadiths");
    const q = query(hadithsRef, where("category", "==", category), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hadith[];
  } catch (error) {
    console.error('Error fetching hadiths by category:', error);
    return [];
  }
};

export const getHadithsByDifficulty = async (difficulty: string): Promise<Hadith[]> => {
  try {
    const hadithsRef = collection(db, "hadiths");
    const q = query(hadithsRef, where("difficulty", "==", difficulty), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hadith[];
  } catch (error) {
    console.error('Error fetching hadiths by difficulty:', error);
    return [];
  }
};

export const searchHadiths = async (searchTerm: string): Promise<Hadith[]> => {
  try {
    // For now, get all active hadiths and filter client-side
    // In a production app, you'd want to implement proper full-text search
    const hadithsRef = collection(db, "hadiths");
    const q = query(hadithsRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    
    const allHadiths = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Hadith[];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allHadiths.filter(hadith => 
      hadith.arabic.toLowerCase().includes(lowerSearchTerm) ||
      hadith.english.text.toLowerCase().includes(lowerSearchTerm) ||
      hadith.english.narrator.toLowerCase().includes(lowerSearchTerm) ||
      hadith.reference.book.toLowerCase().includes(lowerSearchTerm) ||
      hadith.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  } catch (error) {
    console.error('Error searching hadiths:', error);
    return [];
  }
};
