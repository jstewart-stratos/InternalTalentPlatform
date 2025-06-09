import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Users, TrendingUp, BarChart3, Network, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SearchFilters from "@/components/search-filters";
import EmployeeCard from "@/components/employee-card";
import TrendingSkills from "@/components/trending-skills";
import ProfileAvatar from "@/components/profile-avatar";
import type { Employee, SkillEndorsement } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("Any Level");
  const [sortBy, setSortBy] = useState("relevance");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

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

  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees", searchQuery, selectedExperience],
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

      if (selectedExperience !== "Any Level") params.append("experienceLevel", selectedExperience);
      
      const response = await fetch(`/api/employees?${params}`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  // Function to randomize and limit employees to 9
  const getDisplayEmployees = (employees: Employee[]): Employee[] => {
    if (searchQuery || selectedExperience !== "Any Level") {
      // Show all results when filtering/searching
      return employees;
    }
    
    // Randomize and limit to 9 when showing general talent
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  };

  const employees = getDisplayEmployees(allEmployees);

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

  // Expert directory data
  const { data: experts = [] } = useQuery({
    queryKey: ["/api/experts"],
    queryFn: async () => {
      const response = await fetch("/api/experts");
      if (!response.ok) throw new Error("Failed to fetch experts");
      return response.json() as Promise<Employee[]>;
    },
  });

  // Skills network data
  const { data: allEndorsements = [] } = useQuery({
    queryKey: ["/api/all-endorsements"],
    queryFn: async () => {
      const response = await fetch("/api/all-endorsements");
      if (!response.ok) throw new Error("Failed to fetch endorsements");
      return response.json() as Promise<SkillEndorsement[]>;
    },
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<string[]>;
    },
  });



  const handleSearch = (query: string, experienceLevel: string) => {
    setSearchQuery(query);
    setSelectedExperience(experienceLevel);
    
    // Scroll to results section after search
    setTimeout(() => {
      const resultsSection = document.querySelector('#results-section');
      resultsSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Skills network helper functions
  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const clearAllSkills = () => {
    setSelectedSkills([]);
  };

  // Process skills data for network view
  const getSkillsWithCounts = () => {
    const skillCounts: { [key: string]: { count: number; endorsements: number } } = {};
    
    allEmployees.forEach(employee => {
      employee.skills.forEach(skill => {
        if (!skillCounts[skill]) {
          skillCounts[skill] = { count: 0, endorsements: 0 };
        }
        skillCounts[skill].count++;
      });
    });

    allEndorsements.forEach(endorsement => {
      if (skillCounts[endorsement.skill]) {
        skillCounts[endorsement.skill].endorsements++;
      }
    });

    return Object.entries(skillCounts)
      .map(([skill, data]) => ({ skill, ...data }))
      .sort((a, b) => b.count - a.count);
  };

  // Filter employees based on selected skills
  const getSkillFilteredEmployees = () => {
    if (selectedSkills.length === 0) return allEmployees;
    
    return allEmployees.filter(employee =>
      selectedSkills.every(skill =>
        employee.skills.some(empSkill => 
          empSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
  };

  // Filter skills based on search query
  const getFilteredSkills = () => {
    const skills = getSkillsWithCounts();
    if (!skillSearchQuery) return skills;
    
    return skills.filter(skillData =>
      skillData.skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Talent Directory
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover talent, explore skills networks, and connect with subject matter experts across your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover Talent
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Skills Network
            </TabsTrigger>
            <TabsTrigger value="experts" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Expert Directory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover Skills & Expertise</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Search through your organization's talent pool and find the perfect match for your project needs.
              </p>
            </div>
            <SearchFilters
              onSearch={handleSearch}
              onTabChange={setActiveTab}
              isLoading={isLoadingEmployees}
            />
          </TabsContent>

          <TabsContent value="skills" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Network</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Explore interconnected skills and find colleagues with specific expertise.
              </p>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search skills..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {selectedSkills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Selected Skills</h3>
                  <Button variant="outline" size="sm" onClick={clearAllSkills}>
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {getFilteredSkills().slice(0, 20).map((skillData) => (
                <Card
                  key={skillData.skill}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSkills.includes(skillData.skill) ? "ring-2 ring-primary bg-orange-50" : ""
                  }`}
                  onClick={() => handleSkillSelect(skillData.skill)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2 truncate">{skillData.skill}</h3>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{skillData.count} people</span>
                      <span>{skillData.endorsements} endorsements</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="experts" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Expert Directory</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Connect with subject matter experts and thought leaders in your organization.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Section */}
      <div id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === "discover" && (
          <>
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
          </>
        )}

        {activeTab === "skills" && (
          <>
            {selectedSkills.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">People with Selected Skills</h3>
                  <span className="text-sm text-secondary">
                    {getSkillFilteredEmployees().length} results found
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getSkillFilteredEmployees().map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                  ))}
                </div>

                {getSkillFilteredEmployees().length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-500">Try selecting different skills to find more results.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "experts" && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Subject Matter Experts</h3>
              <span className="text-sm text-secondary">
                {experts.length} experts available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.map((expert) => (
                <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-4">
                      <ProfileAvatar
                        src={expert.profileImage}
                        name={expert.name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">
                          {expert.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-2">{expert.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {expert.experienceLevel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {expert.address && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <span>{expert.address}</span>
                      </div>
                    )}

                    {expert.bio && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {expert.bio}
                      </p>
                    )}

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-1">
                        {expert.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {expert.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{expert.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        if (expert.email) {
                          window.location.href = `mailto:${expert.email}?subject=Expert Consultation Request&body=Hi ${expert.name},%0D%0A%0D%0AI would like to request your expertise regarding...`;
                        }
                      }}
                    >
                      Contact Expert
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {experts.length === 0 && (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No experts found</h3>
                <p className="text-gray-500">Check back later as more experts join the directory.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trending Skills Section */}
      <TrendingSkills />

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
