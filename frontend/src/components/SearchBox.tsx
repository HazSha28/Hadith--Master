import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  BookOpen,
  User,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchBoxProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

interface SearchFilters {
  book?: string;
  narrator?: string;
  author?: string;
  topic?: string;
}

interface SearchSuggestion {
  type: 'history' | 'trending' | 'book' | 'narrator' | 'topic';
  text: string;
  count?: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  placeholder = "Search hadiths, narrators, books, or topics...",
  showFilters = true,
  className = ""
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});

  // Sample data - in real app, this would come from API
  const sampleBooks = [
    "Sahih al-Bukhari", "Sahih Muslim", "Sunan Abu Dawud", 
    "Jami' at-Tirmidhi", "Sunan an-Nasa'i", "Sunan Ibn Majah"
  ];
  
  const sampleNarrators = [
    "Abu Hurairah", "Abdullah ibn Abbas", "Aisha", "Abdullah ibn Umar",
    "Jabir ibn Abdullah", "Anas ibn Malik", "Umar ibn al-Khattab"
  ];
  
  const sampleTopics = [
    "Prayer", "Faith", "Charity", "Fasting", "Pilgrimage", 
    "Manners", "Knowledge", "Paradise", "Character"
  ];

  const trendingTerms = [
    "prayer", "faith", "charity", "intention", "patience", "gratitude"
  ];

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
    
    // Set trending searches
    setTrendingSearches(trendingTerms);
  }, []);

  useEffect(() => {
    // Generate suggestions based on search term
    if (searchTerm.length > 0) {
      const newSuggestions = generateSuggestions(searchTerm);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      // Show trending searches when search is empty
      const trendingSuggestions: SearchSuggestion[] = trendingSearches.map(term => ({
        type: 'trending',
        text: term,
        count: Math.floor(Math.random() * 100) + 50
      }));
      setSuggestions(trendingSuggestions);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const generateSuggestions = (term: string): SearchSuggestion[] => {
    const termLower = term.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // History suggestions
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(termLower)) {
        suggestions.push({
          type: 'history',
          text: historyItem
        });
      }
    });

    // Book suggestions
    sampleBooks.forEach(book => {
      if (book.toLowerCase().includes(termLower)) {
        suggestions.push({
          type: 'book',
          text: book,
          count: Math.floor(Math.random() * 1000) + 500
        });
      }
    });

    // Narrator suggestions
    sampleNarrators.forEach(narrator => {
      if (narrator.toLowerCase().includes(termLower)) {
        suggestions.push({
          type: 'narrator',
          text: narrator,
          count: Math.floor(Math.random() * 500) + 100
        });
      }
    });

    // Topic suggestions
    sampleTopics.forEach(topic => {
      if (topic.toLowerCase().includes(termLower)) {
        suggestions.push({
          type: 'topic',
          text: topic,
          count: Math.floor(Math.random() * 200) + 50
        });
      }
    });

    return suggestions.slice(0, 8);
  };

  const handleSearch = (query?: string) => {
    const finalQuery = query || searchTerm;
    
    if (finalQuery.trim()) {
      // Add to search history
      const newHistory = [finalQuery, ...searchHistory.filter(item => item !== finalQuery)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      setShowSuggestions(false);
      
      // Call the search callback with query and filters
      onSearch(finalQuery, filters);
      
      toast({
        title: 'Search Complete',
        description: `Searching for "${finalQuery}"...`,
      });
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    
    // If it's a specific type, add to filters
    const newFilters = { ...filters };
    if (suggestion.type === 'book') {
      newFilters.book = suggestion.text;
    } else if (suggestion.type === 'narrator') {
      newFilters.narrator = suggestion.text;
    } else if (suggestion.type === 'topic') {
      newFilters.topic = suggestion.text;
    }
    
    setFilters(newFilters);
    handleSearch(suggestion.text);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setFilters({});
  };

  const clearFilter = (filterType: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterType];
    setFilters(newFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history': return <Clock className="h-3 w-3" />;
      case 'trending': return <TrendingUp className="h-3 w-3" />;
      case 'book': return <BookOpen className="h-3 w-3" />;
      case 'narrator': return <User className="h-3 w-3" />;
      case 'topic': return <Hash className="h-3 w-3" />;
      default: return <Search className="h-3 w-3" />;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history': return 'text-muted-foreground';
      case 'trending': return 'text-green-600 dark:text-green-400';
      case 'book': return 'text-blue-600 dark:text-blue-400';
      case 'narrator': return 'text-purple-600 dark:text-purple-400';
      case 'topic': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className={getSuggestionColor(suggestion.type)}>
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <span className="text-sm">{suggestion.text}</span>
              </div>
              <div className="flex items-center gap-2">
                {suggestion.count && (
                  <span className="text-xs text-muted-foreground">
                    {suggestion.count} results
                  </span>
                )}
                <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {suggestion.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters */}
      {showFilters && Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(filters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {value}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter(key as keyof SearchFilters)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Search History */}
      {!searchTerm && searchHistory.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Recent searches</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchHistory([]);
                localStorage.removeItem('searchHistory');
              }}
              className="text-xs h-6"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {searchHistory.slice(0, 5).map((term, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick({ type: 'history', text: term })}
                className="text-xs h-6"
              >
                <Clock className="h-3 w-3 mr-1" />
                {term}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search Button */}
      <Button
        onClick={() => handleSearch()}
        className="w-full mt-3"
        disabled={!searchTerm.trim()}
      >
        <Search className="mr-2 h-4 w-4" />
        Search Hadiths
      </Button>
    </div>
  );
};

export default SearchBox;
