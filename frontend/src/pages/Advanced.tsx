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
import { HadithSearchBar } from "@/components/HadithSearchBar";
import { fetchRandomHadith } from "@/lib/hadithService";
import { getDailyHadith, forceRefreshDailyHadith } from "@/utils/dailyHadith";
import { VoiceSearch } from "@/components/VoiceSearch";
import { FileUpload } from "@/components/FileUpload";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

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
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'recite' | 'saved'>('search');
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [isAiSearch, setIsAiSearch] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | number | null>(null);

  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Save hadiths to localStorage when they change
  useEffect(() => {
    if (savedHadiths.length > 0) {
      localStorage.setItem('savedHadiths', JSON.stringify(savedHadiths));
    }
  }, [savedHadiths]);

  useEffect(() => {
    if (user && activeTab === 'recite') {
      loadRecordings();
    }
  }, [user, activeTab]);

  const loadRecordings = async () => {
    if (!user) return;
    try {
      setLoadingRecordings(true);
      let querySnapshot;

      try {
        // Attempt ordered query (requires composite index)
        const q = query(
          collection(db, "recordings"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        console.warn("Ordered query failed (possibly missing index), falling back to simple query:", indexError);
        // Fallback: Get all recordings for user and sort manually in-memory
        const qSimple = query(
          collection(db, "recordings"),
          where("userId", "==", user.uid)
        );
        querySnapshot = await getDocs(qSimple);
      }

      const fetchedRecordings: Recording[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRecordings.push({ id: doc.id, ...doc.data() } as Recording);
      });

      // Sort in-memory to ensure correct order regardless of index status
      fetchedRecordings.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });

      setRecordings(fetchedRecordings);
    } catch (err) {
      console.error("Error loading recordings:", err);
      toast({
        title: "Load Error",
        description: "Failed to load your recordings. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      await deleteDoc(doc(db, "recordings", recordingId));
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      toast({
        title: "Deleted",
        description: "Recording removed successfully.",
      });
    } catch (err) {
      console.error("Error deleting recording:", err);
      toast({
        title: "Error",
        description: "Failed to delete recording.",
        variant: "destructive"
      });
    }
  };

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
    const query = searchText || selectedBook || selectedAuthor || selectedNarrator;
    if (!query) {
      toast({
        title: 'Search Empty',
        description: 'Please enter some text or select from dropdowns to search for hadiths.',
        variant: 'default',
      });
      return;
    }

    const params = new URLSearchParams();
    params.set('q', query);
    if (isAiSearch) params.set('ai', 'true');
    navigate(`/search-results?${params.toString()}`);
  };

  const handleBookSelect = (value: string) => {
    setSelectedBook(value);
    const newSearchText = searchText ? `${searchText} ${value}` : value;
    setSearchText(newSearchText);
    navigate(`/search-results?q=${encodeURIComponent(newSearchText)}`);
  };

  const handleAuthorSelect = (value: string) => {
    setSelectedAuthor(value);
    const newSearchText = searchText ? `${searchText} ${value}` : value;
    setSearchText(newSearchText);
    navigate(`/search-results?q=${encodeURIComponent(newSearchText)}`);
  };

  const handleNarratorSelect = (value: string) => {
    setSelectedNarrator(value);
    const newSearchText = searchText ? `${searchText} ${value}` : value;
    setSearchText(newSearchText);
    navigate(`/search-results?q=${encodeURIComponent(newSearchText)}`);
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

  const handleRemoveSaved = (id: number) => {
    setSavedHadiths(prev => {
      const updated = prev.filter(h => h.id !== id);
      // Clear localStorage if no more saved hadiths
      if (updated.length === 0) {
        localStorage.removeItem('savedHadiths');
      }
      return updated;
    });

    toast({
      title: 'Removed',
      description: 'Hadith has been removed from your collection.',
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
              <Button
                variant="ghost"
                className={`rounded-none border-b-2 ${activeTab === 'saved' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('saved')}
                disabled={savedHadiths.length === 0}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                My Collection {savedHadiths.length > 0 && `(${savedHadiths.length})`}
              </Button>
            </div>
          </div>

          {/* Search Tab */}
          {activeTab === 'search' && (
            <Card className="bg-card shadow-lg mb-8 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Advanced Hadith Search</CardTitle>
                <CardDescription>
                  Please type in the gist of the hadith or select any of the below criteria to ensure accurate search results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="relative">
                    <Textarea
                      placeholder="Enter Hadith gist here..."
                      className="bg-input border-border min-h-[80px] resize-none pr-24"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <VoiceSearch onTranscript={(text) => setSearchText(prev => prev + " " + text)} />
                      <FileUpload onExtractedText={(text) => setSearchText(prev => prev + " " + text)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Select value={selectedBook} onValueChange={handleBookSelect}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Book Name" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Sahih al-Bukhari" className="text-[rgb(178,92,27)]">Sahih al-Bukhari</SelectItem>
                        <SelectItem value="Sahih Muslim" className="text-[rgb(178,92,27)]">Sahih Muslim</SelectItem>
                        <SelectItem value="Sunan an-Nasa'i" className="text-[rgb(178,92,27)]">Sunan an-Nasa'i</SelectItem>
                        <SelectItem value="Sunan Abi Dawud" className="text-[rgb(178,92,27)]">Sunan Abi Dawud</SelectItem>
                        <SelectItem value="Jami' at-Tirmidhi" className="text-[rgb(178,92,27)]">Jami' at-Tirmidhi</SelectItem>
                        <SelectItem value="Sunan Ibn Majah" className="text-[rgb(178,92,27)]">Sunan Ibn Majah</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedAuthor} onValueChange={handleAuthorSelect}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Author's Name" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Imam al-Bukhari">Imam al-Bukhaari</SelectItem>
                        <SelectItem value="Imam Muslim">Imam Muslim</SelectItem>
                        <SelectItem value="Imam Abu Dawood">Imam Abu Dawood</SelectItem>
                        <SelectItem value="Imam al-Tirmidhi">Imam al-Tirmidhi</SelectItem>
                        <SelectItem value="Imam al-Nasaa'i">Imam al-Nasaa'i</SelectItem>
                        <SelectItem value="Imam Ibn Maajah">Imam Ibn Maajah</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedNarrator} onValueChange={handleNarratorSelect}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Narrator's Names" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-[300px]">
                        <SelectItem value="Abu Hurairah (Abdur-Rahmaan)(radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Abu Hurairah (Abdur-Rahmaan)(radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abdullaah Ibn Abbaas (radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Abdullaah Ibn Abbaas (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Aa'ishah Siddeeqa (radi-Allaahu 'anhaa)" className="text-[rgb(178,92,27)]">Aa'ishah Siddeeqa (radi-Allaahu 'anhaa)</SelectItem>
                        <SelectItem value="Abdullaah Ibn Umar (radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Abdullaah Ibn Umar (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Jaabir Ibn Abdullaah (radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Jaabir Ibn Abdullaah (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Anas Ibn Maalik (radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Anas Ibn Maalik (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abu Sa'eed al-Khudree (radi-Allaahu 'anhu)" className="text-[rgb(178,92,27)]">Abu Sa'eed al-Khudree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abdullaah Ibn Amr Ibn al-Aas (radi-Allaahu 'anhu)">Abdullaah Ibn Amr Ibn al-Aas (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Alee Ibn Abee Taalib (radi-Allaahu 'anhu)">Alee Ibn Abee Taalib (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Umar Ibn al-Khattaab (radi-Allaahu 'anhu)">Umar Ibn al-Khattaab (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abu Bakr as-Siddeeq (radi-Allaahu 'anhu)">Abu Bakr as-Siddeeq (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Uthmaan Ibn Affaan Dhun-Noorain (radi-Allaahu 'anhu)">Uthmaan Ibn Affaan Dhun-Noorain (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Umm Salamah (radi-Allaahu 'anhaa)">Umm Salamah (radi-Allaahu 'anhaa)</SelectItem>
                        <SelectItem value="Abu Moosaa al-Asha'aree (radi-Allaahu 'anhu)">Abu Moosaa al-Asha'aree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abu Dharr al-Ghaffaree (radi-Allaahu 'anhu)">Abu Dharr al-Ghaffaree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Abu Ayyoob al-Ansaaree (radi-Allaahu 'anhu)">Abu Ayyoob al-Ansaaree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Ubayy Ibn Ka'ab (radi-Allaahu 'anhu)">Ubayy Ibn Ka'ab (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Mu'aadh Ibn Jabal (radi-Allaahu 'anhu)">Mu'aadh Ibn Jabal (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="Saalim Ibn Abdullaah Ibn Umar" className="text-[rgb(124,6,6)]">Saalim Ibn Abdullaah Ibn Umar</SelectItem>
                        <SelectItem value="Urwah Ibn Zubair" className="text-[rgb(124,6,6)]">Urwah Ibn Zubair</SelectItem>
                        <SelectItem value="Sa'eed Ibn al-Mussayab" className="text-[rgb(124,6,6)]">Sa'eed Ibn al-Mussayab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* AI Search Toggle */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{ backgroundColor: isAiSearch ? 'rgba(16, 185, 129, 0.1)' : 'transparent', border: isAiSearch ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent' }}
                    onClick={() => setIsAiSearch(!isAiSearch)}
                  >
                    <input
                      type="checkbox"
                      checked={isAiSearch}
                      onChange={() => setIsAiSearch(!isAiSearch)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-sm">Search with Agentic AI</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">Get intelligent, summarized answers powered by AI</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleSearch}
                  >
                    {isAiSearch ? (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Search Hadiths
                      </div>
                    ) : (
                      'Search Hadiths'
                    )}
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
                    <VoiceRecorder hadith={hadith || undefined} onSaveSuccess={loadRecordings} />
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

              <div className="space-y-6">
                <Card className="bg-card shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      My Recorded Recitations
                    </CardTitle>
                    <CardDescription>
                      Listen back to your saved practices.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRecordings ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : recordings.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {recordings.map((rec) => (
                          <div key={rec.id} className="flex flex-col p-3 rounded-lg border bg-accent/5 hover:bg-accent/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-sm">{rec.book}</h4>
                                <p className="text-xs text-muted-foreground">Hadith #{rec.hadithNumber}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteRecording(rec.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-3">
                              <audio src={rec.fileUrl} controls className="h-8 flex-1" />
                              <a
                                href={rec.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>

                            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {rec.createdAt?.toDate ? rec.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Mic className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No recordings yet. Start practicing!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Saved Hadiths Tab */}
          {activeTab === 'saved' && (
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
                              Reference: {savedHadith.bookName || `Book ${savedHadith.reference.book}`},
                              Hadith {savedHadith.reference.hadith}
                              {savedHadith.chapter && ` • ${savedHadith.chapter}`}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveRecordingId(activeRecordingId === savedHadith.id ? null : savedHadith.id)}
                              className={activeRecordingId === savedHadith.id ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:text-foreground"}
                            >
                              <Mic className="mr-2 h-4 w-4" />
                              Practice
                            </Button>
                          </div>

                          {activeRecordingId === savedHadith.id && (
                            <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
                              <VoiceRecorder hadith={savedHadith} onSaveSuccess={loadRecordings} />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No saved hadiths yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Save hadiths to your collection to access them here later.
                    </p>
                    <Button onClick={() => setActiveTab('search')}>
                      <Search className="mr-2 h-4 w-4" />
                      Search Hadiths
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      onClick={() => setActiveRecordingId(activeRecordingId === hadith.id ? null : hadith.id)}
                      className={activeRecordingId === hadith.id ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:text-foreground"}
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
                  {activeRecordingId === hadith.id && (
                    <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
                      <VoiceRecorder hadith={hadith} onSaveSuccess={loadRecordings} />
                    </div>
                  )}
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
    </div>
  );
};

export default Advanced;
