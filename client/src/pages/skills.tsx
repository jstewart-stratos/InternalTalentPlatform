import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Network, Users, Award, ArrowLeft, Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AnimatedSkillTree from "@/components/animated-skill-tree";
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

  // Get all unique skills from employees
  const allSkills = Array.from(new Set(
    allEmployees.flatMap(emp => emp.skills || [])
  )).sort();

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

  const isLoading = isLoadingEmployees || isLoadingEndorsements;

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
            <div className="max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {filteredSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                    className={`px-3 py-1 text-sm cursor-pointer transition-colors ${
                      selectedSkills.includes(skill)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleSkillSelect(skill)}
                  >
                    {skill}
                    {selectedSkills.includes(skill) && <X className="ml-2 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Skills Tree Visualization */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-gray-600">Loading skill network...</p>
          </div>
        ) : (
          <AnimatedSkillTree 
            employees={allEmployees} 
            endorsements={allEndorsements}
            onSkillSelect={handleSkillSelect}
          />
        )}
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