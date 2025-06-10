import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrendingUp, Target, Award, BookOpen, ArrowRight, Star, Users, CheckCircle, ExternalLink, Book, Code, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, Project, EmployeeSkill } from "@shared/schema";

interface LearningResource {
  title: string;
  type: string;
  provider: string;
  url: string;
  cost: string;
  description: string;
}

interface LearningStep {
  title: string;
  description: string;
  duration: string;
  resources: LearningResource[];
}

interface Certification {
  name: string;
  provider: string;
  url: string;
  cost: string;
  timeToComplete: string;
}

interface PracticeProject {
  title: string;
  description: string;
  difficulty: string;
}

interface LearningPath {
  skill: string;
  totalDuration: string;
  difficulty: string;
  steps: LearningStep[];
  certifications: Certification[];
  practiceProjects: PracticeProject[];
}

interface SkillRecommendation {
  skillName: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  projectOpportunities: number;
  averageSalaryImpact: string;
  learningPath: string[];
  timeToAcquire: string;
  relatedSkills: string[];
  demandScore: number;
}



export default function SkillsGapAnalysis() {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedSkillForLearning, setSelectedSkillForLearning] = useState<string | null>(null);
  const [learningPaths, setLearningPaths] = useState<Map<string, LearningPath>>(new Map());


  const { data: currentEmployee } = useQuery<Employee>({
    queryKey: ["/api/employees/current"],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: allEmployeeSkills = [] } = useQuery<EmployeeSkill[]>({
    queryKey: ["/api/all-employee-skills"],
  });

  const targetEmployeeId = selectedEmployee === "current" || !selectedEmployee ? currentEmployee?.id : parseInt(selectedEmployee);
  const targetEmployee = employees.find(emp => emp.id === targetEmployeeId);

  const { data: employeeSkills = [] } = useQuery<EmployeeSkill[]>({
    queryKey: [`/api/employees/${targetEmployeeId}/skills`],
    enabled: !!targetEmployeeId,
  });

  // Learning path generation mutation
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
      setLearningPaths(prev => new Map(prev.set(variables.skill, data)));
    },
  });

  // Get skill recommendations for the selected employee
  const getSkillRecommendations = (): SkillRecommendation[] => {
    if (!targetEmployee || !employeeSkills.length) return [];

    const currentSkills = new Set(employeeSkills.map(s => s.skillName));
    const skillDemand = new Map<string, number>();
    const skillProjects = new Map<string, number>();

    // Calculate skill demand from all projects
    projects.forEach(project => {
      project.requiredSkills?.forEach(skill => {
        skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
        skillProjects.set(skill, (skillProjects.get(skill) || 0) + 1);
      });
    });

    // Calculate skill supply (how many employees have each skill)
    const skillSupply = new Map<string, number>();
    allEmployeeSkills.forEach(skill => {
      skillSupply.set(skill.skillName, (skillSupply.get(skill.skillName) || 0) + 1);
    });

    const recommendations: SkillRecommendation[] = [];

    // Generate recommendations based on project opportunities
    const allSkillsInProjects = new Set<string>();
    projects.forEach(project => {
      project.requiredSkills?.forEach(skill => {
        if (!currentSkills.has(skill)) {
          allSkillsInProjects.add(skill);
        }
      });
    });
    
    allSkillsInProjects.forEach(skill => {
      const demand = skillDemand.get(skill) || 0;
      const supply = skillSupply.get(skill) || 0;
      const demandScore = supply > 0 ? demand / supply : demand;
      
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (demandScore >= 2) priority = 'critical';
      else if (demandScore >= 1) priority = 'high';
      else if (demandScore >= 0.5) priority = 'medium';

      recommendations.push({
        skillName: skill,
        category: getCategoryForSkill(skill),
        priority,
        reasoning: `High demand skill with ${demand} projects requiring this expertise. Strong career advancement opportunity.`,
        projectOpportunities: skillProjects.get(skill) || 0,
        averageSalaryImpact: priority === 'critical' ? '+15-25%' : priority === 'high' ? '+10-20%' : '+5-15%',
        learningPath: getLearningPath(skill),
        timeToAcquire: getTimeToAcquire(skill),
        relatedSkills: getRelatedSkills(skill, currentSkills),
        demandScore
      });
    });

    // Remove duplicates and sort by priority and demand
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(r => [r.skillName, r])).values()
    );

    return uniqueRecommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.demandScore - a.demandScore;
      })
      .slice(0, 10);
  };



  const getCategoryForSkill = (skill: string): string => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('python') || skillLower.includes('sql') || skillLower.includes('r')) return 'Programming';
    if (skillLower.includes('financial') || skillLower.includes('risk') || skillLower.includes('portfolio')) return 'Finance';
    if (skillLower.includes('tableau') || skillLower.includes('power bi') || skillLower.includes('excel')) return 'Analytics';
    if (skillLower.includes('security') || skillLower.includes('compliance')) return 'Security';
    if (skillLower.includes('product') || skillLower.includes('agile')) return 'Management';
    return 'Technical';
  };

  const getLearningPath = (skill: string): string[] => {
    const paths: Record<string, string[]> = {
      'Python': ['Python Basics', 'Data Structures', 'Pandas & NumPy', 'Advanced Python'],
      'Machine Learning': ['Statistics Fundamentals', 'Python/R', 'ML Algorithms', 'Deep Learning'],
      'SQL': ['SQL Basics', 'Advanced Queries', 'Database Design', 'Performance Optimization'],
      'Tableau': ['Tableau Basics', 'Data Visualization', 'Advanced Analytics', 'Dashboard Design']
    };
    return paths[skill] || ['Fundamentals', 'Intermediate', 'Advanced', 'Specialization'];
  };

  const getTimeToAcquire = (skill: string): string => {
    const technical = ['Python', 'Machine Learning', 'SQL', 'R'];
    const analytical = ['Tableau', 'Excel', 'Financial Modeling'];
    
    if (technical.includes(skill)) return '3-6 months';
    if (analytical.includes(skill)) return '2-4 months';
    return '1-3 months';
  };

  const getRelatedSkills = (skill: string, currentSkills: Set<string>): string[] => {
    const relations: Record<string, string[]> = {
      'Python': ['SQL', 'Machine Learning', 'Data Science'],
      'SQL': ['Python', 'Tableau', 'Database Design'],
      'Machine Learning': ['Python', 'Statistics', 'TensorFlow'],
      'Tableau': ['SQL', 'Excel', 'Data Visualization']
    };
    
    return (relations[skill] || []).filter(s => !currentSkills.has(s)).slice(0, 3);
  };

  const priorityColors = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  const recommendations = getSkillRecommendations();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Gap Analysis & Career Growth</h1>
          <p className="text-gray-600">Personalized skill recommendations based on career goals and project opportunities</p>
        </div>

        {/* Employee Selection */}
        <div className="flex gap-4 mb-6">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select employee (default: you)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current User ({currentEmployee?.name})</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {targetEmployee && (
          <div className="max-w-4xl mx-auto">
            {/* Skill Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Recommended Skills for {targetEmployee.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.slice(0, 10).map((rec, index) => (
                    <div key={rec.skillName} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{rec.skillName}</h3>
                          <Badge variant="outline" className={`text-xs ${priorityColors[rec.priority]}`}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{rec.projectOpportunities} projects</div>
                          <div className="text-green-600 font-medium">{rec.averageSalaryImpact}</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Category:</span> {rec.category}
                        </div>
                        <div>
                          <span className="font-medium">Time to acquire:</span> {rec.timeToAcquire}
                        </div>
                      </div>

                      {rec.relatedSkills.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Related skills: </span>
                          <span className="text-xs text-gray-600">{rec.relatedSkills.join(', ')}</span>
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="text-xs font-medium mb-1">Learning Path:</div>
                        <div className="flex gap-1">
                          {rec.learningPath.map((step, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {step}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          onClick={() => {
                            const currentSkill = employeeSkills.find(s => s.skillName === rec.skillName);
                            generateLearningPath.mutate({
                              skill: rec.skillName,
                              currentLevel: currentSkill?.experienceLevel || 'beginner',
                              targetLevel: 'advanced',
                              context: `Financial services professional looking to advance in ${rec.category}`
                            });
                            setSelectedSkillForLearning(rec.skillName);
                          }}
                          disabled={generateLearningPath.isPending}
                          size="sm"
                          className="w-full"
                        >
                          {generateLearningPath.isPending && selectedSkillForLearning === rec.skillName ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-3 w-3 mr-1" />
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

        {/* OpenAI Learning Paths */}
        {Array.from(learningPaths.entries()).map(([skill, learningPath]) => (
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
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {resource.cost}
                                    </Badge>
                                    {resource.url && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => window.open(resource.url, '_blank')}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View Course
                                      </Button>
                                    )}
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
                {learningPath.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Recommended Certifications
                    </h4>
                    <div className="grid gap-3">
                      {learningPath.certifications.map((cert, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-purple-900">{cert.name}</h5>
                              <div className="text-sm text-purple-700 mb-2">by {cert.provider}</div>
                              <div className="flex gap-2 text-xs">
                                <Badge className="bg-purple-100 text-purple-800">
                                  {cert.timeToComplete}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800">
                                  {cert.cost}
                                </Badge>
                              </div>
                            </div>
                            {cert.url && (
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => window.open(cert.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Learn More
                              </Button>
                            )}
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