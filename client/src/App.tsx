import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/user-context";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import CreateProfile from "@/pages/create-profile";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin";
import Skills from "@/pages/skills";
import Projects from "@/pages/projects";
import MyProjects from "@/pages/my-projects";
import ExpertDirectory from "@/pages/expert-directory";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show landing page for non-authenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
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
      <Route path="/projects" component={Projects} />
      <Route path="/my-projects" component={MyProjects} />
      <Route path="/experts" component={ExpertDirectory} />
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
