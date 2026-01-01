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
  Users 
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

const Advanced = () => {
  // State management
  const [searchText, setSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recite' | 'saved'>('search');
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  
  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Load saved hadiths from localStorage on component mount
  useEffect(() => {
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

  const loadPracticeHadith = async () => {
    try {
      setLoading(true);
      const dailyHadith = await getDailyHadith();
      setHadith(dailyHadith);
    } catch (error) {
      console.error("Failed to load daily hadith:", error);
      toast({
        title: "Error",
        description: "Failed to load hadith. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewHadith = async () => {
    try {
      setLoading(true);
      const newHadith = await forceRefreshDailyHadith();
      setHadith(newHadith);
    } catch (error) {
      console.error("Failed to load new hadith:", error);
      toast({
        title: "Error",
        description: "Failed to load new hadith. Please try again.",
        variant: "destructive",
      });
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

    navigate(`/search-results?q=${encodeURIComponent(query)}`);
  };

  const handleBookSelect = (value: string) => {
    setSelectedBook(value);
    navigate(`/search-results?q=${encodeURIComponent(value)}`);
  };

  const handleAuthorSelect = (value: string) => {
    setSelectedAuthor(value);
    navigate(`/search-results?q=${encodeURIComponent(value)}`);
  };

  const handleNarratorSelect = (value: string) => {
    setSelectedNarrator(value);
    navigate(`/search-results?q=${encodeURIComponent(value)}`);
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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to explore books",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    navigate(`/search-results?q=${encodeURIComponent(bookName)}`);
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
                        <SelectItem value="book1" className="text-[rgb(178,92,27)]">Sahih al-Bukhari</SelectItem>
                        <SelectItem value="book2" className="text-[rgb(178,92,27)]">Sahih Muslim</SelectItem>
                        <SelectItem value="book3" className="text-[rgb(178,92,27)]">sunan an-Nasa'i</SelectItem>
                        <SelectItem value="book4" className="text-[rgb(178,92,27)]">Sunan Abi Dawud</SelectItem>
                        <SelectItem value="book5" className="text-[rgb(178,92,27)]">Jami'at-Tirmidhi</SelectItem>
                        <SelectItem value="book6" className="text-[rgb(178,92,27)]">Sunan Ibn Majah</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedAuthor} onValueChange={handleAuthorSelect}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Author's Name" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="author1">Imam al-Bukhaari</SelectItem>
                        <SelectItem value="author2">Imam Muslim</SelectItem>
                        <SelectItem value="author3">Imam Abu Dawood</SelectItem>
                        <SelectItem value="author4">Imam al-Tirmidhi</SelectItem>
                        <SelectItem value="author5">Imam al-Nasaa'i</SelectItem>
                        <SelectItem value="author6">Imam Ibn Maajah</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedNarrator} onValueChange={handleNarratorSelect}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Narrator's Names" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-[300px]">
                        <SelectItem value="narrator1" className="text-[rgb(178,92,27)]">Abu Hurairah (Abdur-Rahmaan)(radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator2" className="text-[rgb(178,92,27)]">Abdullaah Ibn Abbaas (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator3" className="text-[rgb(178,92,27)]">Aa'ishah Siddeeqa (radi-Allaahu 'anhaa)</SelectItem>
                        <SelectItem value="narrator4" className="text-[rgb(178,92,27)]">Abdullaah Ibn Umar (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator5" className="text-[rgb(178,92,27)]">Jaabir Ibn Abdullaah (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator6" className="text-[rgb(178,92,27)]">Anas Ibn Maalik (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator7" className="text-[rgb(178,92,27)]">Abu Sa'eed al-Khudree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator8">Abdullaah Ibn Amr Ibn al-Aas (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator9">Alee Ibn Abee Taalib (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator10">Umar Ibn al-Khattaab (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator11">Abu Bakr as-Siddeeq (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator12">Uthmaan Ibn Affaan Dhun-Noorain (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator13">Umm Salamah (radi-Allaahu 'anhaa)</SelectItem>
                        <SelectItem value="narrator14">Abu Moosaa al-Asha'aree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator15">Abu Dharr al-Ghaffaree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator16">Abu Ayyoob al-Ansaaree (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator17">Ubayy Ibn Ka'ab (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator18">Mu'aadh Ibn Jabal (radi-Allaahu 'anhu)</SelectItem>
                        <SelectItem value="narrator19" className="text-[rgb(124,6,6)]">Saalim Ibn Abdullaah Ibn Umar</SelectItem>
                        <SelectItem value="narrator20" className="text-[rgb(124,6,6)]">Urwah Ibn Zubair</SelectItem>
                        <SelectItem value="narrator21" className="text-[rgb(124,6,6)]">Sa'eed Ibn al-Mussayab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice Recitation Tab */}
          {activeTab === 'recite' && (
            <div className="space-y-8">
              <Card className="bg-card shadow-lg">
                <CardHeader>
                  <CardTitle>Practice Hadith Recitation</CardTitle>
                  <CardDescription>
                    Record your recitation of hadiths and improve your pronunciation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder />
                </CardContent>
              </Card>
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
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Reference: {hadith.bookName || `Book ${hadith.reference.book}`}, Hadith {hadith.reference.hadith}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveHadith(hadith)}
                        disabled={savedHadiths.some(h => h.id === hadith.id)}
                      >
                        {savedHadiths.some(h => h.id === hadith.id) ? (
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                          <Bookmark className="mr-2 h-4 w-4" />
                        )}
                        {savedHadiths.some(h => h.id === hadith.id) ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hadith available. Try searching first.
                </div>
              )}
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
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{book.name}</h3>
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
