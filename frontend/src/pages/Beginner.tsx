import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";

const Beginner = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchText)}`);
    }
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
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground text-center mb-4">
            Beginner Hadith Search
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-lg">
            Simple search to find authentic hadiths easily
          </p>

          <Card className="bg-card shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Search for Hadith
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter keywords or topic..."
                      className="bg-input border-border pr-12"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground">Popular Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Prayer')}>Prayer</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Charity')}>Charity</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Fasting')}>Fasting</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Hajj')}>Hajj</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground">Collections</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Sahih Bukhari')}>Sahih Bukhari</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Sahih Muslim')}>Sahih Muslim</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/search-results?q=Abu Dawud')}>Abu Dawud</Button>
                    </div>
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

          <div className="mt-8 text-center text-muted-foreground">
            <p className="text-sm">
              Need more search options? Try <a href="/advanced" className="text-accent hover:underline">Advanced Mode</a>
            </p>
          </div>

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
                      onClick={() => navigate(`/search-results?q=${encodeURIComponent(book.name)}`)}
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
                      {user ? (
                        <ShareDialog 
                          bookName={book.name} 
                          bookUrl={`${window.location.origin}/search-results?q=${encodeURIComponent(book.name)}`}
                        />
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Login Required",
                              description: "Please login to share books",
                              variant: "destructive",
                            });
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
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

export default Beginner;
