import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchFilters from "@/components/search-filters";
import EmployeeCard from "@/components/employee-card";
import type { Employee } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedExperience, setSelectedExperience] = useState("Any Level");
  const [sortBy, setSortBy] = useState("relevance");

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      // Clear URL parameters after setting the state
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees", searchQuery, selectedDepartment, selectedExperience],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("q", searchQuery);
        // Track skill search when user searches
        if (searchQuery.trim()) {
          try {
            await fetch("/api/track-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skill: searchQuery.trim() })
            });
          } catch (error) {
            // Ignore tracking errors, don't break search functionality
          }
        }
      }
      if (selectedDepartment !== "All Departments") params.append("department", selectedDepartment);
      if (selectedExperience !== "Any Level") params.append("experienceLevel", selectedExperience);
      
      const response = await fetch(`/api/employees?${params}`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch("/api/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      return response.json() as Promise<string[]>;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<{
        activeUsers: number;
        skillsRegistered: number;
        successfulMatches: number;
        projectsCompleted: number;
      }>;
    },
  });

  const handleSearch = (query: string, department: string, experienceLevel: string) => {
    setSearchQuery(query);
    setSelectedDepartment(department);
    setSelectedExperience(experienceLevel);
    
    // Scroll to results section after search
    setTimeout(() => {
      const resultsSection = document.querySelector('#results-section');
      resultsSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Find the Right Talent<br />Within Your Organization
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Connect with colleagues who have the skills you need. Build stronger teams through internal collaboration and knowledge sharing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-accent text-primary px-8 py-3 hover:bg-orange-500 font-semibold"
                  onClick={() => {
                    const searchSection = document.querySelector('#search-section');
                    searchSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Skills
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-accent text-accent bg-transparent px-8 py-3 hover:bg-accent hover:text-primary font-semibold"
                  onClick={() => {
                    window.location.href = '/profile';
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Professional team collaboration"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div id="search-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Discover Skills & Expertise</h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Search through your organization's talent pool and find the perfect match for your project needs.
          </p>
        </div>

        <SearchFilters
          onSearch={handleSearch}
          departments={departments}
          isLoading={isLoadingEmployees}
        />
      </div>

      {/* Results Section */}
      <div id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Available Talent</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary">
              {employees.length} results found
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort by Relevance</SelectItem>
                <SelectItem value="experience">Sort by Experience</SelectItem>
                <SelectItem value="availability">Sort by Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingEmployees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}

        {!isLoadingEmployees && employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500">Try adjusting your search criteria to find more results.</p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Stratos Skill Swap?</h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Streamline internal collaboration and unlock your organization's hidden potential.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Skill Matching</h3>
              <p className="text-secondary">
                Advanced algorithms match your project needs with the right internal talent based on skills, experience, and availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-secondary">
                Built-in messaging and project management tools to facilitate seamless collaboration between team members.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-secondary">
                Track skill utilization, identify knowledge gaps, and measure the impact of internal collaboration on productivity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stats.activeUsers.toLocaleString()}
                </div>
                <div className="text-secondary">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stats.skillsRegistered.toLocaleString()}
                </div>
                <div className="text-secondary">Skills Registered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stats.successfulMatches.toLocaleString()}
                </div>
                <div className="text-secondary">Successful Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stats.projectsCompleted.toLocaleString()}
                </div>
                <div className="text-secondary">Projects Completed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="gradient-bg py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Connect with Amazing Talent?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of employees who are already leveraging internal expertise to drive innovation and success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-accent text-primary px-8 py-4 text-lg hover:bg-orange-500 font-semibold"
              onClick={() => {
                window.location.href = '/profile';
              }}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Get Started Today
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-accent text-accent bg-transparent px-8 py-4 text-lg hover:bg-accent hover:text-primary font-semibold"
              onClick={() => {
                window.location.href = '/analytics';
              }}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
