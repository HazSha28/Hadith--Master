import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2, Share2, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { HadithSearchBar } from "@/components/HadithSearchBar";
import { searchHadiths, searchHadithsAi, getBooks, getCategories, Hadith } from "@/lib/hadithApiService";

const highlightText = (text: string, query: string) => {
  if (!query || typeof text !== 'string') return text;

  // Split query by spaces or + signs, filtering out short words
  const terms = query.trim().split(/[\s\+]+/).filter(t => t.length > 1);
  if (terms.length === 0) return text;

  // Escape regex specials
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = terms.some(term => term.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="bg-emerald-600/40 text-emerald-900 dark:bg-emerald-500/40 dark:text-emerald-100 px-1 rounded-sm font-medium"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get("q") || "";
  const bookParam = new URLSearchParams(location.search).get("book") || undefined;
  const categoryParam = new URLSearchParams(location.search).get("category") || undefined;
  const aiSearchParam = new URLSearchParams(location.search).get("ai") === "true";

  const [searchText, setSearchText] = useState(searchQuery);
  const [results, setResults] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareContent, setShareContent] = useState({ title: "", url: "" });
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState(bookParam || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [isAiMode, setIsAiMode] = useState(aiSearchParam);
  const { user } = useAuth();
  const { toast: uiToast } = useToast();
  const [savedHadiths, setSavedHadiths] = useState<any[]>([]);
  const [detailHadith, setDetailHadith] = useState<Hadith | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Load books, categories and saved hadiths on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksData, categoriesData] = await Promise.all([
          getBooks(),
          getCategories()
        ]);
        setBooks(booksData);
        setCategories(categoriesData);

        // Load saved hadiths
        const saved = localStorage.getItem('savedHadiths');
        if (saved) {
          setSavedHadiths(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setSearchText(searchQuery);
    setSelectedBook(bookParam || "");
    setSelectedCategory(categoryParam || "");
  }, [searchQuery, bookParam, categoryParam]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setAiAnswer(null);
        setAiSources([]);

        const searchFilters = {
          book: selectedBook || undefined,
          category: selectedCategory || undefined,
          page: 1,
          limit: 20
        };

        if (isAiMode) {
          // Always skip the AI summary to just fetch results as requested by user
          const shouldSkipSummary = true;

          const apiResults = await searchHadithsAi(q, {
            book: selectedBook || undefined,
            category: selectedCategory || undefined,
            narrator: selectedNarrator || undefined,
            author: selectedAuthor || undefined,
            characters: selectedCharacters || undefined,
            grade: selectedGrade || undefined,
            skipSummary: shouldSkipSummary
          });

          if (!cancelled && apiResults.success) {
            setAiAnswer(apiResults.answer);
            setAiSources(apiResults.sources);
            // Map sources to results for common rendering if compatible
            setResults(apiResults.sources.map((s: any) => ({
              id: s.hadith_number,
              arabic: s.arabic_text,
              english: { text: s.english_translation, narrator: s.narrator },
              book: s.book_name,
              reference: { book: s.book_name, hadith: s.hadith_number },
              grade: s.grade,
              chapter: s.kitab,
              category: s.bab,
              isnad: s.isnad,
              matn: s.matn,
              tags: s.themes || []
            } as any)));
          }
        } else {
          const apiResults = await searchHadiths(q, searchFilters);
          if (!cancelled && apiResults) {
            setResults(apiResults.hadiths);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(isAiMode ? "AI Search failed. Please try a normal search." : "Failed to load results. Please try again.");
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedBook, selectedCategory, isAiMode]);

  const handleSearch = () => {
    const q = searchText.trim();
    if (!q) return;
    const params = new URLSearchParams();
    params.set("q", q);
    if (selectedBook) params.set("book", selectedBook);
    if (selectedCategory) params.set("category", selectedCategory);
    if (isAiMode) params.set("ai", "true");
    navigate(`/search-results?${params.toString()}`);
  };

  const handleShare = (hadith: Hadith) => {
    const url = window.location.href;
    setShareContent({
      title: `${hadith.book || "Hadith"} - #${hadith.reference?.hadith || hadith.id}`,
      url
    });
    setShareDialogOpen(true);
  };

  const handleSaveHadith = (hadithToSave: any) => {
    if (!user) {
      uiToast({
        title: 'Login Required',
        description: 'Please login to save hadiths',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setSavedHadiths(prev => {
      const exists = prev.some(h => h.id === hadithToSave.id);
      if (exists) {
        uiToast({
          title: 'Already Saved',
          description: 'This hadith is already in your saved collection.',
        });
        return prev;
      }

      const updated = [...prev, { ...hadithToSave, status: 'saved' as const }];
      localStorage.setItem('savedHadiths', JSON.stringify(updated));

      uiToast({
        title: 'Hadith Saved',
        description: 'The hadith has been added to your collection.',
      });
      return updated;
    });
  };

  const handleViewDetails = (hadith: any) => {
    setDetailHadith(hadith);
    setDetailDialogOpen(true);
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

          <div className="mb-6">
            <HadithSearchBar
              value={searchText}
              onValueChange={setSearchText}
              onSearch={handleSearch}
              placeholder="Refine your search..."
              disabled={loading}
            />
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {showFilters && (
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Book</label>
                      <select
                        value={selectedBook}
                        onChange={(e) => setSelectedBook(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Books</option>
                        {books.map((book) => (
                          <option key={book.id} value={book.name}>
                            {book.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBook('');
                        setSelectedCategory('');
                        setSelectedNarrator('');
                        setSelectedAuthor('');
                        setSelectedCharacters('');
                        setSelectedGrade('');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button onClick={handleSearch}>
                      Apply Filters
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Narrator</label>
                      <input
                        type="text"
                        value={selectedNarrator}
                        onChange={(e) => setSelectedNarrator(e.target.value)}
                        placeholder="e.g. Abu Hurairah"
                        className="w-full p-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Author/Compiler</label>
                      <input
                        type="text"
                        value={selectedAuthor}
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                        placeholder="e.g. Imam Bukhari"
                        className="w-full p-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Character Names</label>
                      <input
                        type="text"
                        value={selectedCharacters}
                        onChange={(e) => setSelectedCharacters(e.target.value)}
                        placeholder="e.g. Abu Bakr"
                        className="w-full p-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Grading</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">All Grades</option>
                        <option value="Sahih">Sahih</option>
                        <option value="Hasan">Hasan</option>
                        <option value="Da'if">Da'if</option>
                        <option value="Maudu">Maudu</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && loadError && (
            <Card className="bg-card">
              <CardContent className="p-6 text-center text-destructive">
                {loadError}
              </CardContent>
            </Card>
          )}

          {aiAnswer && (
            <Card className="mb-8 border-accent/20 bg-accent/5 overflow-hidden">
              <div className="bg-accent/10 px-6 py-2 border-b border-accent/20">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">AI Generated Response</span>
              </div>
              <CardContent className="p-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {aiAnswer}
                </p>
              </CardContent>
            </Card>
          )}

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
                          onClick={() => navigate(`/search-results?q=${encodeURIComponent(result.book || "Hadith")}`)}
                        >
                          {(result.book || "Hadith")} - #{result.reference?.hadith || result.id}
                        </h3>
                        <p
                          className="text-sm text-muted-foreground cursor-pointer hover:text-accent"
                          onClick={() => navigate(`/search-results?q=${encodeURIComponent(result.english?.narrator || "")}`)}
                        >
                          Narrated by {highlightText(result.english?.narrator || "Unknown", searchQuery)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        {result.arabic}
                      </p>
                    </div>

                    <div>
                      <p className="text-card-foreground leading-relaxed">
                        {highlightText(result.english?.text || "", searchQuery)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDetails(result)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSaveHadith(result)}
                      disabled={savedHadiths.some(h => h.id === result.id)}
                    >
                      {savedHadiths.some(h => h.id === result.id) ? 'Saved' : 'Save to Collection'}
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              {detailHadith?.book} - #{detailHadith?.reference?.hadith || detailHadith?.id}
            </DialogTitle>
            <DialogDescription>
              Details and Scholarly Information
            </DialogDescription>
          </DialogHeader>

          {detailHadith && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Arabic Text</h4>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-right text-2xl font-arabic leading-loose text-card-foreground" dir="rtl">
                    {detailHadith.arabic}
                  </p>
                </div>
              </div>

              {detailHadith.isnad && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chain of Narrators (Isnad)</h4>
                  <p className="text-sm italic leading-relaxed text-foreground bg-muted/30 p-4 rounded border-l-4 border-accent">
                    {detailHadith.isnad}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">English Translation</h4>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-accent">
                    Narrated by {highlightText(detailHadith.english?.narrator || "Unknown", searchQuery)}
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {highlightText(detailHadith.english?.text || "", searchQuery)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Grade</h4>
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                    {detailHadith.grade || detailHadith.difficulty || "Unknown"}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detailHadith.tags?.map((tag, i) => (
                      <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                        {tag}
                      </span>
                    )) || "None"}
                  </div>
                </div>
              </div>

              {detailHadith.matn && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scholarly Commentary (Sharh)</h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {detailHadith.matn}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('twitter')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => shareToSocial('instagram')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
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
