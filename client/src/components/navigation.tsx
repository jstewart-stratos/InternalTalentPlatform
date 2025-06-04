import { Link, useLocation } from "wouter";
import { Bell, Users, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import QuickSearch from "@/components/quick-search";
import type { Employee } from "@shared/schema";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Discover Talent", active: location === "/" },
    { path: "/skill-tree", label: "Skill Tree", active: location === "/skill-tree" },
    { path: "/profile", label: "My Profile", active: location.startsWith("/profile") },
    { path: "/messages", label: "Messages", active: location === "/messages" },
    { path: "/analytics", label: "Analytics", active: location === "/analytics" },
    { path: "/admin", label: "Admin", active: location === "/admin" },
  ];

  const handleEmployeeSelect = (employee: Employee) => {
    window.location.href = `/profile/${employee.id}`;
  };

  const handleSkillSelect = (skill: string) => {
    // Navigate to home page with skill search
    const params = new URLSearchParams();
    params.set('q', skill);
    window.location.href = `/?${params.toString()}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Users className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-gray-900">TalentConnect</span>
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
            <div className="hidden lg:block">
              <QuickSearch 
                onEmployeeSelect={handleEmployeeSelect}
                onSkillSelect={handleSkillSelect}
                placeholder="Search employees and skills..."
              />
            </div>
            <button className="text-secondary hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900">John Smith</span>
              <ChevronDown className="h-3 w-3 text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
