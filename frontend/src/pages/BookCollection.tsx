import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, ArrowLeft, Loader2, Bookmark, Share2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/ShareDialog';
import { getHadithsByBook, searchHadiths, booksMetadata } from '@/data/completeHadithsData';

interface Hadith {
  id: number;
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
  createdAt: Date;
  isActive: boolean;
  authenticity: 'sahih' | 'hasan' | 'daif' | 'mutawatir';
  author?: string;
  likes?: number;
  isLiked?: boolean;
}

const BookCollection: React.FC = () => {
  const { bookName } = useParams<{ bookName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [filteredHadiths, setFilteredHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [savedHadiths, setSavedHadiths] = useState<number[]>([]);

  // Helper functions
  const getAuthenticity = (bookName: string): 'sahih' | 'hasan' | 'daif' | 'mutawatir' => {
    if (bookName.includes('Sahih')) return 'sahih';
    if (bookName.includes('Sunan') || bookName.includes('Jami')) return 'hasan';
    if (bookName.includes('Muwatta')) return 'mutawatir';
    return 'daif';
  };

  const getBookAuthor = (bookName: string): string => {
    const authors: { [key: string]: string } = {
      'Sahih al-Bukhari': 'Imam Muhammad ibn Ismail al-Bukhari',
      'Sahih Muslim': 'Imam Muslim ibn al-Hajjaj al-Nisaburi',
      'Sunan Abu Dawud': 'Imam Abu Dawud al-Sijistani',
      'Jami\' at-Tirmidhi': 'Imam al-Tirmidhi',
      'Sunan an-Nasa\'i': 'Imam an-Nasa\'i',
      'Sunan Ibn Majah': 'Imam Ibn Majah al-Qazwini'
    };
    return authors[bookName] || 'Unknown Author';
  };

  // Get book metadata
  const bookMetadata = booksMetadata.find(book => book.name === decodeURIComponent(bookName));

  // Load hadiths for the selected book
  useEffect(() => {
    const loadHadiths = async () => {
      try {
        setLoading(true);
        const bookHadiths = getHadithsByBook(decodeURIComponent(bookName));
        
        // Enhance hadiths with additional data
        const enhancedHadiths = bookHadiths.map(hadith => ({
          ...hadith,
          authenticity: getAuthenticity(hadith.reference.book),
          author: getBookAuthor(hadith.reference.book),
          likes: Math.floor(Math.random() * 100), // Simulated likes
          isLiked: false
        }));
        
        setHadiths(enhancedHadiths);
        setFilteredHadiths(enhancedHadiths);
        
        // Load saved hadiths from localStorage
        const saved = localStorage.getItem('savedHadiths');
        if (saved) {
          setSavedHadiths(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading hadiths:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hadiths from this book.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadHadiths();
  }, [bookName]);

  // Filter hadiths based on search and filters
  useEffect(() => {
    let filtered = hadiths;

    // Apply search filter
    if (searchTerm) {
      filtered = searchHadiths(searchTerm).filter(hadith => 
        hadith.reference.book === decodeURIComponent(bookName)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hadith => hadith.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(hadith => hadith.difficulty === selectedDifficulty);
    }

    setFilteredHadiths(filtered);
  }, [hadiths, searchTerm, selectedCategory, selectedDifficulty, bookName]);

  const handleLikeHadith = (hadith: Hadith) => {
    const updated = hadiths.map(h => 
      h.id === hadith.id 
        ? { ...h, likes: (h.likes || 0) + 1, isLiked: true }
        : h
    );
    setHadiths(updated);
    
    // Update localStorage
    const saved = localStorage.getItem('savedHadiths');
    if (saved) {
      const savedHadiths = JSON.parse(saved);
      localStorage.setItem('savedHadiths', JSON.stringify(savedHadiths));
    }
    
    toast({
      title: hadith.isLiked ? 'Hadith Liked' : 'Like Removed',
      description: hadith.isLiked 
        ? 'You have liked this hadith.' 
        : 'You have removed your like from this hadith.',
    });
  };

  const handleSaveHadith = (hadith: Hadith) => {
    const updated = [...savedHadiths, hadith.id];
    setSavedHadiths(updated);
    localStorage.setItem('savedHadiths', JSON.stringify(updated));
    
    toast({
      title: 'Hadith Saved',
      description: 'The hadith has been added to your collection.',
    });
  };

  const handleRemoveHadith = (hadithId: number) => {
    const updated = savedHadiths.filter(id => id !== hadithId);
    setSavedHadiths(updated);
    localStorage.setItem('savedHadiths', JSON.stringify(updated));
    
    toast({
      title: 'Hadith Removed',
      description: 'The hadith has been removed from your collection.',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(hadiths.map(h => h.category))];
    return ['all', ...categories];
  };

  const getUniqueDifficulties = () => {
    const difficulties = [...new Set(hadiths.map(h => h.difficulty))];
    return ['all', ...difficulties];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading hadiths...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Book Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/beginner')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Books
            </Button>
            
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {bookMetadata?.name || decodeURIComponent(bookName)}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {bookMetadata?.description || 'Authentic hadiths collection'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {bookMetadata?.totalHadiths?.toLocaleString() || hadiths.length} Hadiths
                    </Badge>
                    <Badge variant="outline">
                      {bookMetadata?.author || 'Unknown Compiler'}
                    </Badge>
                    <Badge variant="outline">
                      {bookMetadata?.year || 'Unknown Year'}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <ShareDialog 
                    bookName={bookMetadata?.name || decodeURIComponent(bookName)} 
                    bookUrl={window.location.href}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search hadiths in this collection..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {getUniqueDifficulties().map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty}
                  </option>
                ))}
              </select>
            </div>
            
            {searchTerm && (
              <div className="text-sm text-muted-foreground">
                Found {filteredHadiths.length} hadiths matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Hadiths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHadiths.map((hadith) => (
              <Card key={hadith.id} className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {hadith.english.text.substring(0, 100)}...
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Narrated by: {hadith.english.narrator}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getDifficultyColor(hadith.difficulty)}>
                        {hadith.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        {hadith.category}
                      </Badge>
                      <Badge 
                        variant={hadith.authenticity === 'sahih' ? 'default' : 'outline'}
                        className={hadith.authenticity === 'sahih' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}
                      >
                        {hadith.authenticity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Arabic Text */}
                    <div className="text-right text-lg leading-loose font-arabic mb-4 p-3 bg-muted/50 rounded">
                      {hadith.arabic}
                    </div>
                    
                    {/* English Translation */}
                    <div className="text-sm text-muted-foreground mb-3">
                      <p className="mb-2">{hadith.english.text}</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Reference:</strong> {hadith.reference.book} {hadith.reference.hadithNumber}</p>
                        <p><strong>Chapter:</strong> {hadith.chapter}</p>
                        <p><strong>Author:</strong> {hadith.author}</p>
                        <p><strong>Authenticity:</strong> {hadith.authenticity}</p>
                        <p><strong>Tags:</strong> {hadith.tags.join(', ')}</p>
                        <p><strong>Likes:</strong> {hadith.likes}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant={hadith.isLiked ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLikeHadith(hadith)}
                        className="flex-1"
                      >
                        <Bookmark className={`mr-2 h-4 w-4 ${hadith.isLiked ? 'fill-current' : ''}`} />
                        {hadith.isLiked ? 'Liked' : 'Like'} ({hadith.likes})
                      </Button>
                      {savedHadiths.includes(hadith.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveHadith(hadith.id)}
                          className="flex-1"
                        >
                          <Bookmark className="mr-2 h-4 w-4" />
                          Remove from Collection
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveHadith(hadith)}
                          className="flex-1"
                        >
                          <Bookmark className="mr-2 h-4 w-4" />
                          Save to Collection
                        </Button>
                      )}
                      <ShareDialog 
                        bookName={hadith.reference.book}
                        hadith={hadith}
                      >
                        <Button variant="outline" size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </ShareDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredHadiths.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hadiths found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No hadiths matching "${searchTerm}" found in this collection.`
                  : 'No hadiths available in this collection.'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookCollection;
