import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/ShareDialog';

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
    name: 'Sahih al-Bukhari',
    description: 'The most authentic collection of hadiths',
    totalHadiths: 7563,
    color: 'green'
  },
  'sahih-muslim': {
    name: 'Sahih Muslim',
    description: 'Second most authentic collection',
    totalHadiths: 7459,
    color: 'green'
  },
  'sunan-abu-dawud': {
    name: 'Sunan Abu Dawud',
    description: 'Collection focusing on legal traditions',
    totalHadiths: 5276,
    color: 'yellow'
  },
  'jami-at-tirmidhi': {
    name: 'Jamiʿ at-Tirmidhi',
    description: 'Comprehensive collection with juristical notes',
    totalHadiths: 4053,
    color: 'yellow'
  },
  'sunan-an-nasai': {
    name: 'Sunan an-Nasaʾi',
    description: 'Collection with rigorous authentication',
    totalHadiths: 5768,
    color: 'yellow'
  },
  'sunan-ibn-majah': {
    name: 'Sunan Ibn Majah',
    description: 'Sixth canonical collection',
    totalHadiths: 4345,
    color: 'red'
  }
} as const;

type BookSlug = keyof typeof BOOK_METADATA;

// Mock API service (replace with real API)
const fetchHadiths = async (bookSlug: string, page: number = 1, search?: string, filter?: string): Promise<HadithApiResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in production, this would be a real API call
  const mockHadiths: Hadith[] = [
    {
      id: `${bookSlug}-1`,
      book: BOOK_METADATA[bookSlug as BookSlug]?.name || 'Unknown',
      number: '1',
      arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
      english: 'Actions are judged by intentions, so each man will have what he intended.',
      narrator: 'Umar ibn Al-Khattab',
      authenticity: 'sahih',
      bookSlug
    },
    {
      id: `${bookSlug}-2`,
      book: BOOK_METADATA[bookSlug as BookSlug]?.name || 'Unknown',
      number: '2',
      arabic: 'مَنْ عَمِلَ عَمَلًا لَيْسَ عَلَيْهِ أَمْرُنَا فَهُوَ رَدٌّ',
      english: 'Whoever does a deed that is not in accordance with our matter, will have it rejected.',
      narrator: 'Aisha bint Abu Bakr',
      authenticity: 'sahih',
      bookSlug
    },
    {
      id: `${bookSlug}-3`,
      book: BOOK_METADATA[bookSlug as BookSlug]?.name || 'Unknown',
      number: '3',
      arabic: 'الطَّهُورُ شَطْرُ الإِيمَانِ',
      english: 'Purity is half of faith.',
      narrator: 'Abu Hurairah',
      authenticity: 'hasan',
      bookSlug
    }
  ];

  // Apply search filter
  let filteredHadiths = mockHadiths;
  if (search) {
    filteredHadiths = mockHadiths.filter(hadith => 
      hadith.arabic.includes(search) || 
      hadith.english.toLowerCase().includes(search.toLowerCase()) ||
      hadith.narrator.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply authenticity filter
  if (filter && filter !== 'all') {
    filteredHadiths = filteredHadiths.filter(hadith => hadith.authenticity === filter);
  }

  return {
    hadiths: filteredHadiths,
    total: filteredHadiths.length,
    page,
    totalPages: Math.ceil(filteredHadiths.length / 10)
  };
};

const CollectionExplore: React.FC = () => {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHadiths, setTotalHadiths] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [authenticityFilter, setAuthenticityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [likedHadiths, setLikedHadiths] = useState<Set<string>>(new Set());
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);

  const bookInfo = bookSlug ? BOOK_METADATA[bookSlug as BookSlug] : null;

  // Load hadiths
  const loadHadiths = useCallback(async () => {
    if (!bookSlug) return;

    setLoading(true);
    try {
      const response = await fetchHadiths(bookSlug, currentPage, searchTerm, authenticityFilter);
      setHadiths(response.hadiths);
      setTotalPages(response.totalPages);
      setTotalHadiths(response.total);
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
  }, [bookSlug, currentPage, searchTerm, authenticityFilter, toast]);

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
      toast({
        title: 'Login Required',
        description: 'Please login to like hadiths',
        variant: 'destructive'
      });
      return;
    }

    const newLiked = new Set(likedHadiths);
    if (newLiked.has(hadithId)) {
      newLiked.delete(hadithId);
    } else {
      newLiked.add(hadithId);
    }
    
    setLikedHadiths(newLiked);
    localStorage.setItem(`liked-hadiths-${user.id}`, JSON.stringify([...newLiked]));
  };

  // Handle save toggle
  const handleSave = (hadith: Hadith) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save hadiths',
        variant: 'destructive'
      });
      return;
    }

    setSavedHadiths(prev => {
      // Check if hadith is already saved
      const exists = prev.some(h => h.id === hadith.id);
      if (exists) {
        // Remove from saved
        const updated = prev.filter(h => h.id !== hadith.id);
        // Update localStorage
        if (updated.length === 0) {
          localStorage.removeItem('savedHadiths');
        } else {
          localStorage.setItem('savedHadiths', JSON.stringify(updated));
        }
        
        toast({
          title: 'Hadith Removed',
          description: 'Hadith has been removed from your collection.'
        });
        return updated;
      } else {
        // Add to saved with status
        const hadithToSave = {
          ...hadith,
          status: 'saved' as const,
          reference: {
            book: parseInt(hadith.number) || 1,
            hadith: parseInt(hadith.number) || 1
          },
          bookName: hadith.book
        };
        const updated = [...prev, hadithToSave];
        localStorage.setItem('savedHadiths', JSON.stringify(updated));
        
        toast({
          title: 'Hadith Saved',
          description: 'Hadith has been added to your collection.'
        });
        return updated;
      }
    });
  };

  // Handle share
  const handleShare = (hadith: Hadith) => {
    setSelectedHadith(hadith);
    setShareDialogOpen(true);
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

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
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

// Hadith Card Component
interface HadithCardProps {
  hadith: Hadith;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  getAuthenticityColor: (authenticity: string) => string;
}

const HadithCard: React.FC<HadithCardProps> = ({
  hadith,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onShare,
  getAuthenticityColor
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVoicePlay = () => {
    setIsPlaying(!isPlaying);
    // In production, this would trigger text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(hadith.english);
      utterance.lang = 'en-US';
      if (isPlaying) {
        window.speechSynthesis.cancel();
      } else {
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={isLiked ? 'text-red-500' : 'text-muted-foreground'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className={isSaved ? 'text-blue-500' : 'text-muted-foreground'}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-muted-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoicePlay}
              className="text-muted-foreground"
            >
              <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-blue-500' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              title="AI Explanation (Premium)"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Narrator */}
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Narrated by {hadith.narrator}</span>
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
            {hadith.english}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>Authenticity verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Report issue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectionExplore;
