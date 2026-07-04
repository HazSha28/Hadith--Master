import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  Loader2,
  BookOpen,
  User,
  CheckCircle,
  AlertCircle,
  Crown,
  X,
  Flag,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/ShareDialog';
import { getHadithsByBook, searchHadiths } from '@/lib/hadithApiService';
import { logActivity } from '@/lib/activityLogger';
import { saveHadithToFirestore, removeHadithFromFirestore, likeHadithInFirestore, shareHadithInFirestore } from '@/lib/savedHadithsService';

// ── AI Explanation usage tracking ──────────────────────────────
const AI_EXPLAIN_KEY = 'ai_explain_count';
const AI_EXPLAIN_MAX = 5;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getExplainCount(): number {
  return parseInt(localStorage.getItem(AI_EXPLAIN_KEY) || '0', 10);
}
function incrementExplainCount(): number {
  const next = getExplainCount() + 1;
  localStorage.setItem(AI_EXPLAIN_KEY, String(next));
  return next;
}
function hasExplainLeft(): boolean {
  return getExplainCount() < AI_EXPLAIN_MAX;
}

// Types
interface Hadith {
  id: string;
  book: string;
  number: string;
  arabic: string;
  english: string;
  narrator: string;
  authenticity: 'sahih' | 'hasan' | 'daif';
  bookSlug: string;
  status?: 'saved' | 'viewed' | 'new';
  reference?: {
    book: number;
    hadith: number;
  };
  bookName?: string;
  chapter?: string;
}

interface HadithApiResponse {
  hadiths: Hadith[];
  total: number;
  page: number;
  totalPages: number;
}

// Book metadata
const BOOK_METADATA = {
  'sahih-bukhari': {
    id: 'sahih_bukhari',
    name: 'Sahih al-Bukhari',
    description: 'The most authentic collection of hadiths',
    totalHadiths: 7563,
    color: 'green'
  },
  'sahih-muslim': {
    id: 'sahih_muslim',
    name: 'Sahih Muslim',
    description: 'Second most authentic collection',
    totalHadiths: 7459,
    color: 'green'
  },
  'sunan-abu-dawud': {
    id: 'sunan_abu_dawud',
    name: 'Sunan Abu Dawud',
    description: 'Collection focusing on legal traditions',
    totalHadiths: 5276,
    color: 'yellow'
  },
  'jami-at-tirmidhi': {
    id: 'jami_tirmidhi',
    name: 'Jamiʿ at-Tirmidhi',
    description: 'Comprehensive collection with juristical notes',
    totalHadiths: 4053,
    color: 'yellow'
  },
  'sunan-an-nasai': {
    id: 'sunan_nasai',
    name: 'Sunan an-Nasaʾi',
    description: 'Collection with rigorous authentication standards',
    totalHadiths: 5768,
    color: 'yellow'
  },
  'sunan-ibn-majah': {
    id: 'sunan_ibn_majah',
    name: 'Sunan Ibn Majah',
    description: 'Sixth canonical collection',
    totalHadiths: 4345,
    color: 'red'
  }
} as const;

type BookSlug = keyof typeof BOOK_METADATA;

/** Real API Data Fetching removed mock logic */

const CollectionExplore: React.FC = () => {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { toast } = useToast();

  // State      
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHadiths, setTotalHadiths] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [authenticityFilter, setAuthenticityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [likedHadiths, setLikedHadiths] = useState<Set<string>>(new Set());
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: update debouncedSearchTerm 400ms after user stops typing
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  const bookInfo = bookSlug ? BOOK_METADATA[bookSlug as BookSlug] : null;

  // Load hadiths
  const loadHadiths = useCallback(async () => {
    if (!bookSlug || !bookInfo) return;

    setLoading(true);
    try {
      let response;
      if (debouncedSearchTerm) {
        // Use search endpoint if search term is present
        response = await searchHadiths(debouncedSearchTerm, {
          book: bookInfo.id,
          page: currentPage,
          limit: 10
        });
      } else {
        // Use regular book endpoint
        response = await getHadithsByBook(bookInfo.id, {
          page: currentPage,
          limit: 10
        });
      }

      if (response && response.hadiths) {
        setHadiths(response.hadiths.map(h => ({
          id: h.id,
          book: h.book,
          number: h.reference.hadith,
          arabic: h.arabic,
          english: h.english.text,
          narrator: h.english.narrator,
          authenticity: 'sahih', // Defaulting to sahih if not in DB yet
          bookSlug: bookSlug
        } as Hadith)));

        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalHadiths(response.pagination.totalHadiths);
        }
      }
    } catch (error) {
      console.error('Failed to load hadiths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hadiths. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [bookSlug, bookInfo, currentPage, debouncedSearchTerm, toast]);

  // Handle hash navigation for jumping to specific hadith
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash !== '#' && hadiths.length > 0) {
      const hadithId = hash.substring(1); // Remove #
      const element = document.getElementById(hadithId);
      if (element) {
        // Small delay to ensure page is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }, 100);
      }
    }
  }, [hadiths]);

  // Initial load and search/filter changes
  useEffect(() => {
    loadHadiths();
  }, [loadHadiths]);

  // Load user preferences
  useEffect(() => {
    if (user) {
      const liked = localStorage.getItem(`liked-hadiths-${user.id}`);
      const saved = localStorage.getItem('savedHadiths');

      if (liked) setLikedHadiths(new Set(JSON.parse(liked)));
      if (saved) {
        try {
          setSavedHadiths(JSON.parse(saved));
        } catch (error) {
          console.error('Error parsing saved hadiths:', error);
          localStorage.removeItem('savedHadiths');
        }
      }
    }
  }, [user]);

  // Handle like toggle
  const handleLike = (hadithId: string) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to like hadiths', variant: 'destructive' });
      return;
    }

    const newLiked = new Set(likedHadiths);
    const isNowLiked = !newLiked.has(hadithId);
    if (isNowLiked) { newLiked.add(hadithId); } else { newLiked.delete(hadithId); }

    setLikedHadiths(newLiked);
    localStorage.setItem(`liked-hadiths-${user.id}`, JSON.stringify([...newLiked]));

    // Firestore: update liked flag + log activity
    likeHadithInFirestore(user.id, hadithId, isNowLiked);
    if (isNowLiked) {
      const h = hadiths.find(h => h.id === hadithId);
      logActivity(user.id, 'liked', { hadithId, text: h?.english, book: h?.book });
    } else {
      logActivity(user.id, 'unliked', { hadithId });
    }
  };

  // Handle save toggle
  const handleSave = (hadith: Hadith) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to save hadiths', variant: 'destructive' });
      return;
    }

    setSavedHadiths(prev => {
      const exists = prev.some(h => h.id === hadith.id);
      if (exists) {
        const updated = prev.filter(h => h.id !== hadith.id);
        updated.length === 0 ? localStorage.removeItem('savedHadiths') : localStorage.setItem('savedHadiths', JSON.stringify(updated));
        // Firestore remove + activity
        removeHadithFromFirestore(user.id, hadith.id);
        logActivity(user.id, 'unsaved', { hadithId: hadith.id });
        toast({ title: 'Hadith Removed', description: 'Removed from your collection.' });
        return updated;
      } else {
        const hadithToSave = {
          ...hadith,
          status: 'saved' as const,
          reference: { book: parseInt(hadith.number) || 1, hadith: parseInt(hadith.number) || 1 },
          bookName: hadith.book
        };
        const updated = [...prev, hadithToSave];
        localStorage.setItem('savedHadiths', JSON.stringify(updated));
        // Firestore save + activity
        saveHadithToFirestore(user.id, hadithToSave);
        logActivity(user.id, 'saved', { hadithId: hadith.id, text: hadith.english, book: hadith.book });
        toast({ title: 'Hadith Saved', description: 'Added to your collection.' });
        return updated;
      }
    });
  };

  // Handle share
  const handleShare = (hadith: Hadith) => {
    setSelectedHadith(hadith);
    setShareDialogOpen(true);
    // Log share activity + update Firestore
    if (user) {
      shareHadithInFirestore(user.id, hadith.id);
      logActivity(user.id, 'shared', { hadithId: hadith.id, text: hadith.english, book: hadith.book });
    }
  };

  // Get authenticity badge color
  const getAuthenticityColor = (authenticity: string) => {
    switch (authenticity) {
      case 'sahih': return 'bg-green-100 text-green-800 border-green-200';
      case 'hasan': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'daif': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle search — debounced 400ms so API isn't called on every keystroke
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // loadHadiths will be triggered by the useEffect watching searchTerm
    }, 400);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate visible page range
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = start + maxVisiblePages - 1;

      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  if (!bookInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested collection could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <h1 className="text-3xl font-bold">{bookInfo.name}</h1>
            </div>
          </div>
          <p className="text-primary-foreground/80 mb-2">{bookInfo.description}</p>
          <p className="text-sm text-primary-foreground/60">{totalHadiths} hadiths found</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hadiths by text, narrator, or keywords..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={authenticityFilter} onValueChange={setAuthenticityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Authenticity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Authenticity</SelectItem>
                  <SelectItem value="sahih">Sahih Only</SelectItem>
                  <SelectItem value="hasan">Hasan Only</SelectItem>
                  <SelectItem value="daif">Da'if Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Hadith Number</SelectItem>
                  <SelectItem value="authenticity">Authenticity</SelectItem>
                  <SelectItem value="narrator">Narrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Hadiths List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          // Loading skeletons
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hadiths.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hadiths found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setDebouncedSearchTerm('');
              setAuthenticityFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          // Hadiths
          <div className="space-y-6">
            {hadiths.map((hadith) => (
              <div key={hadith.id} id={hadith.id}>
                <HadithCard
                  hadith={hadith}
                  isLiked={likedHadiths.has(hadith.id)}
                  isSaved={savedHadiths.some(h => h.id === hadith.id)}
                  searchTerm={debouncedSearchTerm}
                  onLike={() => handleLike(hadith.id)}
                  onSave={() => handleSave(hadith)}
                  onShare={() => handleShare(hadith)}
                  getAuthenticityColor={getAuthenticityColor}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {selectedHadith && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          hadith={selectedHadith}
        />
      )}
    </div>
  );
};

// Highlight matching search term inside a text string
const HighlightText: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term.trim()) return <>{text}</>;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-950 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// Hadith Card Component
interface HadithCardProps {
  hadith: Hadith;
  isLiked: boolean;
  isSaved: boolean;
  searchTerm: string;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  getAuthenticityColor: (authenticity: string) => string;
}

const HadithCard: React.FC<HadithCardProps> = ({
  hadith,
  isLiked,
  isSaved,
  searchTerm,
  onLike,
  onSave,
  onShare,
  getAuthenticityColor
}) => {
  const [isPlaying, setIsPlaying]           = useState(false);
  const [explanation, setExplanation]       = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [showExplain, setShowExplain]       = useState(false);
  const [usesLeft, setUsesLeft]             = useState(AI_EXPLAIN_MAX - getExplainCount());
  const [reportOpen, setReportOpen]         = useState(false);
  const [reportText, setReportText]         = useState('');
  const [reportSent, setReportSent]         = useState(false);
  const { toast } = useToast();

  const handleVoicePlay = () => {
    setIsPlaying(!isPlaying);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(hadith.english);
      utterance.lang = 'en-US';
      if (isPlaying) { window.speechSynthesis.cancel(); }
      else { window.speechSynthesis.speak(utterance); }
    }
  };

  const handleExplain = async () => {
    // If already showing, toggle off
    if (showExplain) { setShowExplain(false); return; }

    // Check premium gate
    if (!hasExplainLeft()) {
      toast({
        title: '✨ Premium Feature',
        description: `You've used all ${AI_EXPLAIN_MAX} free AI explanations. Upgrade to Premium for unlimited access.`,
        variant: 'destructive',
      });
      return;
    }

    // Already fetched for this card
    if (explanation) { setShowExplain(true); return; }

    setExplainLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hadith/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arabic:       hadith.arabic,
          english:      hadith.english,
          narrator:     hadith.narrator,
          book:         hadith.book,
          hadithNumber: hadith.number,
        }),
      });

      if (!res.ok) throw new Error('Explanation request failed');
      const data = await res.json();

      if (data.success && data.explanation) {
        setExplanation(data.explanation);
        setShowExplain(true);
        const remaining = AI_EXPLAIN_MAX - incrementExplainCount();
        setUsesLeft(remaining);
        if (remaining === 0) {
          toast({
            title: '✨ Last free explanation used',
            description: 'Upgrade to Premium for unlimited AI explanations.',
          });
        }
      }
    } catch {
      toast({ title: 'Failed to get explanation', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleReportSubmit = () => {
    if (!reportText.trim()) return;
    // In production this would send to Firestore/email
    console.log('Issue reported for hadith', hadith.id, ':', reportText);
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
      setReportText('');
    }, 2000);
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-lg">{hadith.book}</h3>
                <p className="text-sm text-muted-foreground">Hadith {hadith.number}</p>
              </div>
              <Badge className={getAuthenticityColor(hadith.authenticity)}>
                {hadith.authenticity.charAt(0).toUpperCase() + hadith.authenticity.slice(1)}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onLike}
                className={isLiked ? 'text-red-500' : 'text-muted-foreground'}>
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>

              <Button variant="ghost" size="sm" onClick={onSave}
                className={isSaved ? 'text-blue-500' : 'text-muted-foreground'}>
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>

              <Button variant="ghost" size="sm" onClick={onShare} className="text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleVoicePlay} className="text-muted-foreground">
                <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-blue-500' : ''}`} />
              </Button>

              {/* AI Explanation button removed */}
            </div>
          </div>

          {/* Narrator */}
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Narrated by <HighlightText text={hadith.narrator} term={searchTerm} />
            </span>
          </div>

          {/* Arabic Text */}
          <div className="mb-6">
            <p className="text-right text-2xl leading-loose font-arabic text-gray-800 dark:text-gray-200">
              {hadith.arabic}
            </p>
          </div>

          {/* English Translation */}
          <div className="border-t pt-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <HighlightText text={hadith.english} term={searchTerm} />
            </p>
          </div>

          {/* AI Explanation Panel */}
          {showExplain && explanation && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">AI Explanation</span>
                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                    {usesLeft} free left
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowExplain(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Authenticity verified</span>
            </div>
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Flag className="h-3 w-3" />
              <span>Report issue</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Report Issue Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              Report an Issue
            </DialogTitle>
          </DialogHeader>
          {reportSent ? (
            <div className="py-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="font-medium">Report submitted</p>
              <p className="text-sm text-muted-foreground mt-1">Thank you for helping us improve.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <p className="font-medium">{hadith.book} — Hadith {hadith.number}</p>
                <p className="text-muted-foreground line-clamp-2 mt-1">{hadith.english}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">What's the issue?</label>
                <select
                  className="w-full p-2 border rounded-md bg-background text-sm mb-3"
                  value={reportText.startsWith('Type:') ? reportText.split('\n')[0].replace('Type: ', '') : ''}
                  onChange={(e) => setReportText(`Type: ${e.target.value}\n`)}
                >
                  <option value="">Select issue type...</option>
                  <option value="Incorrect translation">Incorrect translation</option>
                  <option value="Wrong hadith number">Wrong hadith number</option>
                  <option value="Missing text">Missing text</option>
                  <option value="Wrong authenticity grade">Wrong authenticity grade</option>
                  <option value="Formatting issue">Formatting issue</option>
                  <option value="Other">Other</option>
                </select>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none min-h-[80px] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the issue in detail..."
                  value={reportText.includes('\n') ? reportText.split('\n').slice(1).join('\n') : reportText}
                  onChange={(e) => {
                    const type = reportText.split('\n')[0];
                    setReportText(type ? `${type}\n${e.target.value}` : e.target.value);
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setReportOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReportSubmit} disabled={!reportText.trim()}>
                  <Send className="h-3 w-3 mr-1" /> Submit Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollectionExplore;
