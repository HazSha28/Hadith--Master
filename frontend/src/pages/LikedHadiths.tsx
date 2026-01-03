import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  ChevronLeft,
  Volume2,
  Sparkles,
  BookOpen,
  User,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/ShareDialog';

// Types (same as CollectionExplore)
interface Hadith {
  id: string;
  book: string;
  number: string;
  arabic: string;
  english: string;
  narrator: string;
  authenticity: 'sahih' | 'hasan' | 'daif';
  bookSlug: string;
}

const LikedHadiths: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [likedHadiths, setLikedHadiths] = useState<Hadith[]>([]);
  const [savedHadiths, setSavedHadiths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [authenticityFilter, setAuthenticityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);

  // Mock liked hadiths data (in production, this would come from your backend)
  const mockLikedHadiths: Hadith[] = [
    {
      id: 'bukhari-1',
      book: 'Sahih al-Bukhari',
      number: '1',
      arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
      english: 'Actions are judged by intentions, so each man will have what he intended.',
      narrator: 'Umar ibn Al-Khattab',
      authenticity: 'sahih',
      bookSlug: 'sahih-bukhari'
    },
    {
      id: 'muslim-45',
      book: 'Sahih Muslim',
      number: '45',
      arabic: 'الطَّهُورُ شَطْرُ الإِيمَانِ',
      english: 'Purity is half of faith.',
      narrator: 'Abu Hurairah',
      authenticity: 'sahih',
      bookSlug: 'sahih-muslim'
    },
    {
      id: 'tirmidhi-123',
      book: 'Jamiʿ at-Tirmidhi',
      number: '123',
      arabic: 'مَنْ عَمِلَ عَمَلًا لَيْسَ عَلَيْهِ أَمْرُنَا فَهُوَ رَدٌّ',
      english: 'Whoever does a deed that is not in accordance with our matter, will have it rejected.',
      narrator: 'Aisha bint Abu Bakr',
      authenticity: 'hasan',
      bookSlug: 'jami-at-tirmidhi'
    }
  ];

  // Load liked hadiths
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadLikedHadiths = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch(`/api/users/${user.id}/liked-hadiths`);
        // const data = await response.json();
        
        // For now, use mock data
        setTimeout(() => {
          setLikedHadiths(mockLikedHadiths);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to load liked hadiths:', error);
        toast({
          title: 'Error',
          description: 'Failed to load liked hadiths. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    loadLikedHadiths();

    // Load saved hadiths for comparison
    const saved = localStorage.getItem(`saved-hadiths-${user.id}`);
    if (saved) {
      setSavedHadiths(new Set(JSON.parse(saved)));
    }
  }, [user, navigate, toast]);

  // Handle unlike
  const handleUnlike = (hadithId: string) => {
    const newLiked = likedHadiths.filter(h => h.id !== hadithId);
    setLikedHadiths(newLiked);
    
    // Update localStorage
    const liked = localStorage.getItem(`liked-hadiths-${user.id}`);
    if (liked) {
      const likedSet = new Set(JSON.parse(liked));
      likedSet.delete(hadithId);
      localStorage.setItem(`liked-hadiths-${user.id}`, JSON.stringify([...likedSet]));
    }

    toast({
      title: 'Hadith Removed',
      description: 'Hadith has been removed from your liked collection.',
    });
  };

  // Handle save toggle
  const handleSave = (hadithId: string) => {
    const newSaved = new Set(savedHadiths);
    if (newSaved.has(hadithId)) {
      newSaved.delete(hadithId);
    } else {
      newSaved.add(hadithId);
    }
    
    setSavedHadiths(newSaved);
    localStorage.setItem(`saved-hadiths-${user.id}`, JSON.stringify([...newSaved]));
    
    toast({
      title: newSaved.has(hadithId) ? 'Hadith Saved' : 'Hadith Removed',
      description: newSaved.has(hadithId) 
        ? 'Hadith has been added to your collection.'
        : 'Hadith has been removed from your collection.'
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

  // Filter and sort hadiths
  const filteredHadiths = likedHadiths
    .filter(hadith => {
      const matchesSearch = searchTerm === '' || 
        hadith.arabic.includes(searchTerm) || 
        hadith.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hadith.narrator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hadith.book.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAuthenticity = authenticityFilter === 'all' || hadith.authenticity === authenticityFilter;
      
      return matchesSearch && matchesAuthenticity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'book':
          return a.book.localeCompare(b.book);
        case 'authenticity':
          return a.authenticity.localeCompare(b.authenticity);
        case 'number':
          return a.number.localeCompare(b.number);
        default: // date
          return 0; // In production, sort by like date
      }
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-4">Please login to view your liked hadiths.</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
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
              <Heart className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Liked Hadiths</h1>
            </div>
          </div>
          <p className="text-primary-foreground/80 mb-2">Your collection of liked hadiths</p>
          <p className="text-sm text-primary-foreground/60">{likedHadiths.length} hadiths liked</p>
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
                placeholder="Search liked hadiths by text, narrator, or book..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value="date">Date Liked</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="authenticity">Authenticity</SelectItem>
                  <SelectItem value="number">Hadith Number</SelectItem>
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
        ) : filteredHadiths.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {likedHadiths.length === 0 ? 'No liked hadiths yet' : 'No matching hadiths found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {likedHadiths.length === 0 
                ? 'Start exploring hadiths and like your favorites to build your collection.'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {likedHadiths.length === 0 && (
              <Button onClick={() => navigate('/beginner')}>
                Explore Hadiths
              </Button>
            )}
            {filteredHadiths.length === 0 && likedHadiths.length > 0 && (
              <Button onClick={() => {
                setSearchTerm('');
                setAuthenticityFilter('all');
              }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          // Hadiths
          <div className="space-y-6">
            {filteredHadiths.map((hadith) => (
              <LikedHadithCard
                key={hadith.id}
                hadith={hadith}
                isSaved={savedHadiths.has(hadith.id)}
                onUnlike={() => handleUnlike(hadith.id)}
                onSave={() => handleSave(hadith.id)}
                onShare={() => handleShare(hadith)}
                getAuthenticityColor={getAuthenticityColor}
              />
            ))}
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

// Liked Hadith Card Component (similar to HadithCard but with Unlike button)
interface LikedHadithCardProps {
  hadith: Hadith;
  isSaved: boolean;
  onUnlike: () => void;
  onSave: () => void;
  onShare: () => void;
  getAuthenticityColor: (authenticity: string) => string;
}

const LikedHadithCard: React.FC<LikedHadithCardProps> = ({
  hadith,
  isSaved,
  onUnlike,
  onSave,
  onShare,
  getAuthenticityColor
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVoicePlay = () => {
    setIsPlaying(!isPlaying);
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
              onClick={onUnlike}
              className="text-red-500 hover:text-red-600"
            >
              <Heart className="h-4 w-4 fill-current" />
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

export default LikedHadiths;
