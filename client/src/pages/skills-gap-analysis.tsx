import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, User, CheckCircle, BookOpen, Clock, ExternalLink, Save, Heart } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface SavedSkillRecommendation {
  id: number;
  employeeId: number;
  skill: string;
  priority: string;
  reason: string;
  learningPathData: any;
  status: 'saved' | 'in_progress' | 'completed';
  progressPercentage: number;
  savedAt: string;
  lastAccessedAt?: string;
  completedAt?: string;
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
  const [learningPaths, setLearningPaths] = useState<{ [skill: string]: LearningPath }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  // Fetch current employee
  const { data: currentEmployee } = useQuery<Employee>({
    queryKey: ["/api/employees/current"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch skills for current employee
  const { data: employeeSkills = [], isLoading: skillsLoading } = useQuery<EmployeeSkill[]>({
    queryKey: [`/api/employees/${currentEmployee?.id}/skills`],
    enabled: !!currentEmployee?.id,
  });

  // Fetch saved skill recommendations
  const { data: savedRecommendations = [] } = useQuery<SavedSkillRecommendation[]>({
    queryKey: ["/api/saved-skill-recommendations"],
  });

  // Save skill recommendation mutation
  const saveSkillRecommendation = useMutation({
    mutationFn: async (recommendationData: {
      skill: string;
      priority: string;
      reason: string;
      learningPathData?: any;
      status?: string;
    }): Promise<SavedSkillRecommendation> => {
      const res = await apiRequest('/api/saved-skill-recommendations', 'POST', recommendationData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-skill-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
      toast({
        title: "Skill Recommendation Saved",
        description: "Learning resources have been added to your My Learning Paths.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save skill recommendation",
        variant: "destructive",
      });
    },
  });

  // Generate learning path mutation
  const generateLearningPath = useMutation({
    mutationFn: async (skillData: { skill: string; currentLevel?: string; targetLevel?: string; context?: string }): Promise<LearningPath> => {
      const res = await apiRequest('/api/learning-paths', 'POST', skillData);
      return res.json();
    },
    onSuccess: (data: LearningPath, variables) => {
      setLearningPaths(prev => ({
        ...prev,
        [variables.skill]: data
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
    }
  });

  // Helper functions
  const isSkillAlreadySaved = (skillName: string) => {
    return savedRecommendations.some(rec => rec.skill === skillName);
  };

  const handleSaveRecommendation = async (recommendation: SkillRecommendation) => {
    if (savedRecommendations.length >= 10) {
      toast({
        title: "Limit Reached",
        description: "You can only save up to 10 skill recommendations. Please remove some existing ones first.",
        variant: "destructive",
      });
      return;
    }

    if (isSkillAlreadySaved(recommendation.skill)) {
      toast({
        title: "Already Saved",
        description: "This skill recommendation is already in your saved list.",
        variant: "destructive",
      });
      return;
    }

    // Get or generate learning path first
    let learningPath = learningPaths[recommendation.skill];
    
    if (!learningPath) {
      try {
        toast({
          title: "Generating Learning Path",
          description: "Creating personalized learning resources...",
        });
        
        const response = await apiRequest('/api/learning-paths', 'POST', {
          skill: recommendation.skill,
          currentLevel: 'beginner',
          targetLevel: 'intermediate',
          context: 'financial'
        });
        learningPath = await response.json();
        
        // Update local state
        setLearningPaths(prev => ({
          ...prev,
          [recommendation.skill]: learningPath
        }));
      } catch (error) {
        console.error('Failed to generate learning path:', error);
        toast({
          title: "Learning Path Generation Failed",
          description: "Saving skill without learning path. You can generate it later.",
          variant: "destructive",
        });
      }
    }
    
    saveSkillRecommendation.mutate({
      skill: recommendation.skill,
      priority: recommendation.priority,
      reason: recommendation.reason,
      learningPathData: learningPath || null,
      status: 'saved'
    });
  };

  // Generate skill recommendations based on employee skills and projects
  const recommendations: SkillRecommendation[] = [];
  
  if (currentEmployee && projects.length > 0) {
    const employeeSkillNames = employeeSkills.map(skill => skill.skillName.toLowerCase());
    const allProjectSkills = projects.flatMap(project => project.requiredSkills);
    const skillDemand: { [skill: string]: number } = {};
    
    allProjectSkills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase();
      skillDemand[normalizedSkill] = (skillDemand[normalizedSkill] || 0) + 1;
    });

    // Find skills that are in demand but not possessed by employee
    for (const [skill, demand] of Object.entries(skillDemand)) {
      if (!employeeSkillNames.includes(skill)) {
        recommendations.push({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          priority: demand >= 3 ? 'high' : demand >= 2 ? 'medium' : 'low',
          reason: `This skill is required for ${demand} active project(s) and would enhance your project eligibility.`,
          projectDemand: demand,
          currentGap: true
        });
      }
    }

    // Add some growth recommendations for existing skills
    const growthSkills = ['Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Blockchain', 'Cybersecurity', 'API Development', 'Digital Transformation'];
    growthSkills.forEach(skill => {
      if (!employeeSkillNames.includes(skill.toLowerCase()) && recommendations.length < 10) {
        recommendations.push({
          skill,
          priority: 'medium',
          reason: 'Emerging skill that would expand your career opportunities in the financial services industry.',
          projectDemand: 0,
          currentGap: false
        });
      }
    });

    // Limit to exactly 10 recommendations to match save limit
    recommendations.splice(10);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Gap Analysis</h1>
          <p className="text-gray-600">
            Identify skill gaps and get personalized learning recommendations to advance your career.
          </p>
        </div>

        {/* Current Employee Profile */}
        {currentEmployee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Your Career Growth Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{currentEmployee.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Department:</span> {currentEmployee.department}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {currentEmployee.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Skills Overview */}
        {currentEmployee && employeeSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Your Current Skills Profile
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

        {/* Skill Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Skill Recommendations for {currentEmployee?.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Heart className="h-4 w-4" />
                  <span>Saved: {savedRecommendations.length}/10</span>
                </div>
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
                        ) : learningPaths[rec.skill] ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Learning Path
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Get Learning Resources
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveRecommendation(rec)}
                        disabled={
                          saveSkillRecommendation.isPending || 
                          isSkillAlreadySaved(rec.skill) ||
                          savedRecommendations.length >= 10
                        }
                      >
                        {saveSkillRecommendation.isPending ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : isSkillAlreadySaved(rec.skill) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Inline Learning Path Display */}
                    {learningPaths[rec.skill] && (
                      <div className="mt-4 border-t pt-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Learning Path for {rec.skill}
                          </h4>
                          <div className="flex gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {learningPaths[rec.skill].totalDuration}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {learningPaths[rec.skill].difficulty}
                            </Badge>
                          </div>
                          
                          {/* First Learning Step Preview */}
                          {learningPaths[rec.skill].steps.length > 0 && (
                            <div className="mb-3">
                              <h5 className="font-medium text-sm mb-2">Start with:</h5>
                              <div className="bg-white rounded p-3 border">
                                <div className="font-medium text-sm">{learningPaths[rec.skill].steps[0].title}</div>
                                <div className="text-xs text-gray-600 mb-2">{learningPaths[rec.skill].steps[0].description}</div>
                                {learningPaths[rec.skill].steps[0].resources.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">First Resource:</span>
                                    <a 
                                      href={learningPaths[rec.skill].steps[0].resources[0].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      {learningPaths[rec.skill].steps[0].resources[0].title}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Scroll to full learning path
                              const element = document.getElementById(`learning-path-${rec.skill}`);
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-100"
                          >
                            View Complete Learning Path
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Learning Paths Display */}
        {Object.entries(learningPaths).length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Complete Learning Paths</h3>
            {Object.entries(learningPaths).map(([skill, learningPath]) => (
              <Card key={skill} id={`learning-path-${skill}`} className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Complete Learning Path: {learningPath.skill}
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
                              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                {index + 1}
                              </span>
                              <h5 className="font-medium">{step.title}</h5>
                              <Badge variant="outline" className="text-xs">{step.duration}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                            {step.resources.length > 0 && (
                              <div className="space-y-2">
                                <h6 className="text-sm font-medium">Resources:</h6>
                                <div className="grid grid-cols-1 gap-2">
                                  {step.resources.map((resource, resIndex) => (
                                    <div key={resIndex} className="bg-gray-50 p-3 rounded border">
                                      <div className="flex justify-between items-start mb-1">
                                        <a 
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          {resource.title}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                        <span className="text-xs text-green-600 font-medium">{resource.cost}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-1">{resource.description}</div>
                                      <div className="flex gap-2">
                                        <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                        <Badge variant="outline" className="text-xs">{resource.provider}</Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {learningPath.certifications.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Recommended Certifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {learningPath.certifications.map((cert, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <a 
                                href={cert.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline flex items-center gap-1 mb-2"
                              >
                                {cert.name}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <div className="text-sm text-gray-600 mb-2">Provider: {cert.provider}</div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{cert.timeToComplete}</span>
                                <span className="text-sm font-medium text-green-600">{cert.cost}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice Projects */}
                    {learningPath.practiceProjects.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Practice Projects</h4>
                        <div className="space-y-3">
                          {learningPath.practiceProjects.map((project, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium">{project.title}</h5>
                                <Badge variant="outline" className="text-xs capitalize">{project.difficulty}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{project.description}</p>
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
        )}
      </div>
    </div>
  );
}