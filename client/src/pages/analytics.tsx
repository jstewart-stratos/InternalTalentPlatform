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
  projectedDemand: number;
}

export default function Analytics() {
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

  // Fetch service categories for analytics
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ["/api/service-categories"],
    queryFn: async () => {
      const response = await fetch("/api/service-categories");
      if (!response.ok) throw new Error("Failed to fetch service categories");
      return response.json() as Promise<Array<{
        id: number;
        name: string;
        description: string;
        createdAt: string;
      }>>;
    },
  });

  // Fetch professional services for category analytics
  const { data: professionalServices = [] } = useQuery({
    queryKey: ["/api/professional-services"],
    queryFn: async () => {
      const response = await fetch("/api/professional-services");
      if (!response.ok) throw new Error("Failed to fetch professional services");
      return response.json() as Promise<Array<{
        id: number;
        title: string;
        categoryId: number;
        providerId: number;
        status: string;
        pricing: number;
      }>>;
    },
  });

  // Fetch all employee skills for accurate gap analysis
  const { data: allEmployeeSkills = [] } = useQuery({
    queryKey: ["/api/all-employee-skills"],
    queryFn: async () => {
      const response = await fetch("/api/all-employee-skills");
      if (!response.ok) throw new Error("Failed to fetch employee skills");
      return response.json() as Promise<Array<{
        id: number;
        employeeId: number;
        skillName: string;
        experienceLevel: string;
        yearsOfExperience: number;
        employee: { name: string; };
      }>>;
    },
  });

  // Calculate analytics from employee skills data
  const skillCounts = allEmployeeSkills.reduce((acc, skillRecord) => {
    acc[skillRecord.skillName] = (acc[skillRecord.skillName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const titleCounts = employees.reduce((acc, employee) => {
    acc[employee.title] = (acc[employee.title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const availabilityStats = employees.reduce((acc, employee) => {
    const status = employee.availabilityStatus || 'available';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const experienceLevels = employees.reduce((acc, employee) => {
    const level = employee.yearsExperience <= 2 ? "Entry" :
                  employee.yearsExperience <= 5 ? "Mid" : "Senior";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Mock skill gap data for demonstration
  const skillGapData: SkillGapData[] = [
    {
      skill: "React Development",
      category: "Frontend",
      currentEmployees: 12,
      requiredByProjects: 18,
      gapScore: 6,
      priority: 'high',
      projectedDemand: 22
    },
    {
      skill: "Data Analysis",
      category: "Analytics",
      currentEmployees: 8,
      requiredByProjects: 15,
      gapScore: 7,
      priority: 'critical',
      projectedDemand: 20
    },
    {
      skill: "Project Management",
      category: "Management",
      currentEmployees: 15,
      requiredByProjects: 20,
      gapScore: 5,
      priority: 'medium',
      projectedDemand: 25
    }
  ];

  const filteredSkillGaps = selectedCategory === "all" 
    ? skillGapData 
    : skillGapData.filter(item => item.category === selectedCategory);

  const categories = Array.from(new Set(skillGapData.map(item => item.category)));

  // Calculate service category analytics
  const serviceCategoryStats = serviceCategories.map(category => {
    const servicesInCategory = professionalServices.filter(service => service.categoryId === category.id);
    const activeServices = servicesInCategory.filter(service => service.status === 'active');
    const averagePrice = servicesInCategory.length > 0 
      ? servicesInCategory.reduce((sum, service) => sum + (service.pricing || 0), 0) / servicesInCategory.length 
      : 0;
    
    return {
      ...category,
      totalServices: servicesInCategory.length,
      activeServices: activeServices.length,
      averagePrice,
      utilizationRate: servicesInCategory.length > 0 ? (activeServices.length / servicesInCategory.length) * 100 : 0
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Registered</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.skillsRegistered || 0}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successfulMatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              +24% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projectsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="skills-gaps">Skills Gaps</TabsTrigger>
          <TabsTrigger value="services">Service Categories</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSkills.map(([skill, count], index) => (
                    <div key={skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{skill}</span>
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
                  <PieChart className="h-5 w-5" />
                  Experience Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(experienceLevels).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="font-medium">{level} Level</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / employees.length) * 100} 
                          className="w-24 h-2" 
                        />
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {topSkills.map(([skill, count]) => {
                  const percentage = (count / employees.length) * 100;
                  return (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{skill}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} employees ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills-gaps" className="space-y-6">
          <div className="flex gap-4 mb-6">
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
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Skills Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSkillGaps.map((item) => {
                  const coveragePercentage = (item.currentEmployees / item.requiredByProjects) * 100;
                  const priorityColor = {
                    critical: 'destructive',
                    high: 'orange',
                    medium: 'yellow',
                    low: 'green'
                  };

                  return (
                    <div key={item.skill} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{item.skill}</h3>
                        <Badge variant={priorityColor[item.priority] as any}>
                          {item.priority} priority
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">{item.currentEmployees}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Required: </span>
                          <span className="font-medium">{item.requiredByProjects}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gap: </span>
                          <span className="font-medium text-red-600">-{item.gapScore}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Coverage</span>
                          <span>{coveragePercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={coveragePercentage} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Service Categories Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{serviceCategories.length}</div>
                      <div className="text-sm text-muted-foreground">Total Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{professionalServices.length}</div>
                      <div className="text-sm text-muted-foreground">Total Services</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Services</span>
                      <span>{professionalServices.filter(s => s.status === 'active').length}</span>
                    </div>
                    <Progress 
                      value={professionalServices.length > 0 ? (professionalServices.filter(s => s.status === 'active').length / professionalServices.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceCategoryStats
                    .sort((a, b) => b.totalServices - a.totalServices)
                    .slice(0, 5)
                    .map((category, index) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary">{category.totalServices} services</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {serviceCategoryStats.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Utilization Rate</div>
                        <div className="text-lg font-semibold">
                          {category.utilizationRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{category.totalServices}</div>
                        <div className="text-xs text-muted-foreground">Total Services</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{category.activeServices}</div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">
                          ${category.averagePrice.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Price</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Service Utilization</span>
                        <span>{category.activeServices}/{category.totalServices}</span>
                      </div>
                      <Progress value={category.utilizationRate} className="h-2" />
                    </div>

                    {category.totalServices === 0 && (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No services in this category yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(availabilityStats).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{status}</span>
                      <Badge variant="outline">{count} employees</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(titleCounts).slice(0, 8).map(([title, count]) => (
                    <div key={title} className="flex items-center justify-between">
                      <span className="font-medium">{title}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}