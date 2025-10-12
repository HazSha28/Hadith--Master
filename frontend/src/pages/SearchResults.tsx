import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get("q") || "";
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareContent, setShareContent] = useState({ title: "", url: "" });

  const handleShare = (hadith: any) => {
    const url = window.location.href;
    setShareContent({ 
      title: `${hadith.collection} - ${hadith.hadithNumber}`, 
      url 
    });
    setShareDialogOpen(true);
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

  // Mock results - in a real app, this would fetch from your database
  const results = [
    {
      id: 1,
      collection: "Sahih Bukhari",
      hadithNumber: "5063",
      arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
      translation: "Actions are according to intentions, and everyone will get what was intended.",
      narrator: "Umar ibn Al-Khattab",
      relevance: 95,
    },
    {
      id: 2,
      collection: "Sahih Muslim",
      hadithNumber: "1599",
      arabicText: "مَنْ غَشَّنَا فَلَيْسَ مِنَّا",
      translation: "He who cheats is not one of us.",
      narrator: "Abu Hurairah",
      relevance: 88,
    },
    {
      id: 3,
      collection: "Sunan Abu Dawud",
      hadithNumber: "4031",
      arabicText: "الْمُسْلِمُ أَخُو الْمُسْلِمِ",
      translation: "A Muslim is the brother of a Muslim. He neither oppresses him nor humiliates him nor looks down upon him.",
      narrator: "Abdullah ibn Umar",
      relevance: 82,
    },
  ];

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

          <div className="space-y-6">
            {results.map((result) => (
              <Card key={result.id} className="bg-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-accent" />
                      <div>
                        <h3 
                          className="font-semibold text-card-foreground cursor-pointer hover:text-accent"
                          onClick={() => navigate(`/search-results?q=${encodeURIComponent(result.collection)}`)}
                        >
                          {result.collection} - #{result.hadithNumber}
                        </h3>
                        <p 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-accent"
                          onClick={() => navigate(`/search-results?q=${encodeURIComponent(result.narrator)}`)}
                        >
                          Narrated by {result.narrator}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                        {result.relevance}% match
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(result)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-right text-xl font-arabic text-card-foreground mb-2" dir="rtl">
                        {result.arabicText}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-card-foreground leading-relaxed">
                        {result.translation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                    <Button variant="secondary" size="sm">
                      Save to Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <Card className="bg-card">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  No Results Found
                </h3>
                <p className="text-muted-foreground">
                  Try different keywords or browse our collections
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Hadith</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this Hadith
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={copyToClipboard}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('whatsapp')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('email')}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('telegram')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('twitter')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('instagram')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
              Instagram
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchResults;
