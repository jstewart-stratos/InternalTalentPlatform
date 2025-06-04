import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import SkillTree from "@/components/skill-tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Users, Target } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function SkillTreePage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill === selectedSkill ? null : skill);
  };

  const getEmployeesWithSkill = (skill: string) => {
    return employees.filter(emp => emp.skills.includes(skill));
  };

  const getSkillStats = () => {
    const allSkills = new Set<string>();
    employees.forEach(emp => emp.skills.forEach(skill => allSkills.add(skill)));
    
    const skillCounts = Array.from(allSkills).map(skill => ({
      skill,
      count: getEmployeesWithSkill(skill).length
    })).sort((a, b) => b.count - a.count);

    return {
      totalSkills: allSkills.size,
      topSkills: skillCounts.slice(0, 5),
      averageSkillsPerEmployee: employees.length > 0 ? 
        (employees.reduce((sum, emp) => sum + emp.skills.length, 0) / employees.length).toFixed(1) : 0
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = getSkillStats();
  const selectedSkillEmployees = selectedSkill ? getEmployeesWithSkill(selectedSkill) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Skill Network Visualization</h1>
        <p className="text-gray-600 text-lg">
          Explore the interconnected network of skills across your organization. Click on skills to see connections and find experts.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalSkills}</p>
                <p className="text-gray-600">Total Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                <p className="text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {stats.averageSkillsPerEmployee}
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.averageSkillsPerEmployee}</p>
                <p className="text-gray-600">Avg Skills/Person</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main skill tree */}
        <div className="xl:col-span-2">
          <SkillTree
            employees={employees}
            onSkillSelect={handleSkillSelect}
            selectedSkill={selectedSkill || undefined}
          />
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Top skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Most Popular Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topSkills.map(({ skill, count }) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSkillSelect(skill)}
                  >
                    <Badge 
                      variant={selectedSkill === skill ? "default" : "secondary"}
                      className="flex-1 justify-start"
                    >
                      {skill}
                    </Badge>
                    <span className="text-sm text-gray-500 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected skill details */}
          {selectedSkill && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {selectedSkill} Experts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSkillEmployees.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSkillEmployees.slice(0, 5).map(employee => (
                      <div
                        key={employee.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/profile/${employee.id}`)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                          <AvatarFallback className="text-xs">
                            {employee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {employee.title}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                    {selectedSkillEmployees.length > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setLocation(`/?skill=${encodeURIComponent(selectedSkill)}`)}
                      >
                        View all {selectedSkillEmployees.length} experts
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No experts found for this skill.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Hover over skill nodes to see connections</p>
              <p>• Click on skills to find experts</p>
              <p>• Use zoom and pan controls to navigate</p>
              <p>• Larger nodes indicate more experts</p>
              <p>• Colors represent skill categories</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}