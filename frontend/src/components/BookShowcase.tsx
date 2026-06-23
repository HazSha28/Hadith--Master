import React, { useState } from 'react';
import BookCoverCard from './BookCoverCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3x3, 
  List, 
  Search, 
  Star,
  Clock,
  BookOpen
} from 'lucide-react';

interface BookData {
  name: string;
  slug: string;
  description: string;
  hadithCount: string;
  author: string;
  deathYear?: string;
  topics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  readTime?: string;
  coverColor?: string;
}

const BookShowcase: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'hadiths' | 'author'>('name');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const booksData: BookData[] = [
    {
      name: 'Sahih Bukhari',
      slug: 'sahih-bukhari',
      description: 'The most authentic collection of hadiths, compiled by Imam Muhammad al-Bukhari. Considered the most reliable book after the Quran.',
      hadithCount: '7,563',
      author: 'Imam al-Bukhari',
      deathYear: '256',
      topics: ['Faith', 'Prayer', 'Purification', 'Knowledge'],
      difficulty: 'intermediate',
      rating: 4.9,
      readTime: '45 hours',
      coverColor: 'emerald'
    },
    {
      name: 'Sahih Muslim',
      slug: 'sahih-muslim',
      description: 'Second most authentic collection compiled by Imam Muslim ibn al-Hajjaj. Known for precise methodology.',
      hadithCount: '7,190',
      author: 'Imam Muslim',
      deathYear: '261',
      topics: ['Faith', 'Character', 'Hereafter', 'Knowledge'],
      difficulty: 'intermediate',
      rating: 4.8,
      readTime: '40 hours',
      coverColor: 'blue'
    },
    {
      name: 'Sunan Abu Dawud',
      slug: 'sunan-abu-dawud',
      description: 'Collection focusing on legal traditions and fiqh-related hadiths compiled by Imam Abu Dawud.',
      hadithCount: '5,274',
      author: 'Imam Abu Dawud',
      deathYear: '275',
      topics: ['Jurisprudence', 'Worship', 'Transactions', 'Character'],
      difficulty: 'advanced',
      rating: 4.7,
      readTime: '35 hours',
      coverColor: 'green'
    },
    {
      name: 'Jami at-Tirmidhi',
      slug: 'jami-at-tirmidhi',
      description: 'Comprehensive collection with detailed classification of hadith authenticity by Imam al-Tirmidhi.',
      hadithCount: '3,956',
      author: 'Imam al-Tirmidhi',
      deathYear: '279',
      topics: ['Character', 'Faith', 'Knowledge', 'Prophecy'],
      difficulty: 'advanced',
      rating: 4.6,
      readTime: '30 hours',
      coverColor: 'purple'
    },
    {
      name: 'Sunan an-Nasai',
      slug: 'sunan-an-nasai',
      description: 'Collection with strong focus on isnad chains and narrator reliability by Imam an-Nasai.',
      hadithCount: '5,761',
      author: 'Imam an-Nasai',
      deathYear: '303',
      topics: ['Purification', 'Prayer', 'Character', 'Knowledge'],
      difficulty: 'intermediate',
      rating: 4.5,
      readTime: '38 hours',
      coverColor: 'amber'
    },
    {
      name: 'Sunan Ibn Majah',
      slug: 'sunan-ibn-majah',
      description: 'Comprehensive collection completing the six canonical books by Imam Ibn Majah.',
      hadithCount: '4,341',
      author: 'Imam Ibn Majah',
      deathYear: '273',
      topics: ['Character', 'Worship', 'Knowledge', 'Hereafter'],
      difficulty: 'beginner',
      rating: 4.4,
      readTime: '25 hours',
      coverColor: 'red'
    }
  ];

  const filteredAndSortedBooks = booksData
    .filter(book => {
      const matchesSearch = book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || book.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'hadiths':
          return parseInt(b.hadithCount.replace(',', '')) - parseInt(a.hadithCount.replace(',', ''));
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Islamic Library Collection</h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Explore the six canonical books of hadith (Kutub al-Sittah) with beautiful interactive covers
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search books, authors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="hadiths">Sort by Hadiths</option>
                <option value="author">Sort by Author</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterDifficulty !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                </Badge>
              )}
              {filterDifficulty !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Level: {filterDifficulty}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Featured Book */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured Collection</h2>
          <div className="flex justify-center">
            <BookCoverCard 
              book={booksData[0]} 
              variant="featured"
            />
          </div>
        </div>
      </div>

      {/* Books Grid/List */}
      <div className="container mx-auto px-6 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            All Collections ({filteredAndSortedBooks.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>{booksData.reduce((sum, book) => sum + parseInt(book.hadithCount.replace(',', '')), 0).toLocaleString()} total hadiths</span>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedBooks.map((book, index) => (
              <BookCoverCard 
                key={book.slug} 
                book={book} 
                variant={index === 0 ? 'featured' : 'default'}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedBooks.map((book) => (
              <div key={book.slug} className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-6">
                  {/* Compact Cover */}
                  <div className="flex-shrink-0">
                    <BookCoverCard book={book} variant="compact" />
                  </div>
                  
                  {/* Detailed Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{book.name}</h3>
                      <p className="text-sm text-muted-foreground">by {book.author}</p>
                    </div>
                    
                    <p className="text-muted-foreground">{book.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {book.topics?.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{book.hadithCount} hadiths</span>
                        </div>
                        {book.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{book.readTime}</span>
                          </div>
                        )}
                      </div>
                      <Button>Explore Collection</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookShowcase;
