import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Users, ChevronDown, LogOut, UserCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; initials: string } | null>(null);

  // Check login status on component mount
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      setIsLoggedIn(true);
      // For demo purposes, set a default user - in real app this would fetch from API
      setCurrentUser({ name: "John Smith", initials: "JS" });
    }
  }, []);

  const navItems = [
    { path: "/", label: "Discover Talent", active: location === "/" },
    { path: "/skills", label: "Skills Network", active: location === "/skills" },
    { path: "/projects", label: "Projects Hub", active: location === "/projects" },
    { path: "/profile", label: "My Profile", active: location.startsWith("/profile") },
    { path: "/analytics", label: "Analytics", active: location === "/analytics" },
    { path: "/admin", label: "Admin", active: location === "/admin" },
  ];



  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('userProfile');
    setIsLoggedIn(false);
    setCurrentUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  const handleLogin = () => {
    // For demo purposes, simulate login by setting a user
    localStorage.setItem('currentUserId', '1');
    setIsLoggedIn(true);
    setCurrentUser({ name: "John Smith", initials: "JS" });
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Users className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Stratos Skill Swap</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`pb-4 ${
                    item.active
                      ? "text-primary font-medium border-b-2 border-primary"
                      : "text-secondary hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-secondary hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </button>
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" />
                    <AvatarFallback>{currentUser?.initials || "JS"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">{currentUser?.name || "John Smith"}</span>
                  <ChevronDown className="h-3 w-3 text-secondary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLogin} className="flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
