import { fetchRandomHadith } from "@/lib/hadithService";

interface Hadith {
  id: number;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: number;
    hadith: number;
  };
}

const DAILY_HADITH_KEY = 'daily_hadith';
const DAILY_HADITH_DATE_KEY = 'daily_hadith_date';

export const getDailyHadith = async (): Promise<Hadith> => {
  const today = new Date().toDateString(); // e.g., "Mon Dec 30 2024"
  
  // Check if we already have a hadith for today
  const storedHadith = localStorage.getItem(DAILY_HADITH_KEY);
  const storedDate = localStorage.getItem(DAILY_HADITH_DATE_KEY);
  
  if (storedHadith && storedDate === today) {
    try {
      return JSON.parse(storedHadith);
    } catch (error) {
      console.error('Error parsing stored hadith:', error);
    }
  }
  
  // If no hadith for today or date changed, fetch a new one
  try {
    const newHadith = await fetchRandomHadith();
    
    // Store the new hadith and today's date
    localStorage.setItem(DAILY_HADITH_KEY, JSON.stringify(newHadith));
    localStorage.setItem(DAILY_HADITH_DATE_KEY, today);
    
    return newHadith;
  } catch (error) {
    console.error('Error fetching daily hadith:', error);
    
    // If fetching fails, return the stored hadith if available
    if (storedHadith) {
      try {
        return JSON.parse(storedHadith);
      } catch (parseError) {
        console.error('Error parsing fallback hadith:', parseError);
      }
    }
    
    // If everything fails, throw the error
    throw error;
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
