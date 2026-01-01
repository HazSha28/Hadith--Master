import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

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
  bookName?: string;
  chapter?: string;
}

const functions = getFunctions(getApp());

export async function searchHadithsFirebase(query: string, bookId?: string, limit: number = 20): Promise<Hadith[]> {
  try {
    const searchHadiths = httpsCallable(functions, 'searchHadiths');
    const result = await searchHadiths({ query, bookId, limit });
    
    if (result.data && typeof result.data === 'object' && 'success' in result.data) {
      const response = result.data as { success: boolean; data?: Hadith[]; error?: string };
      
      if (response.success && response.data) {
        return response.data;
      } else if (response.error) {
        throw new Error(response.error);
      }
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error searching hadiths with Firebase:', error);
    throw error;
  }
}

export async function fetchRandomHadith(): Promise<Hadith> {
  try {
    const getRandomHadith = httpsCallable(functions, 'getRandomHadith');
    const result = await getRandomHadith();
    
    if (result.data && typeof result.data === 'object' && 'success' in result.data) {
      const response = result.data as { success: boolean; data?: Hadith; error?: string };
      
      if (response.success && response.data) {
        return response.data;
      } else if (response.error) {
        throw new Error(response.error);
      }
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error getting random hadith with Firebase:', error);
    throw error;
  }
}
