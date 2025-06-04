import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/user-context";
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import CreateProfile from "@/pages/create-profile";
import Analytics from "@/pages/analytics";
import SkillsGapAnalysis from "@/pages/skills-gap-analysis";
import Admin from "@/pages/admin";
import Skills from "@/pages/skills";
import Projects from "@/pages/projects";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile/create" component={CreateProfile} />
      <Route path="/profile/:id?" component={Profile} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/skills-gap-analysis" component={SkillsGapAnalysis} />
      <Route path="/admin" component={Admin} />
      <Route path="/skills" component={Skills} />
      <Route path="/projects" component={Projects} />
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
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
