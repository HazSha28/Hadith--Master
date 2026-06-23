import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ArrowRight, BookOpen, Mic, Upload, Users, Settings, Home, Search, Star } from 'lucide-react';

interface TutorialStep {
  id: string;
  page: string;
  title: string;
  content: string;
  tips: string[];
  icon: React.ReactNode;
  position: 'top-right' | 'center' | 'bottom-center';
}

interface UserOnboardingProps {
  currentPage: string;
  onClose: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'beginner-welcome',
    page: '/beginner',
    title: 'Welcome to Hadith Learning! 🎓',
    content: 'This is your starting point for learning hadiths. Let\'s explore the features available to you.',
    tips: [
      'Use the search bar to find hadiths by keywords',
      'Click on "My Collection" to view saved hadiths',
      'Try the daily hadith feature for regular practice'
    ],
    icon: <Home className="h-6 w-6" />,
    position: 'center'
  },
  {
    id: 'beginner-search',
    page: '/beginner',
    title: 'Search Hadiths 🔍',
    content: 'Find hadiths by typing keywords',
    tips: [
      'Type in English or Arabic to search',
      'Press Enter or click Search to get results'
    ],
    icon: <Search className="h-6 w-6" />,
    position: 'top-right'
  },
  {
    id: 'beginner-collection',
    page: '/beginner',
    title: 'Your Collection 📚',
    content: 'Save and organize your favorite hadiths for easy access and practice.',
    tips: [
      'Click the bookmark icon to save hadiths',
      'View all your saved hadiths in one place',
      'Organize by topics or books',
      'Practice memorization from your collection'
    ],
    icon: <BookOpen className="h-6 w-6" />,
    position: 'bottom-center'
  },
  {
    id: 'advanced-welcome',
    page: '/advanced',
    title: 'Advanced Hadith Study 📖',
    content: 'Take your hadith knowledge to the next level with advanced study tools.',
    tips: [
      'Practice recitation with voice recording',
      'Use advanced search with AI assistance',
      'Track your progress and statistics',
      'Access comprehensive hadith collections'
    ],
    icon: <Star className="h-6 w-6" />,
    position: 'center'
  },
  {
    id: 'advanced-recitation',
    page: '/advanced',
    title: 'Practice Recitation 🎤',
    content: 'Record your recitation and compare with the original text to improve your pronunciation.',
    tips: [
      'Click the microphone to start recording',
      'Listen to your recordings to track progress',
      'Compare with original hadith text',
      'Save your best recordings for reference'
    ],
    icon: <Mic className="h-6 w-6" />,
    position: 'top-right'
  },
  {
    id: 'advanced-search',
    page: '/advanced',
    title: 'AI-Powered Search 🤖',
    content: 'Use advanced search with AI assistance to find exactly what you\'re looking for.',
    tips: [
      'Type detailed descriptions for better results',
      'Use voice search for hands-free operation',
      'Upload images with hadith text',
      'AI helps find the most relevant hadiths'
    ],
    icon: <Upload className="h-6 w-6" />,
    position: 'bottom-center'
  },
  {
    id: 'profile-welcome',
    page: '/profile',
    title: 'Your Profile 👤',
    content: 'Manage your account settings and track your learning progress.',
    tips: [
      'Edit your profile information',
      'View your activity statistics',
      'Manage your saved collections',
      'Track your study streak and progress'
    ],
    icon: <Users className="h-6 w-6" />,
    position: 'center'
  },
  {
    id: 'profile-stats',
    page: '/profile',
    title: 'Your Progress 📊',
    content: 'Monitor your hadith learning journey with detailed statistics.',
    tips: [
      'View hadiths read, liked, and shared',
      'Track your study streak',
      'Monitor your study time',
      'See your recent activity'
    ],
    icon: <Star className="h-6 w-6" />,
    position: 'top-right'
  },
  {
    id: 'search-results-welcome',
    page: '/search-results',
    title: 'Search Results 📋',
    content: 'Browse through hadiths that match your search criteria.',
    tips: [
      'Use filters to narrow down results',
      'Click on hadiths to view details',
      'Save interesting hadiths to your collection',
      'Share hadiths with others'
    ],
    icon: <Search className="h-6 w-6" />,
    position: 'top-right'
  },
  {
    id: 'search-results-filters',
    page: '/search-results',
    title: 'Advanced Filters 🔧',
    content: 'Refine your search results using powerful filtering options.',
    tips: [
      'Filter by book, author, or narrator',
      'Apply multiple filters for precise results',
      'Use Clear Filters to reset',
      'Combine filters with search text'
    ],
    icon: <Settings className="h-6 w-6" />,
    position: 'bottom-center'
  }
];

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ currentPage, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const lastVisitedPage = localStorage.getItem('lastVisitedPage');
    
    if (!hasSeenTutorial) {
      setIsFirstVisit(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }

    // Find relevant tutorial steps for current page
    const pageSteps = tutorialSteps.filter(step => step.page === currentPage);
    if (pageSteps.length > 0) {
      // Find the first uncompleted step for this page
      const uncompletedStep = pageSteps.find(step => !completedSteps.includes(step.id));
      if (uncompletedStep) {
        const index = tutorialSteps.findIndex(step => step.id === uncompletedStep.id);
        setCurrentStepIndex(index);
      }
    }
  }, [currentPage, completedSteps]);

  const currentStep = tutorialSteps[currentStepIndex];
  const pageSteps = tutorialSteps.filter(step => step.page === currentPage);
  const currentStepInPage = pageSteps.findIndex(step => step.id === currentStep?.id);
  const totalStepsInPage = pageSteps.length;

  const handleNext = () => {
    // Mark current step as completed
    if (currentStep && !completedSteps.includes(currentStep.id)) {
      const newCompleted = [...completedSteps, currentStep.id];
      setCompletedSteps(newCompleted);
      localStorage.setItem('completedTutorialSteps', JSON.stringify(newCompleted));
    }

    // Find next step for current page
    const nextPageStep = pageSteps.find((step, index) => 
      index > currentStepInPage && !completedSteps.includes(step.id)
    );

    if (nextPageStep) {
      const index = tutorialSteps.findIndex(step => step.id === nextPageStep.id);
      setCurrentStepIndex(index);
    } else {
      // No more steps for this page, close tutorial
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleCompleteAll = () => {
    // Mark all steps for current page as completed
    const pageStepIds = pageSteps.map(step => step.id);
    const newCompleted = [...new Set([...completedSteps, ...pageStepIds])];
    setCompletedSteps(newCompleted);
    localStorage.setItem('completedTutorialSteps', JSON.stringify(newCompleted));
    onClose();
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 max-w-md';
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md';
      case 'bottom-center':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md';
      default:
        return 'fixed top-4 right-4 max-w-md';
    }
  };

  if (!currentStep || !pageSteps.includes(currentStep)) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`${getPositionClasses(currentStep.position)} p-0 shadow-2xl border-2 border-primary/20`}>
        <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-lg p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                {currentStep.icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-primary-foreground p-0">
                  {currentStep.title}
                </DialogTitle>
                <p className="text-primary-foreground/80 text-sm">
                  {currentStep.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-primary-foreground/80 mb-2">
              <span>Step {currentStepInPage + 1} of {totalStepsInPage}</span>
              <span>Tutorial for {currentPage.replace('/', '')}</span>
            </div>
            <div className="w-full bg-primary-foreground/20 rounded-full h-2">
              <div 
                className="bg-primary-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepInPage + 1) / totalStepsInPage) * 100}%` }}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium text-primary-foreground">💡 Quick Tips:</p>
            <ul className="space-y-1">
              {currentStep.tips.map((tip, index) => (
                <li key={index} className="text-xs text-primary-foreground/90 flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isFirstVisit ? (
              <Button
                variant="secondary"
                onClick={handleCompleteAll}
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/40"
              >
                Skip All Tutorials
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/40"
              >
                Skip This
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary-foreground hover:bg-primary-foreground/90 text-primary border-primary-foreground"
            >
              {currentStepInPage === totalStepsInPage - 1 ? 'Got it!' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserOnboarding;
