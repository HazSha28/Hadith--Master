import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Search, Bookmark, ChevronDown, ChevronUp, Users, CheckCircle2, Star, Trophy, Sparkles, Clock, Calendar, Loader2, Trash2, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VoiceSearch from "@/components/VoiceSearch";
import FileUpload from "@/components/FileUpload";
import { ShareDialog } from "@/components/ShareDialog";
import { UserOnboarding } from "@/components/UserOnboarding";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";
import { fetchRandomHadith } from "@/lib/hadithService";
import { getDailyHadith, forceRefreshDailyHadith } from "@/utils/dailyHadith";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const Beginner = () => {
  const [searchText, setSearchText] = useState("");
  const [isAiSearch, setIsAiSearch] = useState(true);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'collection'>('search');
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Onboarding hook
  const { shouldShowOnboarding, skipOnboarding } = useUserOnboarding('/beginner');

  useEffect(() => {
    loadRandomHadith();
    // Load saved hadiths from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedHadiths');
      if (saved) {
        try {
          setSavedHadiths(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading saved hadiths:', error);
        }
      }
    }
  }, []);

  const loadRandomHadith = async () => {
    try {
      setLoading(true);
      const dailyHadith = await getDailyHadith();
      setHadith(dailyHadith);
      setError(null);
    } catch (err) {
      console.error('Failed to load hadith:', err);
      setError('Failed to load hadith. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewHadith = async () => {
    try {
      setLoading(true);
      const newHadith = await forceRefreshDailyHadith();
      setHadith(newHadith);
      setError(null);
    } catch (err) {
      console.error('Failed to load new hadith:', err);
      setError('Failed to load hadith. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = (bookName: string) => {
    // Convert book name to URL-friendly slug
    const bookSlugs: Record<string, string> = {
      'Sahih Bukhari': 'sahih-bukhari',
      'Sahih Muslim': 'sahih-muslim',
      'Sunan Abu Dawud': 'sunan-abu-dawud',
      'Jami\' at-Tirmidhi': 'jami-at-tirmidhi',
      'Sunan an-Nasa\'i': 'sunan-an-nasai',
      'Sunan Ibn Majah': 'sunan-ibn-majah'
    };

    const slug = bookSlugs[bookName] || bookName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/collections/${slug}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Add search text if provided
    if (searchText.trim()) {
      const query = searchText.trim();
      
      // Check if it's a natural language query and enable AI mode
      const shouldUseAi = isNaturalLanguageQuery(query);
      console.log('Natural language query detected:', shouldUseAi);
      
      params.set('q', query);
      if (shouldUseAi) params.set('ai', 'true');
    }
    
    // Add filters if selected
    if (selectedBook) {
      params.set('book', selectedBook);
    }
    
    if (selectedAuthor) {
      params.set('author', selectedAuthor);
    }
    
    if (selectedNarrator) {
      params.set('narrator', selectedNarrator);
    }
    
    // Only navigate if there's at least some criteria
    if (params.toString()) {
      navigate(`/search-results?${params.toString()}`);
    } else {
      toast({
        title: 'Search Required',
        description: 'Please enter search text or select filters',
        variant: 'destructive',
      });
    }
  };

  // Helper function to detect natural language queries
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

  const handleBookSelect = (value: string) => {
    setSelectedBook(value);
  };

  const handleAuthorSelect = (value: string) => {
    setSelectedAuthor(value);
  };

  const handleNarratorSelect = (value: string) => {
    setSelectedNarrator(value);
  };

  const clearFilters = () => {
    setSelectedBook('');
    setSelectedAuthor('');
    setSelectedNarrator('');
    setSearchText('');
  };

  const handleSaveHadith = (hadithToSave: Hadith) => {
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
      // Check if hadith is already saved
      const exists = prev.some(h => h.id === hadithToSave.id);
      if (exists) {
        toast({
          title: 'Already Saved',
          description: 'This hadith is already in your saved collection.',
        });
        return prev;
      }

      const updated = [...prev, { ...hadithToSave, status: 'saved' as const }];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('savedHadiths', JSON.stringify(updated));
      }

      toast({
        title: 'Hadith Saved',
        description: 'The hadith has been added to your collection.',
      });
      return updated;
    });
  };

  const handleRemoveSaved = (id: number) => {
    setSavedHadiths(prev => {
      const updated = prev.filter(h => h.id !== id);
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('savedHadiths', JSON.stringify(updated));
      }
      toast({
        title: 'Hadith Removed',
        description: 'The hadith has been removed from your collection.',
      });
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground text-center mb-4">
            Beginner Hadith Learning
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-lg">
            Learn and practice hadiths with our interactive tools
          </p>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                className={`rounded-none border-b-2 ${activeTab === 'search' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('search')}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button
                variant="ghost"
                className={`rounded-none border-b-2 ${activeTab === 'collection' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('collection')}
                disabled={savedHadiths.length === 0}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                My Collection {savedHadiths.length > 0 && `(${savedHadiths.length})`}
              </Button>
            </div>
          </div>

          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              {/* Hadith Flow Guide */}
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-700 mb-8 max-w-4xl mx-auto overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-colors py-4"
                  onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-emerald-800 dark:text-emerald-200" />
                      <div>
                        <CardTitle className="text-xl text-emerald-800 dark:text-emerald-200">
                          Understanding Hadith Flow - A Beginner's Guide
                        </CardTitle>
                        <CardDescription className="text-emerald-700 dark:text-emerald-300">
                          Click to {isGuideExpanded ? 'collapse' : 'expand'} &amp; learn how hadiths were preserved
                        </CardDescription>
                      </div>
                    </div>
                    {isGuideExpanded ? (
                      <ChevronUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </CardHeader>
                {isGuideExpanded && <CardContent className="space-y-6 pt-0 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* The Chain of Transmission */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      1. The Chain of Transmission (Isnad)
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      Every authentic hadith has a chain of narrators going back to Prophet Muhammad (ﷺ). This chain is called <strong>Isnad</strong>.
                    </p>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 border-l-4 border-emerald-500">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">
                        <strong>Example:</strong> "Narrated by Abu Hurairah → narrated by Ibn Abbas → narrated by Prophet Muhammad (ﷺ)"
                      </p>
                    </div>
                  </div>

                  {/* Authentication Process */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      2. Authentication Process
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      Scholars meticulously verified each narrator's reliability, memory, and character before accepting hadiths.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Sahih</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">Most authentic</p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Hasan</h4>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">Good quality</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Da'if</h4>
                        <p className="text-xs text-red-700 dark:text-red-300">Weak</p>
                      </div>
                    </div>
                  </div>

                  {/* Major Collections */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      3. Major Hadith Collections
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      Six major collections (Kutub al-Sittah) contain the most authentic hadiths:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "Sahih Bukhari", desc: "Most authentic collection", hadiths: "7,563" },
                        { name: "Sahih Muslim", desc: "Second most authentic", hadiths: "7,190" },
                        { name: "Sunan Abu Dawud", desc: "Legal traditions", hadiths: "5,274" },
                        { name: "Jami' at-Tirmidhi", desc: "Comprehensive collection", hadiths: "3,956" },
                        { name: "Sunan an-Nasa'i", desc: "Rigorous authentication", hadiths: "5,761" },
                        { name: "Sunan Ibn Majah", desc: "Complete collection", hadiths: "4,341" },
                      ].map((book, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{book.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{book.desc}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{book.hadiths} hadiths</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How to Study Hadith */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      4. How to Study Hadith Effectively
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Start with Authentic Sources</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Begin with Sahih Bukhari and Sahih Muslim</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Understand the Context</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Learn when and why the hadith was revealed</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Check the Authenticity</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Verify the hadith's classification and narrators</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Seek Scholarly Explanation</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Consult knowledgeable scholars for deeper understanding</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Quick Tips for Beginners
                    </h3>
                    <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                      <li>• Always check the source before sharing hadiths</li>
                      <li>• Focus on understanding the meaning, not just memorizing</li>
                      <li>• Start with short hadiths about basic Islamic principles</li>
                      <li>• Join study groups or seek guidance from knowledgeable scholars</li>
                      <li>• Remember: Not everything attributed to Prophet Muhammad (ﷺ) is authentic</li>
                    </ul>
                  </div>
                </CardContent>}
              </Card>

              <Card className="bg-card shadow-lg mb-8 max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Beginner Hadith Search</CardTitle>
                  <CardDescription>
                    Search for hadiths by keywords, book, author, or narrator
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="space-y-3">
                      <div className="relative">
                        <Textarea
                          placeholder="Enter Hadith gist here..."
                          className="bg-input border-border min-h-[80px] resize-none pr-20"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSearch();
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSearch();
                            }
                          }}
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          <VoiceSearch onTranscript={(text) => setSearchText(prev => (prev + " " + text).trim())} />
                          <FileUpload onExtractedText={(text) => {
                            setSearchText(text.trim());
                            // Auto-trigger AI search immediately after upload
                            const params = new URLSearchParams();
                            params.set('q', text.trim());
                            params.set('ai', 'true'); // always use AI for image uploads
                            navigate(`/search-results?${params.toString()}`);
                          }} />
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Search Hadiths'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Hadith Section */}
              <Card className="bg-card shadow-lg mt-8">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Daily Hadith</CardTitle>
                      <CardDescription>Practice reciting and memorizing this hadith</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewHadith}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'New Hadith'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading && !hadith ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="text-center text-destructive p-4">
                      {error}
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={loadRandomHadith}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : hadith ? (
                    <div className="space-y-6">
                      <div className="text-right text-2xl leading-loose font-arabic">
                        {hadith.arabic}
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-muted-foreground mb-2">
                          <span className="font-medium">Narrated by:</span> {hadith.english.narrator}
                        </p>
                        <p className="text-foreground">{hadith.english.text}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hadith.bookName && <span className="font-semibold">{hadith.bookName} • </span>}
                        Reference: {hadith.chapter ? hadith.chapter + ' • ' : ''}Hadith {hadith.reference.hadith}
                      </div>
                      <div className="flex justify-end gap-2">
                        <ShareDialog
                          hadith={{
                            id: hadith.id.toString(),
                            book: hadith.bookName || 'Hadith',
                            number: hadith.reference.hadith.toString(),
                            arabic: hadith.arabic,
                            english: hadith.english.text,
                            narrator: hadith.english.narrator,
                            authenticity: '',
                            bookSlug: hadith.bookName?.toLowerCase().replace(/\s+/g, '-') || ''
                          }}
                        >
                          <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </ShareDialog>
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
                              <Bookmark className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}

          {/* Collection Tab */}
          {activeTab === 'collection' && (
            <Card className="bg-card shadow-lg">
              <CardHeader>
                <CardTitle>My Hadith Collection</CardTitle>
                <CardDescription>
                  Your saved hadiths for easy access and practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedHadiths.length > 0 ? (
                  <div className="space-y-4">
                    {savedHadiths.map((savedHadith) => (
                      <Card key={savedHadith.id} className="relative overflow-hidden">
                        <CardContent className="p-6">
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSaved(savedHadith.id)}
                              title="Remove from collection"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right text-xl leading-loose font-arabic mb-4">
                            {savedHadith.arabic}
                          </div>
                          <div className="space-y-2">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Narrated by:</span> {savedHadith.english.narrator}
                            </p>
                            <p className="text-foreground">{savedHadith.english.text}</p>
                            <div className="text-sm text-muted-foreground">
                              Reference: Book {savedHadith.reference.book}, Hadith {savedHadith.reference.hadith}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    You haven't saved any hadiths yet. Start exploring and save your favorite hadiths to build your collection!
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hadith Books Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Hadith Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Sahih Bukhari", desc: "The most authentic collection", hadiths: "7,563 hadiths" },
                { name: "Sahih Muslim", desc: "Second most authentic", hadiths: "7,190 hadiths" },
                { name: "Sunan Abu Dawud", desc: "Legal traditions", hadiths: "5,274 hadiths" },
                { name: "Jami' at-Tirmidhi", desc: "Comprehensive collection", hadiths: "3,956 hadiths" },
                { name: "Sunan an-Nasa'i", desc: "Rigorous authentication", hadiths: "5,761 hadiths" },
                { name: "Sunan Ibn Majah", desc: "Sixth canonical book", hadiths: "4,341 hadiths" },
              ].map((book) => (
                <Card key={book.name} className="bg-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3
                      className="text-xl font-semibold text-card-foreground mb-2 cursor-pointer hover:text-accent"
                      onClick={() => handleExplore(book.name)}
                    >
                      {book.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 flex-grow">{book.desc}</p>
                    <p className="text-accent text-sm font-medium mb-4">{book.hadiths}</p>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleExplore(book.name)}
                      >
                        Explore
                      </Button>
                      <ShareDialog
                        bookName={book.name}
                        bookUrl={typeof window !== 'undefined' ? `${window.location.origin}/search-results?q=${encodeURIComponent(book.name)}` : `/search-results?q=${encodeURIComponent(book.name)}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* User Onboarding */}
      {shouldShowOnboarding && (
        <UserOnboarding 
          currentPage="/beginner" 
          onClose={skipOnboarding} 
        />
      )}
    </div>
  );
};

export default Beginner;