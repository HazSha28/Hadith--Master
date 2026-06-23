import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, Heart, Share2, Star, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookCoverProps {
  book: {
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
  };
  variant?: 'default' | 'featured' | 'compact';
}

const BookCoverCard: React.FC<BookCoverProps> = ({ 
  book, 
  variant = 'default' 
}) => {
  const getCoverGradient = (color?: string) => {
    const gradients = {
      emerald: 'from-emerald-600 to-teal-700',
      blue: 'from-blue-600 to-indigo-700', 
      green: 'from-green-600 to-emerald-700',
      purple: 'from-purple-600 to-violet-700',
      amber: 'from-amber-600 to-orange-700',
      red: 'from-red-600 to-rose-700'
    };
    return gradients[color as keyof typeof gradients] || gradients.emerald;
  };

  const getDifficultyBadge = (difficulty?: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800 border-green-200',
      intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      advanced: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  const getCoverPattern = (bookName: string) => {
    const patterns = {
      'Sahih Bukhari': 'geometric',
      'Sahih Muslim': 'arabic',
      'Sunan Abu Dawud': 'floral',
      'Jami\' at-Tirmidhi': 'calligraphy',
      'Sunan an-Nasa\'i': 'mosque',
      'Sunan Ibn Majah': 'minimal'
    };
    return patterns[bookName as keyof typeof patterns] || 'geometric';
  };

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
      isFeatured ? 'ring-2 ring-primary/20' : ''
    } ${isCompact ? 'max-w-xs' : 'max-w-sm'}`}>
      {/* Book Cover */}
      <div className={`relative h-48 bg-gradient-to-br ${getCoverGradient(book.coverColor)} overflow-hidden`}>
        {/* Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          {getCoverPattern(book.name) === 'geometric' && (
            <div className="w-full h-full">
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 transform rotate-45"></div>
              <div className="absolute top-12 right-6 w-6 h-6 border-2 border-white/30"></div>
              <div className="absolute bottom-8 left-8 w-4 h-4 border-2 border-white/30"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white/30 transform rotate-12"></div>
            </div>
          )}
          {getCoverPattern(book.name) === 'arabic' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl font-arabic text-white/20 opacity-50">﷽</div>
            </div>
          )}
          {getCoverPattern(book.name) === 'floral' && (
            <div className="w-full h-full">
              <div className="absolute top-2 left-2 w-16 h-16 border-2 border-white/30 rounded-full"></div>
              <div className="absolute top-8 right-4 w-12 h-12 border-2 border-white/30 rounded-full"></div>
              <div className="absolute bottom-6 left-6 w-8 h-8 border-2 border-white/30 rounded-full"></div>
            </div>
          )}
          {getCoverPattern(book.name) === 'calligraphy' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/10 font-bold text-4xl transform rotate-12 opacity-60">
                {book.name.charAt(0)}
              </div>
            </div>
          )}
          {getCoverPattern(book.name) === 'mosque' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/30 opacity-40">
                <div className="w-full h-2 bg-white/30 -mt-2"></div>
                <div className="w-2 h-8 bg-white/30 mx-auto -mt-6"></div>
              </div>
            </div>
          )}
          {getCoverPattern(book.name) === 'minimal' && (
            <div className="w-full h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
              <div className="absolute top-0 left-0 w-1 h-full bg-white/20"></div>
              <div className="absolute top-0 right-0 w-1 h-full bg-white/20"></div>
            </div>
          )}
        </div>

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-400 text-yellow-900 border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Book Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-bold text-sm text-center leading-tight">
            {book.name}
          </h3>
        </div>
      </div>

      <CardContent className={`p-4 ${isCompact ? 'p-3' : ''}`}>
        {/* Book Info */}
        <div className="space-y-3">
          {/* Author and Year */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{book.author}</span>
            {book.deathYear && (
              <span>d. {book.deathYear} AH</span>
            )}
          </div>

          {/* Description */}
          <p className={`text-sm text-muted-foreground line-clamp-2 ${
            isCompact ? 'hidden' : ''
          }`}>
            {book.description}
          </p>

          {/* Topics */}
          {book.topics && book.topics.length > 0 && !isCompact && (
            <div className="flex flex-wrap gap-1">
              {book.topics.slice(0, 3).map((topic, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5"
                >
                  {topic}
                </Badge>
              ))}
              {book.topics.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{book.topics.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{book.hadithCount}</span>
            </div>
            {book.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{book.readTime}</span>
              </div>
            )}
          </div>

          {/* Difficulty Badge */}
          {book.difficulty && !isCompact && (
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${getDifficultyBadge(book.difficulty)}`}>
                {book.difficulty.charAt(0).toUpperCase() + book.difficulty.slice(1)}
              </Badge>
              {book.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">{book.rating}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-2 mt-3 ${isCompact ? 'mt-2' : ''}`}>
          <Link to={`/collections/${book.slug}`}>
            <Button 
              size={isCompact ? "sm" : "default"}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {isCompact ? 'Read' : 'Explore'}
            </Button>
          </Link>
          
          {!isCompact && (
            <>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCoverCard;
