import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Filter,
  Download,
  Share2,
  Loader2,
  ChevronRight,
  Calendar,
  User,
  Bookmark,
  Heart,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { searchHadiths } from '@/lib/hadithService';

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

interface BookDetails {
  name: string;
  description: string;
  totalHadiths: string;
  author: string;
  compiled: string;
  topics: string[];
}

const BOOKS_DATA: Record<string, BookDetails> = {
  "Sahih Bukhari": {
    name: "Sahih al-Bukhari",
    description: "The most authentic collection of hadiths, compiled by Imam al-Bukhari. Contains authentic narrations of the Prophet Muhammad (ﷺ).",
    totalHadiths: "7,563 hadiths",
    author: "Imam al-Bukhari",
    compiled: "846 CE",
    topics: ["Faith", "Prayer", "Knowledge", "Pilgrimage", "Manners", "Prophets", "Virtues", "Paradise"]
  },
  "Sahih Muslim": {
    name: "Sahih Muslim",
    description: "Second most authentic collection after Sahih Bukhari, compiled by Imam Muslim. Known for precise methodology.",
    totalHadiths: "7,190 hadiths",
    author: "Imam Muslim",
    compiled: "846 CE",
    topics: ["Faith", "Purification", "Prayer", "Zakat", "Fasting", "Hajj", "Marriage", "Business"]
  },
  "Sunan Abu Dawud": {
    name: "Sunan Abu Dawud",
    description: "Collection focusing on legal and practical aspects of Islam, compiled by Imam Abu Dawud.",
    totalHadiths: "5,274 hadiths",
    author: "Imam Abu Dawud",
    compiled: "860 CE",
    topics: ["Jurisprudence", "Worship", "Transactions", "Marriage", "Food", "Medicine", "Behavior"]
  },
  "Jami' at-Tirmidhi": {
    name: "Jami' at-Tirmidhi",
    description: "Comprehensive collection covering various aspects of Islam, compiled by Imam al-Tirmidhi.",
    totalHadiths: "3,956 hadiths",
    author: "Imam al-Tirmidhi",
    compiled: "892 CE",
    topics: ["Hadith Classification", "Jurisprudence", "Virtues", "Character", "Dreams", "Trials"]
  },
  "Sunan an-Nasa'i": {
    name: "Sunan an-Nasa'i",
    description: "Collection with rigorous authentication standards, compiled by Imam an-Nasa'i.",
    totalHadiths: "5,761 hadiths",
    author: "Imam an-Nasa'i",
    compiled: "915 CE",
    topics: ["Purification", "Prayer", "Hajj", "Marriage", "Food", "Medicine", "Character"]
  },
  "Sunan Ibn Majah": {
    name: "Sunan Ibn Majah",
    description: "Sixth of the six major hadith collections, compiled by Imam Ibn Majah.",
    totalHadiths: "4,341 hadiths",
    author: "Imam Ibn Majah",
    compiled: "887 CE",
    topics: ["Introduction", "Prayer", "Mosques", "Prayer Times", "Adhan", "Friday Prayer", "Fear Prayer"]
  }
};

const BookExplorer: React.FC = () => {
  const { bookName } = useParams<{ bookName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [filteredHadiths, setFilteredHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hadithsPerPage] = useState(10);
  const [savedHadiths, setSavedHadiths] = useState<number[]>([]);
  const [likedHadiths, setLikedHadiths] = useState<number[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const bookDetails = bookName ? BOOKS_DATA[bookName.replace(/-/g, ' ')] || BOOKS_DATA[bookName] : null;

  useEffect(() => {
    if (bookName && bookDetails) {
      loadBookHadiths();
    }
  }, [bookName, bookDetails]);

  useEffect(() => {
    filterHadiths();
  }, [hadiths, searchTerm, selectedTopic]);

  useEffect(() => {
    // Load saved and liked hadiths from localStorage
    const saved = localStorage.getItem('savedHadiths');
    const liked = localStorage.getItem('likedHadiths');
    const history = localStorage.getItem('searchHistory');
    if (saved) setSavedHadiths(JSON.parse(saved));
    if (liked) setLikedHadiths(JSON.parse(liked));
    if (history) setSearchHistory(JSON.parse(history));
  }, []);

  useEffect(() => {
    // Generate search suggestions based on current search term
    if (searchTerm.length > 0) {
      const suggestions = generateSearchSuggestions(searchTerm);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const generateSearchSuggestions = (term: string) => {
    const termLower = term.toLowerCase();
    const suggestions = new Set<string>();
    
    // Get suggestions from hadith data
    hadiths.forEach(hadith => {
      // Add narrator suggestions
      if (hadith.english.narrator.toLowerCase().includes(termLower)) {
        suggestions.add(hadith.english.narrator);
      }
      
      // Add chapter suggestions
      if (hadith.chapter && hadith.chapter.toLowerCase().includes(termLower)) {
        suggestions.add(hadith.chapter);
      }
      
      // Add book name suggestions
      if (hadith.bookName && hadith.bookName.toLowerCase().includes(termLower)) {
        suggestions.add(hadith.bookName);
      }
      
      // Add common words from English text
      const words = hadith.english.text.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.includes(termLower) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    // Add recent search history
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(termLower)) {
        suggestions.add(historyItem);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = (value?: string) => {
    const finalSearchTerm = value || searchTerm;
    
    if (finalSearchTerm.trim()) {
      // Add to search history
      const newHistory = [finalSearchTerm, ...searchHistory.filter(item => item !== finalSearchTerm)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      setShowSuggestions(false);
      filterHadiths();
      
      toast({
        title: 'Search Complete',
        description: `Found ${filteredHadiths.length} results for "${finalSearchTerm}"`,
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    handleSearchSubmit(suggestion);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setFilteredHadiths(hadiths);
    setCurrentPage(1);
  };

  const handleSaveHadith = (hadithId: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save hadiths',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setSavedHadiths(prev => {
      const newSaved = prev.includes(hadithId) 
        ? prev.filter(id => id !== hadithId)
        : [...prev, hadithId];
      
      localStorage.setItem('savedHadiths', JSON.stringify(newSaved));
      
      toast({
        title: prev.includes(hadithId) ? 'Hadith Removed' : 'Hadith Saved',
        description: prev.includes(hadithId) 
          ? 'The hadith has been removed from your collection.'
          : 'The hadith has been added to your collection.',
      });
      
      return newSaved;
    });
  };

  const handleLikeHadith = (hadithId: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to like hadiths',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setLikedHadiths(prev => {
      const newLiked = prev.includes(hadithId) 
        ? prev.filter(id => id !== hadithId)
        : [...prev, hadithId];
      
      localStorage.setItem('likedHadiths', JSON.stringify(newLiked));
      
      toast({
        title: prev.includes(hadithId) ? 'Like Removed' : 'Hadith Liked',
        description: prev.includes(hadithId) 
          ? 'The hadith has been removed from your liked collection.'
          : 'The hadith has been added to your liked collection.',
      });
      
      return newLiked;
    });
  };

  const handleShareHadith = (hadith: Hadith) => {
    const shareText = `${hadith.arabic}\n\n${hadith.english.text}\n\n- ${hadith.english.narrator}\n\nSource: ${hadith.bookName} ${hadith.reference.book}:${hadith.reference.hadith}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Hadith from ${hadith.bookName}`,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied to Clipboard',
        description: 'The hadith has been copied to your clipboard.',
      });
    }
  };

  const handleCopyHadith = (hadith: Hadith) => {
    const copyText = `${hadith.arabic}\n\n${hadith.english.text}\n\n- ${hadith.english.narrator}\n\nSource: ${hadith.bookName} ${hadith.reference.book}:${hadith.reference.hadith}`;
    
    navigator.clipboard.writeText(copyText);
    toast({
      title: 'Copied to Clipboard',
      description: 'The hadith has been copied to your clipboard.',
    });
  };

  const handleExportBook = () => {
    const exportData = filteredHadiths.map(hadith => ({
      arabic: hadith.arabic,
      english: hadith.english.text,
      narrator: hadith.english.narrator,
      book: hadith.bookName,
      reference: `${hadith.reference.book}:${hadith.reference.hadith}`,
      chapter: hadith.chapter
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${bookDetails?.name.replace(/\s+/g, '_')}_hadiths.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredHadiths.length} hadiths from ${bookDetails?.name}`,
    });
  };

  const handleViewHadithDetails = (hadith: Hadith) => {
    // Navigate to detailed hadith view (you can create this page later)
    navigate(`/hadith/${hadith.id}`, { state: { hadith } });
  };

  const handleOpenExternalLink = (hadith: Hadith) => {
    // Open in Sunnah.com or similar external source
    const searchQuery = encodeURIComponent(`${hadith.english.narrator} ${hadith.english.text.substring(0, 50)}`);
    window.open(`https://sunnah.com/search?q=${searchQuery}`, '_blank');
  };

  const loadBookHadiths = async () => {
    if (!bookDetails) return;
    
    setLoading(true);
    try {
      // Search for hadiths from this specific book
      const searchQuery = bookDetails.name;
      const results = await searchHadiths(searchQuery);
      
      // Filter to only include hadiths from this book
      const bookHadiths = results.filter(hadith => 
        hadith.bookName?.toLowerCase().includes(bookDetails.name.toLowerCase()) ||
        hadith.reference.book.toString().includes(bookDetails.name.toLowerCase().split(' ')[1])
      );
      
      setHadiths(bookHadiths);
      
      // If no results from API, use sample data
      if (bookHadiths.length === 0) {
        const sampleHadiths = generateSampleHadiths(bookDetails.name);
        setHadiths(sampleHadiths);
      }
      
    } catch (error) {
      console.error('Error loading book hadiths:', error);
      // Use sample data as fallback
      const sampleHadiths = generateSampleHadiths(bookDetails?.name || '');
      setHadiths(sampleHadiths);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleHadiths = (bookName: string): Hadith[] => {
    const samples = {
      "Sahih al-Bukhari": [
        {
          id: 1,
          arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
          english: {
            narrator: "Umar ibn Al-Khattab",
            text: "Verily actions are by intentions, and for every person is what he intended."
          },
          reference: { book: 1, hadith: 1 },
          bookName: "Sahih al-Bukhari",
          chapter: "The Book of Revelation"
        },
        {
          id: 2,
          arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
          english: {
            narrator: "Abu Hurairah",
            text: "The Muslim is the one from whose tongue and hand the Muslims are safe."
          },
          reference: { book: 2, hadith: 9 },
          bookName: "Sahih al-Bukhari",
          chapter: "The Book of Faith"
        },
        {
          id: 3,
          arabic: "مَنْ حَسُنَ إِسْلَامُ الْمَرْءِ كَانَ تَرْكُهُ مَا لَا يَعْنِيهِ",
          english: {
            narrator: "Abu Hurairah",
            text: "Part of the perfection of a person's Islam is their leaving aside that which does not concern them."
          },
          reference: { book: 37, hadith: 2786 },
          bookName: "Sahih al-Bukhari",
          chapter: "The Book of Manners"
        }
      ],
      "Sahih Muslim": [
        {
          id: 1,
          arabic: "الْإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً",
          english: {
            narrator: "Abu Hurairah",
            text: "Faith has seventy-something branches, the highest of which is saying 'La ilaha illallah' and the lowest of which is removing something harmful from the road."
          },
          reference: { book: 1, hadith: 35 },
          bookName: "Sahih Muslim",
          chapter: "The Book of Faith"
        }
      ]
    };

    return samples[bookName as keyof typeof samples] || [];
  };

  const filterHadiths = () => {
    let filtered = hadiths;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(hadith => {
        // Search in Arabic text
        const arabicMatch = hadith.arabic.toLowerCase().includes(searchLower);
        
        // Search in English text
        const englishMatch = hadith.english.text.toLowerCase().includes(searchLower);
        
        // Search in narrator name
        const narratorMatch = hadith.english.narrator.toLowerCase().includes(searchLower);
        
        // Search in chapter name
        const chapterMatch = hadith.chapter && hadith.chapter.toLowerCase().includes(searchLower);
        
        // Search in book name
        const bookMatch = hadith.bookName && hadith.bookName.toLowerCase().includes(searchLower);
        
        // Search in hadith number
        const hadithNumberMatch = hadith.reference.hadith.toString().includes(searchLower);
        
        // Search in book number
        const bookNumberMatch = hadith.reference.book.toString().includes(searchLower);
        
        return arabicMatch || englishMatch || narratorMatch || chapterMatch || bookMatch || hadithNumberMatch || bookNumberMatch;
      });
    }

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(hadith =>
        hadith.chapter?.toLowerCase().includes(selectedTopic.toLowerCase())
      );
    }

    setFilteredHadiths(filtered);
    setCurrentPage(1);
  };

  const indexOfLastHadith = currentPage * hadithsPerPage;
  const indexOfFirstHadith = indexOfLastHadith - hadithsPerPage;
  const currentHadiths = filteredHadiths.slice(indexOfFirstHadith, indexOfLastHadith);
  const totalPages = Math.ceil(filteredHadiths.length / hadithsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (!bookDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <Button onClick={() => navigate('/beginner')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/beginner')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{bookDetails.name}</h1>
          <p className="text-muted-foreground">{bookDetails.description}</p>
        </div>
      </div>

      {/* Book Info Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Compiler</p>
                <p className="font-medium">{bookDetails.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Compiled</p>
                <p className="font-medium">{bookDetails.compiled}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hadiths</p>
                <p className="font-medium">{bookDetails.totalHadiths}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">Authentic</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hadiths, narrators, chapters, or hadith numbers..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (searchTerm.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                >
                  <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Topics</option>
          {bookDetails.topics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
        
        <Button 
          variant="outline"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        
        <Button onClick={() => handleSearchSubmit()}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Recent searches:</span>
          {searchHistory.slice(0, 3).map((term, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(term)}
              className="text-xs"
            >
              {term}
            </Button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {currentHadiths.length} of {filteredHadiths.length} hadiths
        </p>
        <Button variant="outline" onClick={handleExportBook}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Hadiths List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {currentHadiths.map((hadith) => (
            <Card key={hadith.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Hadith Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {bookDetails.name} - {hadith.reference.book}:{hadith.reference.hadith}
                      </Badge>
                      <h3 className="font-medium text-muted-foreground">
                        Narrated by: {hadith.english.narrator}
                      </h3>
                      {hadith.chapter && (
                        <p className="text-sm text-muted-foreground">
                          Chapter: {hadith.chapter}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewHadithDetails(hadith)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Arabic Text */}
                  <div className="text-right text-lg font-arabic leading-loose bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg">
                    {hadith.arabic}
                  </div>

                  {/* English Translation */}
                  <div className="text-foreground leading-relaxed">
                    {hadith.english.text}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShareHadith(hadith)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyHadith(hadith)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSaveHadith(hadith.id)}
                      className={savedHadiths.includes(hadith.id) ? "bg-blue-100 dark:bg-blue-900" : ""}
                    >
                      <Bookmark className={`h-4 w-4 mr-2 ${savedHadiths.includes(hadith.id) ? "fill-current" : ""}`} />
                      {savedHadiths.includes(hadith.id) ? "Saved" : "Save"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleLikeHadith(hadith.id)}
                      className={likedHadiths.includes(hadith.id) ? "bg-red-100 dark:bg-red-900" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${likedHadiths.includes(hadith.id) ? "fill-current" : ""}`} />
                      {likedHadiths.includes(hadith.id) ? "Liked" : "Like"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenExternalLink(hadith)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Source
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index + 1}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookExplorer;
