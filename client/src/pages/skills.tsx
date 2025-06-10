import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Network, Users, Award, ArrowLeft, Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import EmployeeCard from "@/components/employee-card";
import type { Employee, SkillEndorsement } from "@shared/schema";

export default function Skills() {
  const [, setLocation] = useLocation();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  const { data: allEndorsements = [], isLoading: isLoadingEndorsements } = useQuery({
    queryKey: ["/api/all-endorsements"],
    queryFn: async () => {
      const response = await fetch("/api/all-endorsements");
      if (!response.ok) throw new Error("Failed to fetch endorsements");
      return response.json() as Promise<SkillEndorsement[]>;
    },
  });

  const { data: allSkillsFromDB = [], isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<string[]>;
    },
  });

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

  // Helper functions for skill analysis
  const getComplementarySkills = (skill: string): string[] => {
    const skillCombinations: Record<string, string[]> = {
      'React': ['TypeScript', 'Node.js', 'Next.js', 'CSS', 'JavaScript'],
      'Vue.js': ['TypeScript', 'Node.js', 'Nuxt.js', 'CSS', 'JavaScript'],
      'Angular': ['TypeScript', 'RxJS', 'Node.js', 'CSS', 'JavaScript'],
      'Node.js': ['Express', 'MongoDB', 'PostgreSQL', 'TypeScript', 'AWS'],
      'Python': ['Django', 'Flask', 'FastAPI', 'PostgreSQL', 'AWS', 'Machine Learning'],
      'JavaScript': ['React', 'Node.js', 'TypeScript', 'CSS', 'HTML'],
      'TypeScript': ['React', 'Node.js', 'Angular', 'Vue.js', 'Express'],
      'CSS': ['HTML', 'JavaScript', 'React', 'Vue.js', 'Sass'],
      'HTML': ['CSS', 'JavaScript', 'React', 'Vue.js'],
      'PostgreSQL': ['Node.js', 'Python', 'SQL', 'Django', 'Express'],
      'MongoDB': ['Node.js', 'Express', 'Mongoose', 'JavaScript'],
      'AWS': ['Docker', 'Kubernetes', 'Python', 'Node.js', 'DevOps'],
      'Docker': ['Kubernetes', 'AWS', 'DevOps', 'CI/CD'],
      'Kubernetes': ['Docker', 'AWS', 'DevOps', 'CI/CD'],
      'Machine Learning': ['Python', 'TensorFlow', 'PyTorch', 'Data Science'],
      'Data Science': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
    };
    
    return skillCombinations[skill]?.filter(s => !selectedSkills.includes(s) && allSkills.includes(s)) || [];
  };

  const getSkillCategories = (skills: string[]): string[] => {
    const categories = new Set<string>();
    
    skills.forEach(skill => {
      if (['React', 'Vue.js', 'Angular', 'CSS', 'HTML', 'JavaScript', 'TypeScript'].includes(skill)) {
        categories.add('Frontend');
      }
      if (['Node.js', 'Python', 'Express', 'Django', 'Flask', 'FastAPI'].includes(skill)) {
        categories.add('Backend');
      }
      if (['PostgreSQL', 'MongoDB', 'SQL', 'Redis'].includes(skill)) {
        categories.add('Database');
      }
      if (['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps'].includes(skill)) {
        categories.add('DevOps');
      }
      if (['Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch'].includes(skill)) {
        categories.add('AI/ML');
      }
      if (['UI/UX Design', 'Figma', 'Sketch', 'Adobe Creative Suite'].includes(skill)) {
        categories.add('Design');
      }
    });
    
    return Array.from(categories);
  };

  const hasFullStackCoverage = (skills: string[]): boolean => {
    const categories = getSkillCategories(skills);
    return categories.includes('Frontend') && categories.includes('Backend');
  };

  const hasFrontendCoverage = (skills: string[]): boolean => {
    return skills.some(skill => ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript'].includes(skill));
  };

  const hasBackendCoverage = (skills: string[]): boolean => {
    return skills.some(skill => ['Node.js', 'Python', 'Express', 'Django', 'Flask'].includes(skill));
  };

  const hasDevOpsCoverage = (skills: string[]): boolean => {
    return skills.some(skill => ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps'].includes(skill));
  };

  const getEmployeesWithAnySkill = (skills: string[]): Employee[] => {
    return allEmployees.filter(emp => 
      skills.some(skill => emp.skills?.includes(skill))
    );
  };

  const getRarityLevel = (skills: string[], employees: Employee[]): string => {
    const matchCount = employees.filter(emp => 
      skills.every(skill => emp.skills?.includes(skill))
    ).length;
    
    const totalEmployees = employees.length;
    const percentage = (matchCount / totalEmployees) * 100;
    
    if (percentage >= 50) return 'Common';
    if (percentage >= 20) return 'Moderate';
    if (percentage >= 5) return 'Rare';
    return 'Very Rare';
  };

  // Use all skills from database, not just those assigned to employees
  const allSkills = allSkillsFromDB.sort();

  // Filter skills based on search query
  const filteredSkills = allSkills.filter(skill =>
    skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );

  // Filter employees by selected skills (must have ALL selected skills)
  const filteredEmployees = selectedSkills.length > 0
    ? allEmployees.filter(emp => 
        selectedSkills.every(skill => emp.skills?.includes(skill))
      ).sort((a, b) => {
        // Sort by number of matching skills descending
        const aMatches = a.skills?.filter(skill => selectedSkills.includes(skill)).length || 0;
        const bMatches = b.skills?.filter(skill => selectedSkills.includes(skill)).length || 0;
        return bMatches - aMatches;
      })
    : [];

  const isLoading = isLoadingEmployees || isLoadingEndorsements || isLoadingSkills;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-2xl">
                <Network className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Interactive Skills Network
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Explore our organization's skill landscape through an interactive tree visualization. 
              Discover expertise across departments, find skill endorsements, and connect with the right talent for your projects.
            </p>
            
            {!isLoading && (
              <div className="flex items-center justify-center space-x-8 text-lg">
                <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{allEmployees.length} Professionals</span>
                </div>
                <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                  <Award className="h-5 w-5 mr-2" />
                  <span>{allEndorsements.length} Endorsements</span>
                </div>
                <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                  <Network className="h-5 w-5 mr-2" />
                  <span>6 Skill Categories</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Skill Selection Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              <Filter className="inline h-8 w-8 mr-3 text-primary" />
              Multi-Skill Talent Discovery
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Select multiple skills to find professionals who possess all the expertise you need. 
              Perfect for complex projects requiring diverse skill combinations.
            </p>
          </div>

          {/* Skill Search */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search skills..."
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Selected Skills ({selectedSkills.length})</h3>
                <Button variant="outline" size="sm" onClick={clearAllSkills}>
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="default"
                    className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary-dark cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill}
                    <X className="ml-2 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Skills */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Available Skills ({filteredSkills.length})
            </h3>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {filteredSkills.map((skill) => {
                  const employeesWithSkill = allEmployees.filter(emp => emp.skills?.includes(skill)).length;
                  const isSelected = selectedSkills.includes(skill);
                  
                  return (
                    <div key={skill} className="relative group">
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className={`px-3 py-2 text-sm cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-primary text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-100 border"
                        }`}
                        onClick={() => handleSkillSelect(skill)}
                      >
                        {skill}
                        <span className="ml-2 text-xs opacity-75">({employeesWithSkill})</span>
                        {isSelected && <X className="ml-2 h-3 w-3" />}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {filteredSkills.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No skills found matching "{skillSearchQuery}"
                </div>
              )}
            </div>
          </div>
          {/* Skill Compatibility Analysis */}
          {selectedSkills.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Skill Compatibility Analysis
              </h3>
              
              {selectedSkills.length === 1 ? (
                <div>
                  <p className="text-blue-800 mb-3">
                    <strong>{selectedSkills[0]}</strong> is often combined with:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getComplementarySkills(selectedSkills[0]).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-100 border-blue-300 text-blue-700"
                        onClick={() => handleSkillSelect(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-blue-800 mb-3">
                    Your selected combination covers <strong>{getSkillCategories(selectedSkills).length}</strong> skill categories:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getSkillCategories(selectedSkills).map((category) => (
                      <Badge key={category} className="bg-blue-100 text-blue-800">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Coverage Analysis</h4>
                      <div className="text-sm text-blue-700">
                        <div>• Full-stack capability: {hasFullStackCoverage(selectedSkills) ? '✓ Yes' : '✗ Partial'}</div>
                        <div>• Frontend coverage: {hasFrontendCoverage(selectedSkills) ? '✓ Yes' : '✗ No'}</div>
                        <div>• Backend coverage: {hasBackendCoverage(selectedSkills) ? '✓ Yes' : '✗ No'}</div>
                        <div>• DevOps capability: {hasDevOpsCoverage(selectedSkills) ? '✓ Yes' : '✗ No'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Talent Pool</h4>
                      <div className="text-sm text-blue-700">
                        <div>• Professionals with all skills: <strong>{filteredEmployees.length}</strong></div>
                        <div>• Professionals with any skill: <strong>{getEmployeesWithAnySkill(selectedSkills).length}</strong></div>
                        <div>• Skill combination rarity: <strong>{getRarityLevel(selectedSkills, allEmployees)}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cross-Referenced Talent Results */}
      {selectedSkills.length > 0 && (
        <div className="bg-white py-16 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cross-Referenced Talent
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Professionals who possess <strong>all</strong> of the selected skills: {selectedSkills.join(", ")}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''} 
                {selectedSkills.length > 1 && " with complete skill match"}
              </div>
            </div>

            {filteredEmployees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="relative">
                    <EmployeeCard employee={employee} />
                    <div className="mt-2 text-center">
                      <div className="text-xs text-gray-500">
                        Skill Match: {employee.skills?.filter(skill => selectedSkills.includes(skill)).length}/{selectedSkills.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No matching talent found</h3>
                <p className="text-gray-600">
                  No professionals currently have all the selected skills: {selectedSkills.join(", ")}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try reducing the number of selected skills or choosing different combinations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Use the Skills Network</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Navigate through our interactive skill tree to discover expertise and make connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Explore Categories</h3>
              <p className="text-gray-600">
                Click on skill categories to expand and view specific skills within each domain
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">View Expertise</h3>
              <p className="text-gray-600">
                See how many employees have each skill and the total endorsements received
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Talent</h3>
              <p className="text-gray-600">
                Click "Explore" on any skill to search for employees with that expertise
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}