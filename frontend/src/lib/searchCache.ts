// Simple in-memory cache for faster search results
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Maximum number of cached items

  get(key: string): any | null {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl: number = 300000): void { // Default 5 minutes
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from query and filters
  generateKey(query: string, filters: any = {}): string {
    const filterString = JSON.stringify(filters);
    return `${query}:${filterString}`;
  }

  // Check if cache entry exists and is valid
  has(key: string): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    return Date.now() - entry.timestamp <= entry.ttl;
  }
}

// Create a singleton instance
export const searchCache = new SearchCache();
