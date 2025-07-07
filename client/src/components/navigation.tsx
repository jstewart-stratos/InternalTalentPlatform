import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Users, ChevronDown, LogOut, UserCircle, Menu, X, FolderOpen, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@shared/schema";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch current user's employee profile
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees/current"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  const isAdmin = (user as any)?.role === "admin";
  const isTeamManager = (user as any)?.role === "team-manager";

  const navItems = [
    { path: "/", label: "Talent Directory", active: location === "/" || location === "/skills" || location === "/experts" },
    { path: "/teams", label: "Teams", active: location === "/teams" },
    { path: "/projects", label: "Projects Hub", active: location === "/projects" },
    { path: "/marketplace", label: "Marketplace", active: location === "/marketplace" },
    { path: "/skills-gap-analysis", label: "Career Growth", active: location === "/skills-gap-analysis" },
    ...(isAdmin ? [
      { path: "/analytics", label: "Analytics", active: location === "/analytics" },
      { path: "/admin", label: "Admin", active: location === "/admin" },
    ] : []),
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };



  const handleLogout = async () => {
    try {
      // Make logout request
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Force full page reload to clear all state and redirect to landing
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force reload anyway
      window.location.href = '/';
    }
  };

  const getUserDisplayName = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName} ${(user as any).lastName}`;
    }
    if ((user as any)?.email) {
      return (user as any).email;
    }
    return 'User';
  };

  const getUserInitials = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email[0].toUpperCase();
    }
    return 'U';
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
            {/* Desktop user menu */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-secondary hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">{getUserDisplayName()}</span>
                  <ChevronDown className="h-3 w-3 text-secondary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={currentEmployee ? `/profile/${(currentEmployee as any).id}` : "/profile/create"} className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-learning-paths" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Learning Paths
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-projects" className="flex items-center">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      My Projects
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/services" className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      My Services
                    </Link>
                  </DropdownMenuItem>
                  {(isTeamManager || isAdmin) && (
                    <DropdownMenuItem asChild>
                      <Link href="/team-management" className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        My Teams
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.active
                      ? "text-primary bg-orange-50 border-l-4 border-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile user section */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{getUserDisplayName()}</div>
                    <div className="text-sm text-gray-500">{(user as any)?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Link
                    href={currentEmployee ? `/profile/${(currentEmployee as any).id}` : "/profile/create"}
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <UserCircle className="h-5 w-5 mr-3" />
                    My Profile
                  </Link>
                  <Link
                    href="/my-learning-paths"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BookOpen className="h-5 w-5 mr-3" />
                    My Learning Paths
                  </Link>
                  <Link
                    href="/my-projects"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <FolderOpen className="h-5 w-5 mr-3" />
                    My Projects
                  </Link>
                  <Link
                    href="/services"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Briefcase className="h-5 w-5 mr-3" />
                    My Services
                  </Link>
                  {(isTeamManager || isAdmin) && (
                    <Link
                      href="/team-management"
                      onClick={closeMobileMenu}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <Users className="h-5 w-5 mr-3" />
                      My Teams
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
