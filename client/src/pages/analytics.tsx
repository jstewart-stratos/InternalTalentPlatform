import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Target, Award, BarChart3, PieChart, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Employee, Project } from "@shared/schema";

interface SkillGapData {
  skill: string;
  category: string;
  currentEmployees: number;
  requiredByProjects: number;
  gapScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  departments: string[];
  projectedDemand: number;
}

interface DepartmentSkillData {
  department: string;
  totalEmployees: number;
  skillCoverage: number;
  topSkills: Array<{ skill: string; count: number }>;
  skillGaps: Array<{ skill: string; gap: number }>;
}

export default function Analytics() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json() as Promise<Project[]>;
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

  // Calculate analytics from employee data
  const skillCounts = employees.reduce((acc, employee) => {
    employee.skills?.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const departmentCounts = employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const availabilityStats = employees.reduce((acc, employee) => {
    acc[employee.availability] = (acc[employee.availability] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const experienceLevels = employees.reduce((acc, employee) => {
    const level = employee.yearsExperience <= 2 ? "Entry" :
                  employee.yearsExperience <= 5 ? "Mid" : "Senior";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Skills gap analysis functions
  const skillsGapAnalysis = (): SkillGapData[] => {
    const employeeSkills = new Map<string, Set<string>>();
    employees.forEach(emp => {
      if (emp.skills) {
        emp.skills.forEach(skill => {
          if (!employeeSkills.has(skill)) {
            employeeSkills.set(skill, new Set());
          }
          employeeSkills.get(skill)?.add(emp.department);
        });
      }
    });

    const projectSkills = new Map<string, number>();
    projects.forEach(project => {
      if (project.requiredSkills) {
        project.requiredSkills.forEach(skill => {
          projectSkills.set(skill, (projectSkills.get(skill) || 0) + 1);
        });
      }
    });

    const allSkills = new Set([...Array.from(employeeSkills.keys()), ...Array.from(projectSkills.keys())]);
    const gapData: SkillGapData[] = [];

    Array.from(allSkills).forEach(skill => {
      const currentEmployees = employees.filter(emp => emp.skills?.includes(skill)).length;
      const requiredByProjects = projectSkills.get(skill) || 0;
      const gap = Math.max(0, requiredByProjects - currentEmployees);
      const gapScore = currentEmployees > 0 ? gap / currentEmployees : requiredByProjects;
      
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (gapScore >= 2) priority = 'critical';
      else if (gapScore >= 1) priority = 'high';
      else if (gapScore >= 0.5) priority = 'medium';

      gapData.push({
        skill,
        category: getCategoryForSkill(skill),
        currentEmployees,
        requiredByProjects,
        gapScore,
        priority,
        departments: Array.from(employeeSkills.get(skill) || []),
        projectedDemand: requiredByProjects + Math.floor(requiredByProjects * 0.2),
      });
    });

    return gapData.sort((a, b) => b.gapScore - a.gapScore);
  };

  const getCategoryForSkill = (skill: string): string => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('react') || skillLower.includes('vue') || skillLower.includes('angular') || skillLower.includes('javascript') || skillLower.includes('typescript')) {
      return 'Frontend Development';
    }
    if (skillLower.includes('node') || skillLower.includes('python') || skillLower.includes('java') || skillLower.includes('api')) {
      return 'Backend Development';
    }
    if (skillLower.includes('sql') || skillLower.includes('database') || skillLower.includes('mongodb')) {
      return 'Database';
    }
    if (skillLower.includes('aws') || skillLower.includes('azure') || skillLower.includes('docker') || skillLower.includes('kubernetes')) {
      return 'DevOps/Cloud';
    }
    if (skillLower.includes('design') || skillLower.includes('ui') || skillLower.includes('ux')) {
      return 'Design';
    }
    return 'Other';
  };

  const getDepartmentAnalysis = (): DepartmentSkillData[] => {
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const allSkills = new Map<string, number>();
      
      deptEmployees.forEach(emp => {
        emp.skills?.forEach(skill => {
          allSkills.set(skill, (allSkills.get(skill) || 0) + 1);
        });
      });

      const topSkills = Array.from(allSkills.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const deptProjects = projects.filter(project => 
        deptEmployees.some(emp => emp.id === project.ownerId)
      );
      
      const requiredSkills = new Map<string, number>();
      deptProjects.forEach(project => {
        project.requiredSkills?.forEach(skill => {
          requiredSkills.set(skill, (requiredSkills.get(skill) || 0) + 1);
        });
      });

      const skillGaps = Array.from(requiredSkills.entries())
        .map(([skill, required]) => ({
          skill,
          gap: Math.max(0, required - (allSkills.get(skill) || 0))
        }))
        .filter(item => item.gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 5);

      return {
        department: dept,
        totalEmployees: deptEmployees.length,
        skillCoverage: allSkills.size,
        topSkills,
        skillGaps
      };
    });
  };

  const priorityColors = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  const priorityIcons = {
    critical: AlertTriangle,
    high: TrendingUp,
    medium: Target,
    low: CheckCircle,
  };

  const gapData = skillsGapAnalysis();
  const departmentData = getDepartmentAnalysis();
  const filteredGapData = gapData.filter(item => {
    const deptMatch = selectedDepartment === "all" || item.departments.includes(selectedDepartment);
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    return deptMatch && categoryMatch;
  });
  const categories = Array.from(new Set(gapData.map(item => item.category)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your organization's talent and skills</p>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Critical Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {filteredGapData.filter(item => item.priority === 'critical').length}
                    </div>
                    <p className="text-sm text-gray-600">Skills at risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-sm text-gray-600">Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Skills Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{filteredGapData.length}</div>
                    <p className="text-sm text-gray-600">Total skills</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Coverage Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round((filteredGapData.filter(item => item.currentEmployees > 0).length / Math.max(1, filteredGapData.length)) * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Skills covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills-gaps">Skills Gaps</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    Top Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topSkills.map(([skill, count], index) => (
                      <div key={skill} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                          <span className="text-sm">{skill}</span>
                        </div>
                        <Badge variant="secondary">{count} employees</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    Department Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(departmentCounts).map(([dept, count]) => (
                      <div key={dept} className="flex justify-between items-center">
                        <span className="text-sm">{dept}</span>
                        <Badge variant="outline">{count} employees</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills-gaps" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  Critical Skills Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredGapData.slice(0, 10).map((item) => {
                    const PriorityIcon = priorityIcons[item.priority];
                    const coveragePercentage = item.requiredByProjects > 0 
                      ? Math.min(100, (item.currentEmployees / item.requiredByProjects) * 100)
                      : 100;

                    return (
                      <div key={item.skill} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{item.skill}</h3>
                              <Badge className={priorityColors[item.priority]}>
                                <PriorityIcon className="h-3 w-3 mr-1" />
                                {item.priority}
                              </Badge>
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                            <div className="flex gap-6 text-sm text-gray-600">
                              <span><Users className="h-4 w-4 inline mr-1" />{item.currentEmployees} employees</span>
                              <span><Target className="h-4 w-4 inline mr-1" />{item.requiredByProjects} projects need this</span>
                              <span>Gap Score: {item.gapScore.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-accent">{Math.round(coveragePercentage)}%</div>
                            <div className="text-sm text-gray-600">Coverage</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Skill Coverage</span>
                            <span>{item.currentEmployees} / {item.requiredByProjects} needed</span>
                          </div>
                          <Progress value={coveragePercentage} className="h-2" />
                        </div>

                        {item.departments.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Present in: </span>
                            {item.departments.map(dept => (
                              <Badge key={dept} variant="secondary" className="mr-1">
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {departmentData.map((dept) => (
                <Card key={dept.department}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{dept.department}</span>
                      <Badge variant="outline">{dept.totalEmployees} employees</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Top Skills</h4>
                      <div className="space-y-2">
                        {dept.topSkills.map((skill) => (
                          <div key={skill.skill} className="flex justify-between items-center">
                            <span className="text-sm">{skill.skill}</span>
                            <Badge variant="secondary">{skill.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {dept.skillGaps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Critical Gaps</h4>
                        <div className="space-y-2">
                          {dept.skillGaps.map((gap) => (
                            <div key={gap.skill} className="flex justify-between items-center">
                              <span className="text-sm">{gap.skill}</span>
                              <Badge variant="destructive">-{gap.gap}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}