import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mic, Upload, Share2 } from "lucide-react";

const Beginner = () => {
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
                      className="bg-input border-border pr-32"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Mic className="h-5 w-5 text-muted-foreground hover:text-accent" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Upload className="h-5 w-5 text-muted-foreground hover:text-accent" />
                      </Button>
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground">Popular Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm">Prayer</Button>
                      <Button variant="secondary" size="sm">Charity</Button>
                      <Button variant="secondary" size="sm">Fasting</Button>
                      <Button variant="secondary" size="sm">Hajj</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground">Collections</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm">Sahih Bukhari</Button>
                      <Button variant="secondary" size="sm">Sahih Muslim</Button>
                      <Button variant="secondary" size="sm">Abu Dawud</Button>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{book.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3 flex-grow">{book.desc}</p>
                    <p className="text-accent text-sm font-medium mb-4">{book.hadiths}</p>
                    <div className="flex gap-2 mt-auto">
                      <Button variant="secondary" size="sm" className="flex-1">
                        Explore
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
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
