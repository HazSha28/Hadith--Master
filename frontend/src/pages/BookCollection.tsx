import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, ArrowLeft, Loader2, Bookmark, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/ShareDialog';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

/* ================= TYPES ================= */

interface Hadith {
  id: string;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: string;
    bookNumber: number;
    hadithNumber: number;
  };
  chapter: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  authenticity: 'sahih' | 'hasan' | 'daif' | 'mutawatir';
  author?: string;
  likes?: number;
  isLiked?: boolean;
}

/* ================= COMPONENT ================= */

const BookCollection: React.FC = () => {
  const { bookName } = useParams<{ bookName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [filteredHadiths, setFilteredHadiths] = useState<Hadith[]>([]);
  const [bookMetadata, setBookMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedHadiths, setSavedHadiths] = useState<string[]>([]);

  /* ================= LOAD DATA FROM FIRESTORE ================= */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const bookId = decodeURIComponent(bookName!);

        // 🔹 Book metadata
        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) setBookMetadata(bookSnap.data());

        // 🔹 Hadiths
        const hadithRef = collection(db, "books", bookId, "hadiths");
        const snap = await getDocs(hadithRef);

        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          likes: Math.floor(Math.random() * 100),
          isLiked: false
        })) as Hadith[];

        setHadiths(list);
        setFilteredHadiths(list);

        const saved = localStorage.getItem("savedHadiths");
        if (saved) setSavedHadiths(JSON.parse(saved));
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load hadiths",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookName]);

  /* ================= SEARCH ================= */

  useEffect(() => {
    let f = hadiths;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(h =>
        h.english.text.toLowerCase().includes(q) ||
        h.arabic.includes(searchTerm) ||
        h.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    setFilteredHadiths(f);
  }, [searchTerm, hadiths]);

  /* ================= ACTIONS ================= */

  const handleSaveHadith = (h: Hadith) => {
    const u = [...savedHadiths, h.id];
    setSavedHadiths(u);
    localStorage.setItem("savedHadiths", JSON.stringify(u));
    toast({ title: "Saved", description: "Hadith saved" });
  };

  const handleRemoveHadith = (id: string) => {
    const u = savedHadiths.filter(x => x !== id);
    setSavedHadiths(u);
    localStorage.setItem("savedHadiths", JSON.stringify(u));
    toast({ title: "Removed", description: "Hadith removed" });
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/beginner")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold mt-4">
          {bookMetadata?.name || bookName}
        </h1>

        <p className="text-muted-foreground mb-6">
          {bookMetadata?.description}
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search hadiths..."
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHadiths.map(h => (
            <Card key={h.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  {h.english.text}
                </CardTitle>
                <CardDescription>
                  Narrated by {h.english.narrator}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-right mb-3 font-arabic">
                  {h.arabic}
                </div>

                <Badge>{h.authenticity}</Badge>

                <div className="flex gap-2 mt-4">
                  {savedHadiths.includes(h.id) ? (
                    <Button size="sm" variant="outline" onClick={() => handleRemoveHadith(h.id)}>
                      Remove
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleSaveHadith(h)}>
                      Save
                    </Button>
                  )}

                  <ShareDialog hadith={h}>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </ShareDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BookCollection;
