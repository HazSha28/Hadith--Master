import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Search, BookOpen, Mic, Bookmark, Share2 } from "lucide-react";
import { VoiceSearch } from "@/components/VoiceSearch";
import { FileUpload } from "@/components/FileUpload";
import { ShareDialog } from "@/components/ShareDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = () => {
    const query = searchText || selectedBook || selectedAuthor || selectedNarrator;
    if (query) {
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
    }
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Discover Authentic Hadith Literature
              </h1>
              <p className="text-lg text-muted-foreground">
                Search through thousands of authentic hadiths from the six canonical books
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Search Hadith Collection
                </h2>
                <p className="text-muted-foreground">
                  Find authentic hadiths from the six canonical books
                </p>
              </div>
              
              <Card className="bg-card shadow-lg border-0">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Main Search Input */}
                    <div className="relative">
                      <Textarea
                        placeholder="Search for hadiths, narrators, books, or topics..."
                        className="bg-input border-border min-h-[100px] resize-none text-lg p-4 pr-16"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      <div className="absolute right-4 top-4 flex flex-col gap-2">
                        <VoiceSearch onTranscript={(text) => setSearchText(prev => prev + " " + text)} />
                        <FileUpload onExtractedText={(text) => setSearchText(prev => prev + " " + text)} />
                      </div>
                    </div>

                    {/* Filter Options */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground">Filter by:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Book</label>
                          <select 
                            className="w-full p-3 bg-input border-border rounded-md"
                            value={selectedBook}
                            onChange={(e) => handleBookSelect(e.target.value)}
                          >
                            <option value="">All Books</option>
                            <option value="Sahih Bukhari">Sahih Bukhari</option>
                            <option value="Sahih Muslim">Sahih Muslim</option>
                            <option value="Sunan Abu Dawud">Sunan Abu Dawud</option>
                            <option value="Jami at-Tirmidhi">Jami at-Tirmidhi</option>
                            <option value="Sunan an-Nasa'i">Sunan an-Nasa'i</option>
                            <option value="Sunan Ibn Majah">Sunan Ibn Majah</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Author</label>
                          <select 
                            className="w-full p-3 bg-input border-border rounded-md"
                            value={selectedAuthor}
                            onChange={(e) => handleAuthorSelect(e.target.value)}
                          >
                            <option value="">All Authors</option>
                            <option value="Imam Bukhari">Imam Bukhari</option>
                            <option value="Imam Muslim">Imam Muslim</option>
                            <option value="Abu Dawud">Abu Dawud</option>
                            <option value="at-Tirmidhi">at-Tirmidhi</option>
                            <option value="an-Nasa'i">an-Nasa'i</option>
                            <option value="Ibn Majah">Ibn Majah</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Narrator</label>
                          <select 
                            className="w-full p-3 bg-input border-border rounded-md"
                            value={selectedNarrator}
                            onChange={(e) => handleNarratorSelect(e.target.value)}
                          >
                            <option value="">All Narrators</option>
                            <option value="Abu Hurairah">Abu Hurairah</option>
                            <option value="Aisha">Aisha</option>
                            <option value="Umar ibn al-Khattab">Umar ibn al-Khattab</option>
                            <option value="Ali ibn Abi Talib">Ali ibn Abi Talib</option>
                            <option value="Abdullah ibn Abbas">Abdullah ibn Abbas</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Search Button */}
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg font-medium"
                      onClick={handleSearch}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      Search Hadiths
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hadith Collections */}
            <div>
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
                          onClick={() => navigate(`/collections/${book.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Explore
                        </Button>
                        <ShareDialog 
                          bookName={book.name} 
                          bookUrl={`${window.location.origin}/collections/${book.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </ShareDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
