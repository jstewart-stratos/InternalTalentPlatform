import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Target, Award, BookOpen, ArrowRight, Star, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import type { Employee, Project, EmployeeSkill } from "@shared/schema";

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
    queryKey: ["/api/employees", targetEmployeeId?.toString(), "skills"],
    enabled: !!targetEmployeeId,
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

    // Generate recommendations based on career paths and project opportunities
    const careerPaths = getCareerPaths();
    
    careerPaths.forEach(path => {
      path.missingSkills.forEach(skill => {
        if (!currentSkills.has(skill)) {
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
            reasoning: `Required for ${path.title} career path. High demand with ${demand} projects requiring this skill.`,
            projectOpportunities: skillProjects.get(skill) || 0,
            averageSalaryImpact: priority === 'critical' ? '+15-25%' : priority === 'high' ? '+10-20%' : '+5-15%',
            learningPath: getLearningPath(skill),
            timeToAcquire: getTimeToAcquire(skill),
            relatedSkills: getRelatedSkills(skill, currentSkills),
            demandScore
          });
        }
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

  const getCareerPaths = (): CareerPath[] => {
    if (!targetEmployee || !employeeSkills.length) return [];

    const currentSkills = new Set(employeeSkills.map(s => s.skillName));
    
    const paths = [
      {
        title: "Senior Financial Analyst",
        description: "Lead complex financial modeling and analysis projects",
        requiredSkills: ["Financial Modeling", "Excel", "Python", "SQL", "Tableau", "Risk Management", "Portfolio Management"],
        salaryRange: "$80,000 - $120,000",
        estimatedTimeframe: "12-18 months"
      },
      {
        title: "Data Scientist",
        description: "Apply machine learning to financial data and predictions",
        requiredSkills: ["Python", "R", "Machine Learning", "SQL", "Statistics", "Tableau", "TensorFlow"],
        salaryRange: "$95,000 - $140,000",
        estimatedTimeframe: "18-24 months"
      },
      {
        title: "Product Manager",
        description: "Drive product strategy and development in fintech",
        requiredSkills: ["Product Management", "Agile", "SQL", "User Research", "A/B Testing", "Wireframing"],
        salaryRange: "$90,000 - $130,000",
        estimatedTimeframe: "15-20 months"
      },
      {
        title: "Cybersecurity Specialist",
        description: "Protect financial systems and ensure compliance",
        requiredSkills: ["Network Security", "Risk Assessment", "Compliance", "Penetration Testing", "CISSP"],
        salaryRange: "$85,000 - $125,000",
        estimatedTimeframe: "20-30 months"
      }
    ];

    return paths.map(path => {
      const missingSkills = path.requiredSkills.filter(skill => !currentSkills.has(skill));
      const completionPercentage = Math.round(((path.requiredSkills.length - missingSkills.length) / path.requiredSkills.length) * 100);

      return {
        ...path,
        missingSkills,
        completionPercentage
      };
    }).sort((a, b) => b.completionPercentage - a.completionPercentage);
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
  const careerPaths = getCareerPaths();
  const filteredPaths = selectedCareerPath === "all" ? careerPaths : 
    careerPaths.filter(path => path.title.toLowerCase().includes(selectedCareerPath.toLowerCase()));

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

          <Select value={selectedCareerPath} onValueChange={setSelectedCareerPath}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by career path" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Career Paths</SelectItem>
              <SelectItem value="analyst">Financial Analyst</SelectItem>
              <SelectItem value="scientist">Data Scientist</SelectItem>
              <SelectItem value="manager">Product Manager</SelectItem>
              <SelectItem value="security">Cybersecurity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetEmployee && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {recommendations.slice(0, 5).map((rec, index) => (
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Career Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Career Path Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPaths.slice(0, 4).map((path, index) => (
                    <div key={path.title} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{path.title}</h3>
                          <p className="text-sm text-gray-600">{path.description}</p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium text-green-600">{path.salaryRange}</div>
                          <div className="text-gray-600">{path.estimatedTimeframe}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{path.completionPercentage}%</span>
                        </div>
                        <Progress value={path.completionPercentage} className="h-2" />
                      </div>

                      {path.missingSkills.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Missing Skills:</div>
                          <div className="flex flex-wrap gap-1">
                            {path.missingSkills.slice(0, 4).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {path.missingSkills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{path.missingSkills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
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
      </div>
    </div>
  );
}