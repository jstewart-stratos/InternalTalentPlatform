import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Code, 
  Book, 
  Award, 
  ExternalLink,
  CheckCircle
} from "lucide-react";

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  yearsOfExperience: number;
}

interface EmployeeSkill {
  id: number;
  employeeId: number;
  skillName: string;
  experienceLevel: string;
  yearsOfExperience: number;
  lastUsed: string;
}

interface Project {
  id: number;
  title: string;
  requiredSkills: string[];
}

interface SkillRecommendation {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  projectDemand: number;
  currentGap: boolean;
}

interface LearningPath {
  skill: string;
  totalDuration: string;
  difficulty: string;
  steps: Array<{
    title: string;
    description: string;
    duration: string;
    resources: Array<{
      title: string;
      type: string;
      provider: string;
      url: string;
      cost: string;
      description: string;
    }>;
  }>;
  certifications: Array<{
    name: string;
    provider: string;
    url: string;
    cost: string;
    timeToComplete: string;
  }>;
  practiceProjects: Array<{
    title: string;
    description: string;
    difficulty: string;
  }>;
}

export default function SkillsGapAnalysis() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [learningPaths, setLearningPaths] = useState<{ [skill: string]: LearningPath }>({});
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch all employee skills
  const { data: allEmployeeSkills = [] } = useQuery<EmployeeSkill[]>({
    queryKey: ["/api/all-employee-skills"],
  });

  // Fetch skills for selected employee
  const { data: employeeSkills = [] } = useQuery<EmployeeSkill[]>({
    queryKey: ["/api/employees", selectedEmployeeId, "skills"],
    enabled: !!selectedEmployeeId,
  });

  const targetEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  // Generate learning path mutation
  const generateLearningPath = useMutation({
    mutationFn: async (skillData: { skill: string; currentLevel?: string; targetLevel?: string; context?: string }): Promise<LearningPath> => {
      const response = await fetch("/api/learning-paths", {
        method: "POST",
        body: JSON.stringify(skillData),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to generate learning path');
      return response.json();
    },
    onSuccess: (data: LearningPath, variables) => {
      console.log('Learning path generated:', data);
      setLearningPaths(prev => ({
        ...prev,
        [variables.skill]: data
      }));
    },
    onError: (error) => {
      console.error('Error generating learning path:', error);
    },
  });

  // Get skill recommendations for the selected employee
  const getSkillRecommendations = (): SkillRecommendation[] => {
    if (!targetEmployee || !employeeSkills.length) return [];

    const currentSkills = new Set(employeeSkills.map(s => s.skillName));
    const skillDemand: { [skill: string]: number } = {};

    // Count skill demand across projects
    projects.forEach(project => {
      project.requiredSkills.forEach(skill => {
        skillDemand[skill] = (skillDemand[skill] || 0) + 1;
      });
    });

    // Generate recommendations
    const recommendations: SkillRecommendation[] = [];
    
    // High-demand skills not currently possessed
    Object.entries(skillDemand).forEach(([skill, demand]) => {
      if (!currentSkills.has(skill) && demand >= 2) {
        recommendations.push({
          skill,
          priority: 'high',
          reason: `High demand skill (${demand} projects require this)`,
          projectDemand: demand,
          currentGap: true,
        });
      }
    });

    // Skills for career advancement
    const advancementSkills = ['Python', 'Data Analysis', 'Risk Management', 'SQL', 'AI/ML'];
    advancementSkills.forEach(skill => {
      if (!currentSkills.has(skill)) {
        recommendations.push({
          skill,
          priority: 'medium',
          reason: 'Critical for career advancement in financial services',
          projectDemand: skillDemand[skill] || 0,
          currentGap: true,
        });
      }
    });

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  const recommendations = getSkillRecommendations();
  
  console.log('Learning paths state:', Object.keys(learningPaths).length, Object.keys(learningPaths));
  console.log('Learning paths data:', learningPaths);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Gap Analysis</h1>
          <p className="text-gray-600">
            Identify skill gaps and get personalized learning recommendations to advance your career.
          </p>
        </div>

        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              Select Employee for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEmployeeId?.toString()} onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an employee to analyze" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name} - {employee.role} ({employee.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Skill Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Skill Recommendations for {targetEmployee?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{rec.skill}</h3>
                        <Badge className={`${priorityColors[rec.priority]} border`}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                      {rec.projectDemand > 0 && (
                        <p className="text-xs text-gray-500 mb-3">
                          Required by {rec.projectDemand} active project(s)
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => generateLearningPath.mutate({ 
                            skill: rec.skill,
                            currentLevel: 'beginner',
                            targetLevel: 'intermediate'
                          })}
                          disabled={generateLearningPath.isPending}
                        >
                          {generateLearningPath.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Get Learning Resources
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Skills Overview */}
        {targetEmployee && employeeSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Current Skills Profile for {targetEmployee.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employeeSkills.map(skill => (
                  <div key={skill.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{skill.skillName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {skill.experienceLevel}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {skill.yearsOfExperience} years experience
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Paths Display */}
        {Object.entries(learningPaths).map(([skill, learningPath]) => (
          <Card key={skill} className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                Learning Path for {learningPath.skill}
              </CardTitle>
              <div className="flex gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {learningPath.totalDuration}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {learningPath.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Learning Steps */}
                <div>
                  <h4 className="font-semibold mb-3">Learning Steps</h4>
                  <div className="space-y-4">
                    {learningPath.steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <h5 className="font-medium">{step.title}</h5>
                          <Badge variant="outline" className="ml-auto">
                            {step.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                        
                        {/* Resources */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Resources:</div>
                          {step.resources.map((resource, resourceIndex) => (
                            <div key={resourceIndex} className="bg-gray-50 p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {resource.type === 'course' && <Code className="h-4 w-4 text-blue-500" />}
                                    {resource.type === 'book' && <Book className="h-4 w-4 text-green-500" />}
                                    {resource.type === 'certification' && <Award className="h-4 w-4 text-purple-500" />}
                                    <span className="font-medium text-sm">{resource.title}</span>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {resource.type}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    by {resource.provider}
                                  </div>
                                  <div className="text-xs text-gray-700 mb-2">
                                    {resource.description}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-xs font-medium text-green-600">
                                      {resource.cost}
                                    </span>
                                    <a 
                                      href={resource.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-accent hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View Resource
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                {learningPath.certifications && learningPath.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Professional Certifications
                    </h4>
                    <div className="grid gap-3">
                      {learningPath.certifications.map((cert, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-purple-900">{cert.name}</h5>
                              <p className="text-sm text-purple-700">by {cert.provider}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm font-medium text-purple-600">
                                  {cert.cost}
                                </span>
                                <span className="text-sm text-purple-600">
                                  {cert.timeToComplete}
                                </span>
                                <a 
                                  href={cert.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-800 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Learn More
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Projects */}
                {learningPath.practiceProjects.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Practice Projects
                    </h4>
                    <div className="grid gap-3">
                      {learningPath.practiceProjects.map((project, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900">{project.title}</h5>
                              <p className="text-sm text-blue-700 mt-1">{project.description}</p>
                              <Badge className="bg-blue-100 text-blue-800 mt-2 capitalize">
                                {project.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}