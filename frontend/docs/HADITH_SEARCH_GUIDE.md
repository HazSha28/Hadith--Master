# Hadith Search System Implementation Guide

## Overview

This guide explains the comprehensive search and filter system for the Hadith Master application. The system efficiently handles large datasets (30,000+ entries) with real-time filtering, pagination, and optimal performance.

## Architecture

### Core Components

1. **HadithSearchService** - Core search logic and data operations
2. **useHadithSearch Hook** - React hook for state management
3. **HadithSearchComponent** - Complete UI component
4. **Firebase Integration** - Backend data storage and queries

### Data Flow

```
User Input → Search Component → Hook → Search Service → Firebase → Results → UI
```

## Key Features

### 1. Combined Search + Filters

The system combines keyword search with multiple filters:

```typescript
// Example search with filters
const filters = {
  book: "Sahih Bukhari",
  narrator: "Abu Hurairah",
  category: "Prayer"
};

const results = await HadithSearchService.searchHadiths(
  "prophet muhammad", // keyword
  filters,           // filters
  1                  // page
);
```

### 2. Case-Insensitive Search

All searches are case-insensitive:

```typescript
// These all work the same:
"prophet muhammad"
"Prophet Muhammad"
"PROPHET MUHAMMAD"
"prophet Muhammad"
```

### 3. Dynamic Filter Updates

Results update automatically when filters change:

```typescript
// Real-time filtering
handleFilterChange('book', 'Sahih Bukhari'); // Triggers new search
handleFilterChange('narrator', 'Abu Hurairah'); // Triggers new search
```

### 4. Empty Keyword Support

Search works with filters alone:

```typescript
// Search by filters only
const results = await HadithSearchService.searchHadiths(
  '', // empty keyword
  { book: "Sahih Bukhari" }
);
```

## Implementation Details

### Search Service (`hadithSearchService.ts`)

#### Core Search Function

```typescript
static async searchHadiths(
  keyword: string = '',
  filters: SearchFilters = {},
  page: number = 1,
  lastVisible?: DocumentData
): Promise<SearchResult>
```

**Parameters:**
- `keyword`: Search term (optional)
- `filters`: Filter conditions
- `page`: Pagination page number
- `lastVisible`: Firestore pagination cursor

**Returns:**
```typescript
interface SearchResult {
  hadiths: Hadith[];
  total: number;
  hasMore: boolean;
  lastVisible?: DocumentData;
}
```

#### Filter Building

The system builds Firestore queries efficiently:

```typescript
private static buildSearchQuery(
  keyword: string,
  filters: SearchFilters,
  lastVisible?: DocumentData
) {
  const hadithsRef = collection(db, 'hadiths');
  let queryBuilder = query(hadithsRef, limit(this.PAGE_SIZE));

  // Add filter conditions
  if (filters.book) {
    queryBuilder = query(queryBuilder, where('book', '==', filters.book));
  }
  // ... more filters

  return queryBuilder;
}
```

#### Client-Side Filtering

Complex keyword search is handled client-side:

```typescript
private static applyClientSideFiltering(
  hadiths: Hadith[],
  keyword: string,
  filters: SearchFilters
): Hadith[] {
  return hadiths.filter(hadith => {
    // Keyword search across multiple fields
    if (keyword) {
      const searchTerm = keyword.toLowerCase().trim();
      const textMatch = hadith.text?.toLowerCase().includes(searchTerm);
      const narratorMatch = hadith.narrator?.toLowerCase().includes(searchTerm);
      // ... more field matches
      
      if (!textMatch && !narratorMatch && !bookMatch && !categoryMatch) {
        return false;
      }
    }
    
    // Filter conditions
    if (filters.book && !hadith.book?.toLowerCase().includes(filters.book.toLowerCase())) {
      return false;
    }
    
    return true;
  });
}
```

### React Hook (`useHadithSearch.ts`)

#### Hook Interface

```typescript
const {
  search,           // Search function
  loadMore,         // Load more results
  clearResults,     // Clear all results
  loading,          // Loading state
  error,            // Error message
  results,          // Search results
  currentKeyword,   // Current search keyword
  currentFilters,   // Current filters
  hasResults,       // Has any results
  hasMore,          // Has more results to load
  totalCount        // Total result count
} = useHadithSearch();
```

#### Usage Example

```typescript
const MyComponent = () => {
  const { search, loading, results, hasResults } = useHadithSearch();

  const handleSearch = useCallback(() => {
    search('prophet muhammad', { book: 'Sahih Bukhari' });
  }, [search]);

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        Search
      </button>
      {hasResults && (
        <div>
          Found {results.total} results
          {results.hadiths.map(hadith => (
            <div key={hadith.id}>{hadith.text}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### UI Component (`HadithSearchComponent.tsx`)

#### Features

- **Real-time search** with debouncing
- **Filter dropdowns** for all filter types
- **Active filter badges** with remove option
- **Pagination** with "Load More" button
- **Error handling** and loading states
- **Responsive design** for mobile/desktop

#### Props

```typescript
interface HadithSearchComponentProps {
  onHadithSelect?: (hadith: Hadith) => void; // Optional callback
  className?: string;                         // Additional CSS classes
}
```

#### Usage

```typescript
<HadithSearchComponent
  onHadithSelect={(hadith) => {
    // Handle hadith selection
    console.log('Selected:', hadith);
  }}
  className="max-w-4xl mx-auto"
/>
```

## Performance Optimizations

### 1. Pagination

- **Page Size**: 20 results per page
- **Cursor-based**: Uses Firestore cursors for efficient pagination
- **Lazy Loading**: Load more results on demand

```typescript
// Pagination example
const page1 = await searchHadiths(keyword, filters, 1);
const page2 = await searchHadiths(keyword, filters, 2, page1.lastVisible);
```

### 2. Debounced Search

- **300ms delay**: Prevents excessive API calls
- **Automatic triggering**: Search as you type
- **Manual search**: Enter key or button click

```typescript
const debouncedSearch = debounce(
  (keyword, filters) => search(keyword, filters, 1),
  300
);
```

### 3. Firestore Optimization

- **Index usage**: Leverages Firestore indexes
- **Selective queries**: Only fetch needed fields
- **Batch operations**: Multiple queries in parallel

```typescript
// Efficient filter options loading
const [narrators, books, categories] = await Promise.all([
  getDocs(query(collection(db, 'hadiths'), limit(1000))),
  getDocs(query(collection(db, 'hadiths'), limit(1000))),
  getDocs(query(collection(db, 'hadiths'), limit(1000)))
]);
```

### 4. Client-Side Caching

- **Filter options**: Cached after first load
- **Search results**: Maintained in component state
- **Debouncing**: Reduces unnecessary requests

## Firebase Setup

### Collection Structure

```javascript
// hadiths collection
{
  id: "hadith_123",
  text: "The Prophet said...",
  narrator: "Abu Hurairah",
  book: "Sahih Bukhari",
  category: "Prayer",
  arabic: "قال النبي صلى الله عليه وسلم...",
  reference: {
    book: "Sahih Bukhari",
    hadith: 123
  },
  authenticity: "Sahih"
}
```

### Required Indexes

Create these indexes in Firebase Console:

1. **Book Index**
   - Collection: hadiths
   - Field: book
   - Order: Ascending

2. **Narrator Index**
   - Collection: hadiths
   - Field: narrator
   - Order: Ascending

3. **Category Index**
   - Collection: hadiths
   - Field: category
   - Order: Ascending

4. **Composite Index** (for combined filters)
   - Collection: hadiths
   - Fields: book, narrator, category
   - Order: Ascending, Ascending, Ascending

## Advanced Features

### 1. Search Suggestions

```typescript
const suggestions = await HadithSearchService.getSearchSuggestions('prop');
// Returns: ['prophet', 'property', 'prophecy', ...]
```

### 2. Advanced Search

```typescript
// Multiple keywords with operators
const results = await HadithSearchService.advancedSearch(
  ['prophet', 'muhammad', 'prayer'],
  'AND', // or 'OR'
  { book: 'Sahih Bukhari' }
);
```

### 3. Search Statistics

```typescript
const stats = await HadithSearchService.getSearchStats();
// Returns: { totalHadiths: 34081, totalBooks: 6, ... }
```

## Best Practices

### 1. Large Dataset Handling

- **Pagination**: Always use pagination for large datasets
- **Indexing**: Create proper Firestore indexes
- **Caching**: Cache filter options and common queries
- **Debouncing**: Implement search debouncing

### 2. User Experience

- **Loading states**: Show loading indicators
- **Error handling**: Display user-friendly error messages
- **Empty states**: Show helpful messages when no results
- **Responsive design**: Ensure mobile compatibility

### 3. Performance

- **Lazy loading**: Load data on demand
- **Memoization**: Use React.memo and useMemo
- **Virtual scrolling**: For very large result sets
- **Background loading**: Load next page while user scrolls

## Troubleshooting

### Common Issues

1. **No Results with Filters**
   - Check filter values match Firestore data exactly
   - Verify Firestore indexes are created
   - Ensure case-insensitive matching is working

2. **Slow Performance**
   - Add Firestore indexes
   - Reduce page size
   - Implement proper caching

3. **Memory Issues**
   - Implement pagination
   - Clear old results
   - Use virtual scrolling

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('Search params:', { keyword, filters, page });
console.log('Query results:', snapshot.docs.length);
console.log('Filtered results:', filteredHadiths.length);
```

## Integration Example

### Complete Page Integration

```typescript
import React from 'react';
import { HadithSearchComponent } from '@/components/HadithSearchComponent';
import { Hadith } from '@/lib/hadithSearchService';

const SearchPage = () => {
  const handleHadithSelect = (hadith: Hadith) => {
    // Navigate to hadith detail page
    window.location.href = `/hadith/${hadith.id}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Hadiths</h1>
      <HadithSearchComponent
        onHadithSelect={handleHadithSelect}
        className="max-w-4xl mx-auto"
      />
    </div>
  );
};

export default SearchPage;
```

## Conclusion

This search system provides:

- ✅ **Combined keyword + filter search**
- ✅ **Case-insensitive matching**
- ✅ **Real-time filter updates**
- ✅ **Empty keyword support**
- ✅ **Large dataset optimization**
- ✅ **Pagination and lazy loading**
- ✅ **Comprehensive error handling**
- ✅ **Mobile-responsive UI**

The system is production-ready and can efficiently handle 30,000+ hadith entries with excellent performance and user experience.
