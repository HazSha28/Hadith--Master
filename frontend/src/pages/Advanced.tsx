import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  BookOpen,
  Mic,
  Search,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Users,
  Heart,
  Sparkles,
  Share2,
  Play,
  Calendar,
  Clock,
  ExternalLink
} from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";
import VoiceRecorder from "@/components/VoiceRecorder";
import VoiceSearch from "@/components/VoiceSearch";
import FileUpload from "@/components/FileUpload";
import { HadithSearchBar } from "@/components/HadithSearchBar";
import { fetchRandomHadith } from "@/lib/hadithService";
import { getDailyHadith, forceRefreshDailyHadith } from "@/utils/dailyHadith";
import { UserOnboarding } from "@/components/UserOnboarding";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { testApiConnection, testAiApiConnection } from "@/lib/hadithApiService";

type Hadith = {
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
  status?: 'saved' | 'viewed' | 'new';
};

type Recording = {
  id: string;
  book: string;
  hadithNumber: string;
  fileUrl: string;
  createdAt: any;
};

const Advanced = () => {
  // State management
  const [searchText, setSearchText] = useState("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'recite'>('search');
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [isAiSearch, setIsAiSearch] = useState(true);

  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Onboarding hook
  const { shouldShowOnboarding, skipOnboarding } = useUserOnboarding('/advanced');

  // Load saved hadiths from localStorage on component mount
  useEffect(() => {
    loadPracticeHadith();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedHadiths');
      if (saved) {
        try {
          setSavedHadiths(JSON.parse(saved));
        } catch (error) {
          console.error('Error parsing saved hadiths:', error);
          localStorage.removeItem('savedHadiths');
        }
      }
    }
  }, []);

  // Test API connections
  const testApiConnections = async () => {
    console.log('Testing API connections...');
    
    try {
      const normalApiWorking = await testApiConnection();
      const aiApiWorking = await testAiApiConnection();
      
      console.log('Normal API working:', normalApiWorking);
      console.log('AI API working:', aiApiWorking);
      
      if (!normalApiWorking) {
        toast({
          title: 'API Connection Issue',
          description: 'Normal search API is not responding. Please check the backend server.',
          variant: 'destructive'
        });
      }
      
      if (!aiApiWorking) {
        toast({
          title: 'AI API Connection Issue',
          description: 'AI search API is not responding. Please check the backend server.',
          variant: 'destructive'
        });
      }
      
      if (normalApiWorking && aiApiWorking) {
        console.log('All API connections are working properly!');
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      toast({
        title: 'API Connection Test Failed',
        description: 'Unable to connect to the backend server. Please check if the server is running.',
        variant: 'destructive'
      });
    }
  };

  // Save hadiths to localStorage when they change
  useEffect(() => {
    if (savedHadiths.length > 0) {
      localStorage.setItem('savedHadiths', JSON.stringify(savedHadiths));
    }
  }, [savedHadiths]);

  const loadPracticeHadith = async () => {
    try {
      setLoading(true);
      const dailyHadith = await getDailyHadith();
      setHadith(dailyHadith);
      setError(null);
    } catch (error) {
      console.error("Failed to load daily hadith:", error);
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

  useEffect(() => {
    if (activeTab === "recite" && !hadith) {
      loadPracticeHadith();
    }
  }, [activeTab, hadith]);

  const handleSearch = () => {
    console.log('Advanced search triggered with text:', searchText);
    console.log('AI search mode:', isAiSearch);
    
    const query = searchText.trim();
    if (!query) {
      toast({
        title: 'Search Empty',
        description: 'Please enter some text to search for hadiths.',
        variant: 'default',
      });
      return;
    }

    // Check if it's a natural language query and enable AI mode
    const shouldUseAi = isNaturalLanguageQuery(query);
    console.log('Natural language query detected:', shouldUseAi);

    console.log('Navigating to search results with query:', query);
    const params = new URLSearchParams();
    params.set('q', query);
    
    if (shouldUseAi) params.set('ai', 'true');
    
    const searchUrl = `/search-results?${params.toString()}`;
    console.log('Search URL:', searchUrl);
    
    navigate(searchUrl);
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
      toast({
        title: 'Hadith Saved',
        description: 'The hadith has been added to your collection.',
      });
      return updated;
    });
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground text-center mb-4">
            Advanced Hadith Study
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-lg">
            Comprehensive tools for in-depth hadith study and memorization
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 border-b">
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
                className={`rounded-none border-b-2 ${activeTab === 'recite' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('recite')}
              >
                <Mic className="mr-2 h-4 w-4" />
                Practice Recitation
              </Button>
            </div>
          </div>

          {/* Search Tab */}
          {activeTab === 'search' && (
            <Card className="bg-card shadow-lg mb-8 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Advanced Hadith Search</CardTitle>
                <CardDescription>
                  Please type in the gist of the hadith to search for accurate results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-3xl mx-auto">
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
                    {/* Voice + Upload buttons */}
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <VoiceSearch
                        onTranscript={(text) =>
                          setSearchText((prev) => (prev + " " + text).trim())
                        }
                      />
                      <FileUpload
                        onExtractedText={(text) => {
                          setSearchText(text.trim());
                          // Auto-trigger AI search immediately after upload
                          const params = new URLSearchParams();
                          params.set("q", text.trim());
                          params.set("ai", "true");
                          navigate(`/search-results?${params.toString()}`);
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleSearch}
                  >
                    Search Hadiths
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice Recitation Tab */}
          {activeTab === 'recite' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card className="bg-card shadow-lg">
                  <CardHeader>
                    <CardTitle>Practice Hadith Recitation</CardTitle>
                    <CardDescription>
                      Record your recitation and compare with the text.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VoiceRecorder hadith={hadith || undefined} />
                  </CardContent>
                </Card>

                {hadith && (
                  <Card className="bg-card shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Target Hadith</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-right text-xl leading-loose font-arabic mb-4">
                        {hadith.arabic}
                      </div>
                      <p className="text-sm text-foreground">{hadith.english.text}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Daily Hadith Section */}
          <Card className="bg-card shadow-lg mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daily Hadith</CardTitle>
                  <CardDescription>
                    Practice reciting and memorizing this hadith
                  </CardDescription>
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
                    onClick={loadPracticeHadith}
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
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log('Practice recitation')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Practice
                    </Button>
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
                        bookUrl={`${window.location.origin}/search-results?q=${encodeURIComponent(book.name)}`}
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
          currentPage="/advanced" 
          onClose={skipOnboarding} 
        />
      )}
    </div>
  );
};

export default Advanced;
