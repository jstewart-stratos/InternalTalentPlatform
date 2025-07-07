import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/user-context";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import CreateProfile from "@/pages/create-profile";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin-fixed";
import Skills from "@/pages/skills";
import Projects from "@/pages/projects";
import MyProjects from "@/pages/my-projects";
import ExpertDirectory from "@/pages/expert-directory";
import Services from "@/pages/services";
import Marketplace from "@/pages/marketplace";
import ServiceDetails from "@/pages/service-details";
import SkillsGapAnalysis from "@/pages/skills-gap-analysis";
import MyLearningPaths from "@/pages/my-learning-paths";
import Teams from "@/pages/teams";
import TeamManagement from "@/pages/team-management";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show auth page for non-authenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Redirect authenticated users without employee profiles to create profile
  if (user && !user.hasEmployeeProfile) {
    return (
      <Switch>
        <Route path="/profile/create" component={CreateProfile} />
        <Route component={() => <CreateProfile />} />
      </Switch>
    );
  }

  // Normal authenticated user routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile/create" component={CreateProfile} />
      <Route path="/profile/:id?" component={Profile} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={Admin} />
      <Route path="/skills" component={Skills} />
      <Route path="/skills-gap-analysis" component={SkillsGapAnalysis} />
      <Route path="/my-learning-paths" component={MyLearningPaths} />
      <Route path="/projects" component={Projects} />
      <Route path="/my-projects" component={MyProjects} />
      <Route path="/services" component={Services} />
      <Route path="/services/:id" component={ServiceDetails} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/experts" component={ExpertDirectory} />
      <Route path="/teams" component={Teams} />
      <Route path="/team-management" component={TeamManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            <AuthenticatedLayout />
          </div>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading || !isAuthenticated) {
    return <Router />;
  }
  
  return (
    <>
      <Navigation />
      <Router />
    </>
  );
}

export default App;
