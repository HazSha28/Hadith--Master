import { useState, useCallback } from 'react';
import { HadithSearchService, SearchFilters, SearchResult } from '../lib/hadithSearchService';

/**
 * React hook for using the Hadith search service
 */
export const useHadithSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  const search = useCallback(async (
    keyword: string,
    filters: SearchFilters,
    page: number = 1
  ) => {
    setLoading(true);
    setError(null);
    setCurrentKeyword(keyword);
    setCurrentFilters(filters);

    try {
      const searchResults = await HadithSearchService.searchHadiths(keyword, filters, page);
      
      if (page === 1) {
        setResults(searchResults);
      } else {
        // Append results for pagination
        setResults(prev => prev ? {
          ...searchResults,
          hadiths: [...prev.hadiths, ...searchResults.hadiths]
        } : searchResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!results || !results.hasMore || loading) return;

    try {
      const currentPage = Math.floor(results.hadiths.length / 20) + 1; // PAGE_SIZE = 20
      const moreResults = await HadithSearchService.searchHadiths(
        currentKeyword,
        currentFilters,
        currentPage,
        results.lastVisible
      );

      setResults(prev => prev ? {
        ...moreResults,
        hadiths: [...prev.hadiths, ...moreResults.hadiths]
      } : moreResults);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    }
  }, [results, loading, currentKeyword, currentFilters]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    setCurrentKeyword('');
    setCurrentFilters({});
  }, []);

  return {
    search,
    loadMore,
    clearResults,
    loading,
    error,
    results,
    currentKeyword,
    currentFilters,
    hasResults: results?.hadiths.length > 0,
    hasMore: results?.hasMore || false,
    totalCount: results?.total || 0
  };
};
