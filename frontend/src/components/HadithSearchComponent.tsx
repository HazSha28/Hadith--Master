import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, X } from 'lucide-react';
import { useHadithSearch } from '@/hooks/useHadithSearch';
import { HadithSearchService, SearchFilters, Hadith } from '@/lib/hadithSearchService';

interface HadithSearchComponentProps {
  onHadithSelect?: (hadith: Hadith) => void;
  className?: string;
}

export const HadithSearchComponent: React.FC<HadithSearchComponentProps> = ({
  onHadithSelect,
  className = ''
}) => {
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filterOptions, setFilterOptions] = useState({
    narrators: [] as string[],
    books: [] as string[],
    categories: [] as string[],
    authenticities: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);

  const { search, loadMore, loading, error, results, hasResults, hasMore, totalCount } = useHadithSearch();

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await HadithSearchService.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };

    loadFilterOptions();
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchKeyword: string, searchFilters: SearchFilters) => {
      search(searchKeyword, searchFilters, 1);
    }, 300),
    [search]
  );

  // Handle keyword change
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    debouncedSearch(value, filters);
  };

  // Handle filter change
  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [filterType]: value || undefined };
    setFilters(newFilters);
    debouncedSearch(keyword, newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setKeyword('');
    debouncedSearch('', {});
  };

  // Remove specific filter
  const removeFilter = (filterType: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterType];
    setFilters(newFilters);
    debouncedSearch(keyword, newFilters);
  };

  // Handle search submit
  const handleSearch = () => {
    search(keyword, filters, 1);
  };

  // Handle load more
  const handleLoadMore = () => {
    loadMore();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Hadith Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyword Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search hadiths by keyword..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary">{Object.keys(filters).length}</Badge>
              )}
            </Button>
          </div>

          {/* Active Filters */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                value && (
                  <Badge key={key} variant="default" className="flex items-center gap-1">
                    {key}: {value}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter(key as keyof SearchFilters)}
                    />
                  </Badge>
                )
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
              {/* Book Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Book</label>
                <Select
                  value={filters.book || ''}
                  onValueChange={(value) => handleFilterChange('book', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Books</SelectItem>
                    {filterOptions.books.map((book) => (
                      <SelectItem key={book} value={book}>
                        {book}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Narrator Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Narrator</label>
                <Select
                  value={filters.narrator || ''}
                  onValueChange={(value) => handleFilterChange('narrator', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select narrator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Narrators</SelectItem>
                    {filterOptions.narrators.map((narrator) => (
                      <SelectItem key={narrator} value={narrator}>
                        {narrator}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {filterOptions.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Authenticity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Authenticity</label>
                <Select
                  value={filters.authenticity || ''}
                  onValueChange={(value) => handleFilterChange('authenticity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select authenticity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Authenticities</SelectItem>
                    {filterOptions.authenticities.map((authenticity) => (
                      <SelectItem key={authenticity} value={authenticity}>
                        {authenticity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results ({totalCount} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results?.hadiths.map((hadith) => (
              <div
                key={hadith.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onHadithSelect?.(hadith)}
              >
                <div className="space-y-2">
                  {/* Arabic Text */}
                  {hadith.arabic && (
                    <div className="text-right text-lg font-arabic" dir="rtl">
                      {hadith.arabic}
                    </div>
                  )}
                  
                  {/* English Text */}
                  <p className="text-gray-800">{hadith.text}</p>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <Badge variant="outline">{hadith.book}</Badge>
                    <Badge variant="outline">{hadith.narrator}</Badge>
                    <Badge variant="outline">{hadith.category}</Badge>
                    {hadith.authenticity && (
                      <Badge variant="secondary">{hadith.authenticity}</Badge>
                    )}
                    {hadith.reference && (
                      <span className="text-xs">
                        Ref: {hadith.reference.book}, Hadith {hadith.reference.hadith}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button onClick={handleLoadMore} disabled={loading} variant="outline">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && !hasResults && (keyword || Object.keys(filters).length > 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No hadiths found matching your search criteria.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-2">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
