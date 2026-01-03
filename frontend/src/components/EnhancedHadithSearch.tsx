import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { searchHadiths, getBookMetadata, type EnhancedHadith, type SearchFilters, type SearchResult } from "@/lib/enhancedHadithService";

interface EnhancedHadithSearchProps {
  onResults: (results: SearchResult) => void;
  onHadithSelect: (hadith: EnhancedHadith) => void;
  className?: string;
}

export function EnhancedHadithSearch({ onResults, onHadithSelect, className }: EnhancedHadithSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookMetadata, setBookMetadata] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load book metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const metadata = await getBookMetadata();
        setBookMetadata(metadata);
      } catch (error) {
        console.error('Failed to load book metadata:', error);
      }
    };
    loadMetadata();
  }, []);

  // Perform search
  const handleSearch = async () => {
    if (!query.trim() && !Object.keys(filters).length) return;

    setIsSearching(true);
    try {
      const results = await searchHadiths(query, filters, 1, 20);
      onResults(results);
      
      // Add to search history
      if (query.trim() && !searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setQuery("");
  };

  // Update filter
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get unique themes from metadata
  const allThemes = Array.from(new Set(bookMetadata.flatMap(book => 
    book.chapters?.map(chapter => chapter.title.toLowerCase()) || []
  )));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <Input
          placeholder="Search hadiths by keywords, narrator, theme, or Arabic text..."
          className="bg-input border-border pl-10 pr-28 h-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 px-2"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                {Object.keys(filters).length}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
          
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || (!query.trim() && !Object.keys(filters).length)}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && !query && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Recent:</span>
          {searchHistory.map((term, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => setQuery(term)}
            >
              {term}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Active filters:</span>
          {filters.book_id && (
            <Badge variant="secondary" className="gap-1">
              Book: {bookMetadata.find(b => b.book_id === filters.book_id)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('book_id', undefined)} />
            </Badge>
          )}
          {filters.authenticity_level && (
            <Badge variant="secondary" className="gap-1">
              Authenticity: {filters.authenticity_level}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('authenticity_level', undefined)} />
            </Badge>
          )}
          {filters.grade && (
            <Badge variant="secondary" className="gap-1">
              Grade: {filters.grade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('grade', undefined)} />
            </Badge>
          )}
          {filters.themes && filters.themes.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Themes: {filters.themes.join(', ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('themes', undefined)} />
            </Badge>
          )}
          {filters.narrator && (
            <Badge variant="secondary" className="gap-1">
              Narrator: {filters.narrator}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('narrator', undefined)} />
            </Badge>
          )}
          {filters.quality_score_min && (
            <Badge variant="secondary" className="gap-1">
              Min Quality: {filters.quality_score_min}%
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('quality_score_min', undefined)} />
            </Badge>
          )}
          {filters.verification_required && (
            <Badge variant="secondary" className="gap-1">
              Verification Required
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('verification_required', undefined)} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Book Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Book</label>
              <Select value={filters.book_id || ""} onValueChange={(value) => updateFilter('book_id', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Books</SelectItem>
                  {bookMetadata.map(book => (
                    <SelectItem key={book.book_id} value={book.book_id}>
                      {book.name} ({book.total_hadiths} hadiths)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Authenticity Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Authenticity Level</label>
              <Select value={filters.authenticity_level || ""} onValueChange={(value) => updateFilter('authenticity_level', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select authenticity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="High">High (Sahih)</SelectItem>
                  <SelectItem value="Medium">Medium (Hasan)</SelectItem>
                  <SelectItem value="Low">Low (Da'if)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Select value={filters.grade || ""} onValueChange={(value) => updateFilter('grade', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Grades</SelectItem>
                  <SelectItem value="Sahih">Sahih</SelectItem>
                  <SelectItem value="Hasan">Hasan</SelectItem>
                  <SelectItem value="Da'if">Da'if</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Themes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Themes</label>
              <div className="grid grid-cols-2 gap-2">
                {['faith', 'prayer', 'charity', 'fasting', 'pilgrimage', 'manners', 'knowledge', 'business', 'marriage', 'character'].map(theme => (
                  <div key={theme} className="flex items-center space-x-2">
                    <Checkbox
                      id={`theme-${theme}`}
                      checked={filters.themes?.includes(theme) || false}
                      onCheckedChange={(checked) => {
                        const currentThemes = filters.themes || [];
                        if (checked) {
                          updateFilter('themes', [...currentThemes, theme]);
                        } else {
                          updateFilter('themes', currentThemes.filter(t => t !== theme));
                        }
                      }}
                    />
                    <label htmlFor={`theme-${theme}`} className="text-sm capitalize">
                      {theme}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrator */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Narrator</label>
              <Input
                placeholder="Filter by narrator name..."
                value={filters.narrator || ""}
                onChange={(e) => updateFilter('narrator', e.target.value || undefined)}
              />
            </div>

            {/* Quality Score */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Quality Score: {filters.quality_score_min || 0}%</label>
              <Slider
                value={[filters.quality_score_min || 0]}
                onValueChange={(value) => updateFilter('quality_score_min', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Verification Required */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verification-required"
                checked={filters.verification_required || false}
                onCheckedChange={(checked) => updateFilter('verification_required', checked)}
              />
              <label htmlFor="verification-required" className="text-sm">
                Only show hadiths requiring verification
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
