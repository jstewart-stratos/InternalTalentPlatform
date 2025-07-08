import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Search, 
  Network, 
  Award, 
  ShoppingCart, 
  TrendingUp,
  UserCheck,
  Calendar,
  Target
} from "lucide-react";
import { useLocation } from "wouter";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  route?: string;
  action?: string;
  highlight?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Stratos Skill Swap",
    description: "Your organization's internal talent marketplace. Let's explore the key features that will help you connect with colleagues and showcase your expertise.",
    icon: <Users className="h-6 w-6" />,
    highlight: true
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Start by creating your professional profile. Add your skills, experience, and areas of expertise to help colleagues find and connect with you.",
    icon: <UserCheck className="h-6 w-6" />,
    route: "/profile",
    action: "Complete Profile"
  },
  {
    id: "discover",
    title: "Discover Talent",
    description: "Search for colleagues with specific skills for your projects. Use the Discover Talent tab to find both individual experts and teams.",
    icon: <Search className="h-6 w-6" />,
    route: "/",
    action: "Explore Talent"
  },
  {
    id: "skills-network",
    title: "Skills Network",
    description: "Explore the organization's skill landscape. See trending skills, endorse colleagues, and discover skill gaps in your network.",
    icon: <Network className="h-6 w-6" />,
    route: "/skills",
    action: "View Skills"
  },
  {
    id: "expert-directory",
    title: "Expert Directory",
    description: "Browse subject matter experts and thought leaders. Connect with mentors and find people who can help with specific challenges.",
    icon: <Award className="h-6 w-6" />,
    route: "/expert-directory",
    action: "Browse Experts"
  },
  {
    id: "marketplace",
    title: "Services Marketplace",
    description: "Offer your professional services or book services from colleagues. Perfect for internal consulting and specialized expertise.",
    icon: <ShoppingCart className="h-6 w-6" />,
    route: "/services",
    action: "View Services"
  },
  {
    id: "teams",
    title: "Team Collaboration",
    description: "Join or create teams to work on projects together. Teams can offer collective services and share expertise.",
    icon: <Users className="h-6 w-6" />,
    route: "/teams",
    action: "Explore Teams"
  },
  {
    id: "projects",
    title: "Project Management",
    description: "Create projects, define skill requirements, and get AI-powered team recommendations based on your needs.",
    icon: <Target className="h-6 w-6" />,
    route: "/projects",
    action: "View Projects"
  },
  {
    id: "learning",
    title: "Learning & Development",
    description: "Get personalized learning recommendations based on your skill gaps and career goals. Continuous improvement made easy.",
    icon: <TrendingUp className="h-6 w-6" />,
    route: "/my-learning-paths",
    action: "View Learning"
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You now know the key features of Stratos Skill Swap. Start by completing your profile, then explore the talent network and begin collaborating!",
    icon: <Award className="h-6 w-6" />,
    highlight: true
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Mark tour as completed
    localStorage.setItem('onboarding-tour-completed', 'true');
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding-tour-completed', 'true');
    onClose();
  };

  const handleGoToFeature = () => {
    if (step.route) {
      setLocation(step.route);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {step.icon}
              {step.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className={`border-2 ${step.highlight ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  step.highlight ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {step.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <Badge variant={step.highlight ? "default" : "secondary"} className="mt-1">
                    {step.highlight ? "Getting Started" : "Feature"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {step.description}
              </CardDescription>
              
              {step.route && (
                <div className="mt-4">
                  <Button 
                    onClick={handleGoToFeature}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {step.action || "Explore Feature"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip Tour
              </Button>
              
              {currentStep === tourSteps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  Get Started
                  <Award className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}