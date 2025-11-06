import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2 } from "lucide-react";
import { VoiceSearch } from "@/components/VoiceSearch";
import { FileUpload } from "@/components/FileUpload";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";

const Index = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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
            Advanced Hadith Search
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-lg">
            Please type in the gist of the hadith or select any of the below criteria to ensure accurate search results.
          </p>

          <Card className="bg-card shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                  <div className="relative">
                    <Textarea
                      placeholder="Enter Hadith gist here..."
                      className="bg-input border-border min-h-[120px] resize-none pr-24"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <VoiceSearch onTranscript={(text) => setSearchText(prev => prev + " " + text)} />
                      <FileUpload onExtractedText={(text) => setSearchText(prev => prev + " " + text)} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select>
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

                    <Select>
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

                    <Select>
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

                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Search
                </Button>
              </div>
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

export default Index;
