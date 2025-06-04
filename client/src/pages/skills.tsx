import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Network, Users, Award, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedSkillTree from "@/components/animated-skill-tree";
import EmployeeCard from "@/components/employee-card";
import type { Employee, SkillEndorsement } from "@shared/schema";

export default function Skills() {
  const [, setLocation] = useLocation();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

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
    setSelectedSkill(skill);
  };

  // Filter employees by selected skill
  const filteredEmployees = selectedSkill 
    ? allEmployees.filter(emp => emp.skills?.includes(selectedSkill))
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

      {/* Skills Tree Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

      {/* Available Talent Section */}
      {selectedSkill && (
        <div className="bg-white py-16 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Available Talent for "{selectedSkill}"
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Connect with colleagues who have expertise in {selectedSkill}
              </p>
              <Button
                onClick={() => setSelectedSkill(null)}
                variant="outline"
                className="mt-4"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse All Skills
              </Button>
            </div>

            {filteredEmployees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-500">
                  No employees currently have "{selectedSkill}" listed in their skills.
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