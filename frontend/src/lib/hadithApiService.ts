import { doc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

export interface Hadith {
  id: string;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: string;
    hadith: string;
  };
  book: string;
  chapter: string;
  category: string;
  difficulty: string;
  tags: string[];
  createdAt: any;
}

export interface Book {
  id: string;
  name: string;
  fullName: string;
  author: string;
  totalHadiths: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  hadithCount: number;
}

// API Base URL - using our local API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

// Get all hadiths with pagination and filtering
export async function getHadiths(params: {
  page?: number;
  limit?: number;
  book?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  search?: string;
} = {}): Promise<{ hadiths: Hadith[]; pagination: any }> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.book) searchParams.set('book', params.book);
  if (params.category) searchParams.set('category', params.category);
  if (params.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params.tags) searchParams.set('tags', params.tags.join(','));
  if (params.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const endpoint = `/api/hadith${queryString ? `?${queryString}` : ''}`;

  const response = await apiCall(endpoint);
  return response.data;
}

// Get specific hadith by ID
export async function getHadithById(id: string): Promise<Hadith | null> {
  try {
    const response = await apiCall(`/api/hadith/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hadith by ID:', error);
    return null;
  }
}

// Search hadiths
export async function searchHadiths(query: string, filters: {
  book?: string;
  category?: string;
  difficulty?: string;
  narrator?: string;
  tags?: string[];
  page?: number;
  limit?: number;
} = {}): Promise<{ hadiths: Hadith[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  searchParams.set('q', query);

  if (filters.book) searchParams.set('book', filters.book);
  if (filters.category) searchParams.set('category', filters.category);
  if (filters.difficulty) searchParams.set('difficulty', filters.difficulty);
  if (filters.narrator) searchParams.set('narrator', filters.narrator);
  if (filters.tags) searchParams.set('tags', filters.tags.join(','));
  if (filters.page) searchParams.set('page', filters.page.toString());
  if (filters.limit) searchParams.set('limit', filters.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/api/hadith/search${queryString ? `?${queryString}` : ''}`;

  const response = await apiCall(endpoint);
  return response.data;
}

// AI Search hadiths (Agentic AI)
export async function searchHadithsAi(query: string, filters: {
  book?: string;
  category?: string;
} = {}): Promise<{ success: boolean; answer: string; sources: any[] }> {
  return apiCall('/api/hadith/search/ai', {
    method: 'POST',
    body: JSON.stringify({ q: query, filters }),
  });
}

// Get random hadiths
export async function getRandomHadiths(count: number = 1): Promise<Hadith[]> {
  const response = await apiCall(`/api/hadith/random?count=${count}`);
  return response.data;
}

// Get all books
export async function getBooks(): Promise<Book[]> {
  const response = await apiCall('/api/hadith/books');
  return response.data;
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const response = await apiCall('/api/hadith/categories');
  return response.data;
}

// Get hadiths by book
export async function getHadithsByBook(bookId: string, params: {
  page?: number;
  limit?: number;
} = {}): Promise<{ hadiths: Hadith[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  searchParams.set('book', bookId);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/api/hadith${queryString ? `?${queryString}` : ''}`;

  const response = await apiCall(endpoint);
  return response.data;
}

// Get hadiths by category
export async function getHadithsByCategory(categoryName: string, params: {
  page?: number;
  limit?: number;
} = {}): Promise<{ hadiths: Hadith[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  searchParams.set('category', categoryName);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/api/hadith${queryString ? `?${queryString}` : ''}`;

  const response = await apiCall(endpoint);
  return response.data;
}

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await apiCall('/health');
    return response.success;
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return false;
  }
}

// Fallback functions for when API is not available
export async function getFallbackHadiths(): Promise<Hadith[]> {
  return [
    {
      id: '1',
      arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
      english: {
        narrator: 'Umar ibn Al-Khattab',
        text: 'Verily actions are by intentions, and for every person is what he intended.'
      },
      reference: {
        book: 'Sahih al-Bukhari',
        hadith: '1'
      },
      book: 'Sahih al-Bukhari',
      chapter: 'The Book of Revelation',
      category: 'General',
      difficulty: 'Easy',
      tags: ['intention', 'actions', 'faith'],
      createdAt: new Date()
    },
    {
      id: '2',
      arabic: 'مَنْ حَدَّثَ عَنِّي حَدِيثًا يَرَى أَنَّهُ كَذِبٌ فَهُوَ أَحَدُّ الْكَاذِبِينَ',
      english: {
        narrator: 'Al-Mughirah ibn Shu\'bah',
        text: 'Whoever tells a lie about me, let him take his seat in Hellfire.'
      },
      reference: {
        book: 'Sahih al-Bukhari',
        hadith: '110'
      },
      book: 'Sahih al-Bukhari',
      chapter: 'The Book of Knowledge',
      category: 'Ethics',
      difficulty: 'Medium',
      tags: ['lying', 'prophet', 'hellfire'],
      createdAt: new Date()
    }
  ];
}
