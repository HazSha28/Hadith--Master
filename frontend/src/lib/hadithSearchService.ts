import { collection, query, where, getDocs, limit, startAfter, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export interface Hadith {
  id: string;
  text: string;
  narrator: string;
  book: string;
  category: string;
  arabic?: string;
  reference?: {
    book: string;
    hadith: number;
  };
  authenticity?: string;
}

export interface SearchFilters {
  narrator?: string;
  book?: string;
  category?: string;
  authenticity?: string;
}

export interface SearchResult {
  hadiths: Hadith[];
  total: number;
  hasMore: boolean;
  lastVisible?: DocumentData;
}

/**
 * Optimized search service for Hadith data with filters
 * Handles large datasets efficiently with pagination and indexing
 */
export class HadithSearchService {
  public static readonly PAGE_SIZE = 20;
  private static readonly MAX_RESULTS = 1000;

  /**
   * Main search function that combines keyword search with filters
   */
  static async searchHadiths(
    keyword: string = '',
    filters: SearchFilters = {},
    page: number = 1,
    lastVisible?: DocumentData
  ): Promise<SearchResult> {
    try {
      // Validate inputs
      if (page < 1) throw new Error('Page must be greater than 0');
      
      // Build search query
      const searchQuery = this.buildSearchQuery(keyword, filters, lastVisible);
      
      // Execute query
      const snapshot = await getDocs(searchQuery);
      
      // Process results
      const hadiths = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hadith[];

      // Apply client-side filtering for complex keyword search
      const filteredHadiths = this.applyClientSideFiltering(hadiths, keyword, filters);

      return {
        hadiths: filteredHadiths,
        total: filteredHadiths.length,
        hasMore: snapshot.docs.length === this.PAGE_SIZE,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search hadiths');
    }
  }

  /**
   * Build Firestore query with filters
   */
  private static buildSearchQuery(
    keyword: string,
    filters: SearchFilters,
    lastVisible?: DocumentData
  ) {
    const hadithsRef = collection(db, 'hadiths');
    let queryBuilder = query(hadithsRef, limit(this.PAGE_SIZE));

    // Add filter conditions
    if (filters.book && filters.book !== '') {
      queryBuilder = query(queryBuilder, where('book', '==', filters.book));
    }

    if (filters.narrator && filters.narrator !== '') {
      queryBuilder = query(queryBuilder, where('narrator', '==', filters.narrator));
    }

    if (filters.category && filters.category !== '') {
      queryBuilder = query(queryBuilder, where('category', '==', filters.category));
    }

    if (filters.authenticity && filters.authenticity !== '') {
      queryBuilder = query(queryBuilder, where('authenticity', '==', filters.authenticity));
    }

    // Add pagination
    if (lastVisible) {
      queryBuilder = query(queryBuilder, startAfter(lastVisible));
    }

    return queryBuilder;
  }

  /**
   * Apply client-side filtering for keyword search and complex conditions
   */
  private static applyClientSideFiltering(
    hadiths: Hadith[],
    keyword: string,
    filters: SearchFilters
  ): Hadith[] {
    return hadiths.filter(hadith => {
      // Keyword search (case-insensitive)
      if (keyword && keyword.trim() !== '') {
        const searchTerm = keyword.toLowerCase().trim();
        const textMatch = hadith.text?.toLowerCase().includes(searchTerm);
        const narratorMatch = hadith.narrator?.toLowerCase().includes(searchTerm);
        const bookMatch = hadith.book?.toLowerCase().includes(searchTerm);
        const categoryMatch = hadith.category?.toLowerCase().includes(searchTerm);
        const arabicMatch = hadith.arabic?.includes(searchTerm);

        if (!textMatch && !narratorMatch && !bookMatch && !categoryMatch && !arabicMatch) {
          return false;
        }
      }

      // Additional client-side filtering for partial matches
      if (filters.narrator && filters.narrator !== '') {
        if (!hadith.narrator?.toLowerCase().includes(filters.narrator.toLowerCase())) {
          return false;
        }
      }

      if (filters.book && filters.book !== '') {
        if (!hadith.book?.toLowerCase().includes(filters.book.toLowerCase())) {
          return false;
        }
      }

      if (filters.category && filters.category !== '') {
        if (!hadith.category?.toLowerCase().includes(filters.category.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get filter options for dropdowns
   */
  static async getFilterOptions(): Promise<{
    narrators: string[];
    books: string[];
    categories: string[];
    authenticities: string[];
  }> {
    try {
      // Get unique values from Firestore
      const [narratorsSnapshot, booksSnapshot, categoriesSnapshot, authenticitiesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'hadiths'), limit(1000))),
        getDocs(query(collection(db, 'hadiths'), limit(1000))),
        getDocs(query(collection(db, 'hadiths'), limit(1000))),
        getDocs(query(collection(db, 'hadiths'), limit(1000)))
      ]);

      // Extract unique values
      const narrators = [...new Set(
        narratorsSnapshot.docs.map(doc => doc.data().narrator).filter(Boolean)
      )].sort();

      const books = [...new Set(
        booksSnapshot.docs.map(doc => doc.data().book).filter(Boolean)
      )].sort();

      const categories = [...new Set(
        categoriesSnapshot.docs.map(doc => doc.data().category).filter(Boolean)
      )].sort();

      const authenticities = [...new Set(
        authenticitiesSnapshot.docs.map(doc => doc.data().authenticity).filter(Boolean)
      )].sort();

      return { narrators, books, categories, authenticities };

    } catch (error) {
      console.error('Error getting filter options:', error);
      return { narrators: [], books: [], categories: [], authenticities: [] };
    }
  }

  /**
   * Advanced search with multiple keywords and operators
   */
  static async advancedSearch(
    keywords: string[],
    operator: 'AND' | 'OR' = 'AND',
    filters: SearchFilters = {},
    page: number = 1
  ): Promise<SearchResult> {
    try {
      const keyword = keywords.join(operator === 'AND' ? ' ' : '|');
      return this.searchHadiths(keyword, filters, page);
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Failed to perform advanced search');
    }
  }

  /**
   * Get search suggestions based on partial input
   */
  static async getSearchSuggestions(partialKeyword: string): Promise<string[]> {
    if (!partialKeyword || partialKeyword.length < 2) return [];

    try {
      const snapshot = await getDocs(
        query(collection(db, 'hadiths'), limit(50))
      );

      const suggestions = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Extract words from text
        const textWords = (data.text || '').toLowerCase().split(/\s+/);
        // Extract narrator names
        const narratorWords = (data.narrator || '').toLowerCase().split(/\s+/);
        // Extract book names
        const bookWords = (data.book || '').toLowerCase().split(/\s+/);
        
        [...textWords, ...narratorWords, ...bookWords].forEach(word => {
          if (word.includes(partialKeyword.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });
      });

      return Array.from(suggestions).slice(0, 10);

    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get search statistics
   */
  static async getSearchStats(): Promise<{
    totalHadiths: number;
    totalBooks: number;
    totalNarrators: number;
    totalCategories: number;
  }> {
    try {
      const snapshot = await getDocs(query(collection(db, 'hadiths'), limit(1000)));
      
      const stats = {
        totalHadiths: snapshot.size,
        totalBooks: new Set(snapshot.docs.map(doc => doc.data().book)).size,
        totalNarrators: new Set(snapshot.docs.map(doc => doc.data().narrator)).size,
        totalCategories: new Set(snapshot.docs.map(doc => doc.data().category)).size
      };

      return stats;

    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalHadiths: 0, totalBooks: 0, totalNarrators: 0, totalCategories: 0 };
    }
  }
}
