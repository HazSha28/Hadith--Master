import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2, Share2, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { searchHadiths, searchHadithsAi, getBooks, getCategories, Hadith } from "@/lib/hadithApiService";
import { searchCache } from "@/lib/searchCache";
import { logActivity } from "@/lib/activityLogger";
import { saveHadithToFirestore, removeHadithFromFirestore, shareHadithInFirestore } from "@/lib/savedHadithsService";

const highlightText = (text: string, query: string) => {
  if (!query || typeof text !== 'string') return text;

  // Split query by spaces or + signs, filtering out short words
  const terms = query.trim().split(/[\s\+]+/).filter(t => t.length > 1);
  if (terms.length === 0) return text;

  // Escape regex specials
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = terms.some(term => term.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="bg-emerald-600/40 text-emerald-900 dark:bg-emerald-500/40 dark:text-emerald-100 px-1 rounded-sm font-medium"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get("q") || "";
  const bookParam = new URLSearchParams(location.search).get("book") || undefined;
  const categoryParam = new URLSearchParams(location.search).get("category") || undefined;
  const authorParam = new URLSearchParams(location.search).get("author") || undefined;
  const narratorParam = new URLSearchParams(location.search).get("narrator") || undefined;
  const charactersParam = new URLSearchParams(location.search).get("characters") || undefined;
  const gradeParam = new URLSearchParams(location.search).get("grade") || undefined;
  const aiSearchParam = new URLSearchParams(location.search).get("ai") === "true";

  const [searchText, setSearchText] = useState(searchQuery);
  const [results, setResults] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareContent, setShareContent] = useState({ title: "", url: "" });
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState(bookParam || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [selectedNarrator, setSelectedNarrator] = useState(narratorParam || "");
  const [selectedAuthor, setSelectedAuthor] = useState(authorParam || "");
  const [selectedCharacters, setSelectedCharacters] = useState(charactersParam || "");
  const [selectedGrade, setSelectedGrade] = useState(gradeParam || "");

  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [isAiMode, setIsAiMode] = useState(aiSearchParam);
  const { user } = useAuth();
  const { toast: uiToast } = useToast();
  const [savedHadiths, setSavedHadiths] = useState<any[]>([]);
  const [detailHadith, setDetailHadith] = useState<Hadith | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Load books, categories and saved hadiths on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksData, categoriesData] = await Promise.all([
          getBooks(),
          getCategories()
        ]);
        setBooks(booksData);
        setCategories(categoriesData);

        // Load saved hadiths
        const saved = localStorage.getItem('savedHadiths');
        if (saved) {
          setSavedHadiths(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadData();
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    if (!searchQuery) return;

    setLoading(true);
    setLoadError(null);
    setResults([]);
    setAiAnswer(null);
    setAiSources([]);

    let cancelled = false;

    (async () => {
      try {
        const searchFilters = {
          book: selectedBook,
          category: selectedCategory,
          narrator: selectedNarrator,
          author: selectedAuthor,
          characters: selectedCharacters,
          grade: selectedGrade
        };

        console.log('🔍 Search Filters being sent to backend:', searchFilters);
        console.log('📝 Search Query:', searchQuery);

        // Enhanced query processing for natural language
        // Use original query for AI (Gemini handles extraction), processed only for fallback
        const processedQuery = processNaturalLanguageQuery(searchQuery);

        // Use AI mode for natural language queries (sentences, questions, etc.)
        const shouldUseAi = isAiMode || isNaturalLanguageQuery(searchQuery);

        if (shouldUseAi) {
          // Check cache first
          const cacheKey = searchCache.generateKey(searchQuery, searchFilters);
          const cachedResult = searchCache.get(cacheKey);
          
          if (cachedResult) {
            console.log('Using cached AI search result');
            setAiAnswer(cachedResult.answer);
            setAiSources(cachedResult.sources);
            setResults(cachedResult.sources.map((s: any) => ({
              id: s.hadith_number,
              arabic: s.arabic_text,
              english: { text: s.english_translation, narrator: s.narrator },
              book: s.book_name,
              reference: { book: s.book_name, hadith: s.hadith_number },
              grade: s.grade,
              chapter: s.kitab,
              category: s.bab,
              isnad: s.isnad,
              matn: s.matn,
              tags: s.themes || []
            } as any)));
            setLoading(false);
            return;
          }
          
          // AI search — no timeout race, give it enough time (backend is 3-6s)
          // Pass the ORIGINAL query so Gemini can extract keywords itself
          try {
            const apiResults = await searchHadithsAi(searchQuery, searchFilters);
            
            if (!cancelled && apiResults) {
              searchCache.set(cacheKey, apiResults, 300000);
              setAiAnswer(apiResults.answer);
              setAiSources(apiResults.sources);
              setResults(apiResults.sources.map((s: any) => ({
                id: s.hadith_number,
                arabic: s.arabic_text,
                english: { text: s.english_translation, narrator: s.narrator },
                book: s.book_name,
                reference: { book: s.book_name, hadith: s.hadith_number },
                grade: s.grade,
                chapter: s.kitab,
                category: s.bab,
                isnad: s.isnad,
                matn: s.matn,
                tags: s.themes || []
              } as any)));
            }
          } catch (aiError) {
            console.error('AI search failed, falling back to keyword search:', aiError);
            // Fallback: use processed query for regular search
            const fallbackResults = await searchHadiths(processedQuery || searchQuery, searchFilters);
            if (!cancelled && fallbackResults) {
              setResults(fallbackResults.hadiths);
            }
          }
        } else {
          // Traditional keyword search
          const cacheKey = searchCache.generateKey(processedQuery, searchFilters);
          const cachedResult = searchCache.get(cacheKey);
          
          if (cachedResult) {
            console.log('Using cached traditional search result');
            setResults(cachedResult.hadiths);
            setLoading(false);
            return;
          }
          
          const apiResults = await searchHadiths(processedQuery || searchQuery, searchFilters);
          if (!cancelled && apiResults) {
            searchCache.set(cacheKey, apiResults, 300000);
            setResults(apiResults.hadiths);
          }
        }
      } catch (e) {
        clearTimeout(searchTimeout);
        if (!cancelled) {
          console.error('Search error:', e);
          setLoadError("Search failed. Please try again.");
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedBook, selectedCategory, selectedNarrator, selectedAuthor, selectedCharacters, selectedGrade, isAiMode]);

  // Enhanced query processing functions
  const processNaturalLanguageQuery = (query: string): string => {
    // Remove common question words and phrases
    const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'was', 'were', 'will', 'can', 'could', 'should', 'would', 'may', 'might', 'must', 'shall', 'did', 'do', 'does', 'have', 'has', 'had'];
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'again', 'further', 'then', 'once'];
    
    // Split query and remove filler words
    const words = query.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 2 && 
      !questionWords.includes(word) && 
      !fillerWords.includes(word) &&
      !word.match(/^(please|tell|me|show|find|search|look|get|give|help|want|need|like|know|understand|explain)/)
    );
    
    // If we have keywords, use them; otherwise use original query
    const processedQuery = keywords.length > 0 ? keywords.join(' ') : query;
    
    return processedQuery;
  };

  const isNaturalLanguageQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check if it's a question
    const questionIndicators = ['?', 'what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'was', 'were', 'will', 'can', 'could', 'should', 'would'];
    const hasQuestionWord = questionIndicators.some(indicator => lowerQuery.includes(indicator));
    
    // Check if it's a sentence (multiple words, contains verbs, etc.)
    const sentenceIndicators = ['please', 'tell', 'me', 'show', 'find', 'search', 'look', 'get', 'give', 'help', 'want', 'need', 'like', 'know', 'understand', 'explain'];
    const hasSentenceWord = sentenceIndicators.some(indicator => lowerQuery.includes(indicator));
    
    // Check if it's longer than typical keyword search
    const isLongQuery = query.split(' ').length > 3;
    
    // Check if it contains natural language patterns
    const hasNaturalPattern = lowerQuery.includes('hadith about') || 
                              lowerQuery.includes('prophet') || 
                              lowerQuery.includes('islamic') ||
                              lowerQuery.includes('teaching') ||
                              lowerQuery.includes('story');
    
    return hasQuestionWord || hasSentenceWord || isLongQuery || hasNaturalPattern;
  };

  const handleSearch = () => {
    const q = searchText.trim();
    if (!q) return;
    const params = new URLSearchParams();
    params.set("q", q);
    if (selectedBook) params.set("book", selectedBook);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedNarrator) params.set("narrator", selectedNarrator);
    if (selectedAuthor) params.set("author", selectedAuthor);
    if (selectedCharacters) params.set("characters", selectedCharacters);
    if (selectedGrade) params.set("grade", selectedGrade);
    if (isAiMode) params.set("ai", "true");
    navigate(`/search-results?${params.toString()}`);
  };

  const handleShare = (hadith: Hadith) => {
    const url = window.location.href;
    setShareContent({
      title: `${hadith.book || "Hadith"} - #${hadith.reference?.hadith || hadith.id}`,
      url
    });
    setShareDialogOpen(true);
    // Firestore share log + activity
    if (user) {
      shareHadithInFirestore(user.uid, hadith.id);
      logActivity(user.uid, 'shared', {
        hadithId: hadith.id,
        text: hadith.english?.text || '',
        book: hadith.book || '',
      });
    }
  };

  const handleSaveHadith = (hadithToSave: any) => {
    if (!user) {
      uiToast({ title: 'Login Required', description: 'Please login to save hadiths', variant: 'destructive' });
      navigate('/login');
      return;
    }

    setSavedHadiths(prev => {
      const exists = prev.some(h => h.id === hadithToSave.id);
      if (exists) {
        uiToast({ title: 'Already Saved', description: 'This hadith is already in your saved collection.' });
        return prev;
      }
      const updated = [...prev, { ...hadithToSave, status: 'saved' as const }];
      localStorage.setItem('savedHadiths', JSON.stringify(updated));

      // Firestore save + activity log
      saveHadithToFirestore(user.uid, hadithToSave);
      logActivity(user.uid, 'saved', {
        hadithId: hadithToSave.id,
        text: hadithToSave.english?.text || hadithToSave.english || '',
        book: hadithToSave.book || '',
      });

      uiToast({ title: 'Hadith Saved', description: 'The hadith has been added to your collection.' });
      return updated;
    });
  };

  const handleViewDetails = (hadith: any) => {
    setDetailHadith(hadith);
    setDetailDialogOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareContent.url);
    toast({ title: "Link copied to clipboard!" });
  };

  const shareToSocial = (platform: string) => {
    const { title, url } = shareContent;
    const text = `Check out this Hadith: ${title}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n' + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/`
    };

    if (platform === 'instagram') {
      toast({ title: "Instagram doesn't support direct sharing", description: "Link copied to clipboard instead!" });
      copyToClipboard();
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Search Results
            </h1>
            <p className="text-muted-foreground">
              Found {results.length} hadiths for "{searchQuery}"
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Input
                placeholder="Refine your search..."
                className="bg-input border-border pl-10 pr-12"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                disabled={loading}
              />
              
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSearch}
                disabled={loading}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search Status */}
            {searchText && (
              <div className="mt-2 text-sm text-muted-foreground">
                Searching for: "{searchText}"
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {showFilters && (
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Book</label>
                      <select
                        value={selectedBook}
                        onChange={(e) => {
                          setSelectedBook(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Books</option>
                        <option value="Sahih al-Bukhari">Sahih al-Bukhari</option>
                        <option value="Sahih Muslim">Sahih Muslim</option>
                        <option value="Sunan an-Nasa'i">Sunan an-Nasa'i</option>
                        <option value="Sunan Abi Dawud">Sunan Abi Dawud</option>
                        <option value="Jami' at-Tirmidhi">Jami' at-Tirmidhi</option>
                        <option value="Sunan Ibn Majah">Sunan Ibn Majah</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Author</label>
                      <select
                        value={selectedAuthor}
                        onChange={(e) => {
                          setSelectedAuthor(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Authors</option>
                        <option value="Imam al-Bukhari">Imam al-Bukhaari</option>
                        <option value="Imam Muslim">Imam Muslim</option>
                        <option value="Imam Abu Dawood">Imam Abu Dawood</option>
                        <option value="Imam al-Tirmidhi">Imam al-Tirmidhi</option>
                        <option value="Imam al-Nasaa'i">Imam al-Nasaa'i</option>
                        <option value="Imam Ibn Maajah">Imam Ibn Maajah</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Narrator</label>
                      <select
                        value={selectedNarrator}
                        onChange={(e) => {
                          setSelectedNarrator(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Narrators</option>
                        <option value="Abu Hurairah (Abdur-Rahmaan)(radi-Allaahu 'anhu)">Abu Hurairah (Abdur-Rahmaan)</option>
                        <option value="Abdullaah Ibn Abbaas (radi-Allaahu 'anhu)">Abdullaah Ibn Abbaas</option>
                        <option value="Aa'ishah Siddeeqa (radi-Allaahu 'anhaa)">Aa'ishah Siddeeqa</option>
                        <option value="Abdullaah Ibn Umar (radi-Allaahu 'anhu)">Abdullaah Ibn Umar</option>
                        <option value="Jaabir Ibn Abdullaah (radi-Allaahu 'anhu)">Jaabir Ibn Abdullaah</option>
                        <option value="Anas Ibn Maalik (radi-Allaahu 'anhu)">Anas Ibn Maalik</option>
                        <option value="Abu Sa'eed al-Khudree (radi-Allaahu 'anhu)">Abu Sa'eed al-Khudree</option>
                        <option value="Abdullaah Ibn Amr Ibn al-Aas (radi-Allaahu 'anhu)">Abdullaah Ibn Amr Ibn al-Aas</option>
                        <option value="Alee Ibn Abee Taalib (radi-Allaahu 'anhu)">Alee Ibn Abee Taalib</option>
                        <option value="Umar Ibn al-Khattaab (radi-Allaahu 'anhu)">Umar Ibn al-Khattaab</option>
                        <option value="Abu Bakr as-Siddeeq (radi-Allaahu 'anhu)">Abu Bakr as-Siddeeq</option>
                        <option value="Uthmaan Ibn Affaan Dhun-Noorain (radi-Allaahu 'anhu)">Uthmaan Ibn Affaan Dhun-Noorain</option>
                        <option value="Umm Salamah (radi-Allaahu 'anhaa)">Umm Salamah</option>
                        <option value="Abu Moosaa al-Asha'aree (radi-Allaahu 'anhu)">Abu Moosaa al-Asha'aree</option>
                        <option value="Abu Dharr al-Ghaffaree (radi-Allaahu 'anhu)">Abu Dharr al-Ghaffaree</option>
                        <option value="Abu Ayyoob al-Ansaaree (radi-Allaahu 'anhu)">Abu Ayyoob al-Ansaaree</option>
                        <option value="Ubayy Ibn Ka'ab (radi-Allaahu 'anhu)">Ubayy Ibn Ka'ab</option>
                        <option value="Mu'aadh Ibn Jabal (radi-Allaahu 'anhu)">Mu'aadh Ibn Jabal</option>
                        <option value="Saalim Ibn Abdullaah Ibn Umar">Saalim Ibn Abdullaah Ibn Umar</option>
                        <option value="Urwah Ibn Zubair">Urwah Ibn Zubair</option>
                        <option value="Sa'eed Ibn al-Mussayab">Sa'eed Ibn al-Mussayab</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Characters</label>
                      <select
                        value={selectedCharacters}
                        onChange={(e) => {
                          setSelectedCharacters(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Characters</option>
                        <option value="Prophet Muhammad (PBUH)">Prophet Muhammad (PBUH)</option>
                        <option value="Companions">Companions</option>
                        <option value="Family">Family</option>
                        <option value="Scholars">Scholars</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Grade</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => {
                          setSelectedGrade(e.target.value);
                          handleSearch(); // Auto-trigger search when filter changes
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Grades</option>
                        <option value="Sahih">Sahih (Authentic)</option>
                        <option value="Hasan">Hasan (Good)</option>
                        <option value="Da'if">Da'if (Weak)</option>
                        <option value="Mawdu'">Mawdu' (Fabricated)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button onClick={handleSearch} disabled={loading}>
                      Apply Filters
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedBook('');
                        setSelectedCategory('');
                        setSelectedAuthor('');
                        setSelectedNarrator('');
                        setSelectedCharacters('');
                        setSelectedGrade('');
                        handleSearch();
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <span className="text-muted-foreground text-center">
                {searchText.includes('voice') || searchText.includes('speaking') ? 
                  "Processing voice search..." : 
                  searchText.includes('image') || searchText.includes('upload') ? 
                  "Extracting text from image..." : 
                  "Searching hadiths..."
                }
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                Finding the most relevant hadiths for you
              </p>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{loadError}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* AI Answer */}
          {aiAnswer && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  AI Answer
                </h3>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  {aiAnswer}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {!loading && !loadError && results.length > 0 && (
            <div className="space-y-4">
              {results.map((hadith) => (
                <Card key={hadith.id} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-right text-xl leading-loose font-arabic mb-4">
                      {highlightText(hadith.arabic, searchQuery)}
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-muted-foreground mb-2">
                        <span className="font-medium">Narrated by:</span> {hadith.english?.narrator}
                      </p>
                      <p className="text-foreground mb-3">
                        {highlightText(hadith.english?.text || '', searchQuery)}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                        {hadith.book && <span className="font-semibold">{hadith.book}</span>}
                        {hadith.reference?.hadith && <span>Hadith {hadith.reference.hadith}</span>}
                        {hadith.chapter && <span>Chapter: {hadith.chapter}</span>}
                        {hadith.grade && <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">{hadith.grade}</span>}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(hadith)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(hadith)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveHadith(hadith)}
                          disabled={savedHadiths.some(h => h.id === hadith.id)}
                        >
                          {savedHadiths.some(h => h.id === hadith.id) ? (
                            <>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !loadError && results.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hadiths found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button onClick={() => navigate('/beginner')}>
                Try a new search
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Hadith</DialogTitle>
            <DialogDescription>
              Share this hadith with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1">
                Copy Link
              </Button>
              <Button onClick={() => shareToSocial('whatsapp')} variant="outline">
                WhatsApp
              </Button>
              <Button onClick={() => shareToSocial('twitter')} variant="outline">
                Twitter
              </Button>
              <Button onClick={() => shareToSocial('email')} variant="outline">
                Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hadith Details</DialogTitle>
          </DialogHeader>
          {detailHadith && (
            <div className="space-y-6">
              <div className="text-right text-2xl leading-loose font-arabic">
                {detailHadith.arabic}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium">Narrated by:</span> {detailHadith.english?.narrator}
                </p>
                <p className="text-foreground mb-3">
                  {detailHadith.english?.text}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {detailHadith.book && <span className="font-semibold">{detailHadith.book}</span>}
                  {detailHadith.reference?.hadith && <span>Hadith {detailHadith.reference.hadith}</span>}
                  {detailHadith.chapter && <span>Chapter: {detailHadith.chapter}</span>}
                  {detailHadith.grade && <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">{detailHadith.grade}</span>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchResults;
