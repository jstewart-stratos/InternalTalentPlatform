import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import OnboardingTour from "./onboarding-tour";

interface OnboardingContextType {
  showTour: () => void;
  isNewUser: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Check if user has completed onboarding tour
    const hasCompletedTour = localStorage.getItem('onboarding-tour-completed');
    
    if (user && !isLoading && !hasCompletedTour) {
      // Check if this is a new user (created recently)
      const userCreatedAt = user.createdAt ? new Date(user.createdAt) : new Date();
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Consider users new if they were created within the last 7 days
      const isNew = daysDiff <= 7;
      setIsNewUser(isNew);
      
      // Show tour for new users or if they haven't completed it
      if (isNew || !hasCompletedTour) {
        // Small delay to let the UI settle
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    }
  }, [user, isLoading]);

  const showTour = () => {
    setShowOnboarding(true);
  };

  const closeTour = () => {
    setShowOnboarding(false);
  };

  return (
    <OnboardingContext.Provider value={{ showTour, isNewUser }}>
      {children}
      <OnboardingTour isOpen={showOnboarding} onClose={closeTour} />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}