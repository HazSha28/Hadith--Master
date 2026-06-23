import { useState, useEffect } from 'react';

interface UseUserOnboardingReturn {
  shouldShowOnboarding: boolean;
  markStepCompleted: (stepId: string) => void;
  skipOnboarding: () => void;
  isFirstVisit: boolean;
  resetTutorial: () => void; // Add reset function for new signups
}

export const useUserOnboarding = (currentPage: string): UseUserOnboardingReturn => {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Check if user has seen tutorials before (only show on first visit)
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
    // Only show onboarding if user has never seen tutorial before
    if (!hasSeenTutorial) {
      setShouldShowOnboarding(true);
      setIsFirstVisit(true);
      // Mark as seen immediately so it doesn't show again
      localStorage.setItem('hasSeenTutorial', 'true');
    } else {
      setShouldShowOnboarding(false);
      setIsFirstVisit(false);
    }
  }, [currentPage]);

  const markStepCompleted = (stepId: string) => {
    if (typeof window === 'undefined') return;
    
    const completedSteps = JSON.parse(localStorage.getItem('completedTutorialSteps') || '[]');
    const newCompleted = [...new Set([...completedSteps, stepId])];
    localStorage.setItem('completedTutorialSteps', JSON.stringify(newCompleted));
  };

  const skipOnboarding = () => {
    setShouldShowOnboarding(false);
    // Ensure tutorial is marked as seen permanently
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  const resetTutorial = () => {
    // Reset tutorial for new signups - clear the flag so tutorial shows again
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hasSeenTutorial');
      localStorage.removeItem('completedTutorialSteps');
    }
    setShouldShowOnboarding(true);
    setIsFirstVisit(true);
  };

  return {
    shouldShowOnboarding,
    markStepCompleted,
    skipOnboarding,
    isFirstVisit,
    resetTutorial
  };
};
