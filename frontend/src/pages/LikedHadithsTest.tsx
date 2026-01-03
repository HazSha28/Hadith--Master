import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ChevronLeft } from 'lucide-react';

const LikedHadithsTest: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 fill-current" />
              <h1 className="text-3xl font-bold">My Liked Hadiths</h1>
            </div>
          </div>
          <p className="text-primary-foreground/80 mb-2">Your personal collection of beloved hadiths</p>
          <p className="text-sm text-primary-foreground/60">Test page - working correctly!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Liked Hadiths Test Page</h2>
          <p className="text-muted-foreground mb-4">
            If you can see this page, the routing is working correctly.
          </p>
          <Button onClick={() => navigate('/beginner')}>
            Go to Beginner Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LikedHadithsTest;
