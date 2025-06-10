import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, ExternalLink, CheckCircle, Trash2, Play, Heart, Star, TrendingUp, NotebookPen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

export default function MyLearningPaths() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const statusColors = {
    saved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800'
  };

  // Fetch saved skill recommendations
  const { data: savedRecommendations = [], isLoading } = useQuery<SavedSkillRecommendation[]>({
    queryKey: ["/api/saved-skill-recommendations"],
  });

  // Delete saved recommendation mutation
  const deleteRecommendation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest(`/api/saved-skill-recommendations/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-skill-recommendations"] });
      toast({
        title: "Recommendation Removed",
        description: "The skill recommendation has been removed from your learning paths.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove recommendation",
        variant: "destructive",
      });
    },
  });

  // Update progress mutation
  const updateProgress = useMutation({
    mutationFn: async ({ id, progressPercentage }: { id: number; progressPercentage: number }): Promise<SavedSkillRecommendation> => {
      const res = await apiRequest(`/api/saved-skill-recommendations/${id}/progress`, 'PUT', { progressPercentage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-skill-recommendations"] });
      toast({
        title: "Progress Updated",
        description: "Your learning progress has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  // Mark complete mutation
  const markComplete = useMutation({
    mutationFn: async (id: number): Promise<SavedSkillRecommendation> => {
      const res = await apiRequest(`/api/saved-skill-recommendations/${id}/complete`, 'PUT');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-skill-recommendations"] });
      toast({
        title: "Skill Completed!",
        description: "Congratulations on completing this learning path!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as complete",
        variant: "destructive",
      });
    },
  });

  // Complete learning step mutation
  const completeStep = useMutation({
    mutationFn: async ({ 
      savedRecommendationId, 
      stepIndex, 
      stepTitle 
    }: { 
      savedRecommendationId: number; 
      stepIndex: number; 
      stepTitle: string; 
    }) => {
      const res = await apiRequest('/api/learning-steps/complete', 'POST', {
        savedRecommendationId,
        stepIndex,
        stepTitle
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-skill-recommendations"] });
      toast({
        title: "Step Completed!",
        description: "Your progress has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete step",
        variant: "destructive",
      });
    },
  });

  // Request advanced materials mutation
  const requestAdvancedMaterial = useMutation({
    mutationFn: async ({ skill }: { skill: string }) => {
      const res = await apiRequest('/api/learning-paths/advanced-material', 'POST', { skill });
      return res.json();
    },
    onSuccess: (data, variables) => {
      setAdvancedMaterials(prev => ({ ...prev, [variables.skill]: data }));
      toast({
        title: "Advanced Materials Generated!",
        description: "Check the Advanced Materials section below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate advanced materials",
        variant: "destructive",
      });
    },
  });

  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: number[] }>({});
  const [advancedMaterials, setAdvancedMaterials] = useState<{ [skill: string]: any }>({});

  // Load completed steps for each recommendation
  useEffect(() => {
    if (savedRecommendations.length > 0) {
      const loadCompletedSteps = async () => {
        const completedStepsData: { [key: string]: number[] } = {};
        
        for (const recommendation of savedRecommendations) {
          try {
            const response = await fetch(`/api/learning-steps/completions/${recommendation.id}`);
            if (response.ok) {
              const completions = await response.json();
              completedStepsData[`${recommendation.id}`] = completions.map((c: any) => c.stepIndex);
            }
          } catch (error) {
            console.error(`Error loading completions for recommendation ${recommendation.id}:`, error);
          }
        }
        
        setCompletedSteps(completedStepsData);
      };
      
      loadCompletedSteps();
    }
  }, [savedRecommendations]);

  const handleProgressUpdate = (id: number, newProgress: number) => {
    updateProgress.mutate({ id, progressPercentage: newProgress });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
            <p>Loading your learning paths...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Paths</h1>
          <p className="text-gray-600">
            Track your progress on saved skill recommendations and learning paths.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <Heart className="h-4 w-4" />
            <span>Saved Recommendations: {savedRecommendations.length}/10</span>
          </div>
        </div>

        {savedRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Saved Learning Paths</h3>
                <p className="text-gray-600 mb-4">
                  You haven't saved any skill recommendations yet. Visit the Skills Gap Analysis page to discover and save learning paths.
                </p>
                <Button onClick={() => window.location.href = '/skills-gap-analysis'}>
                  Explore Skills Gap Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {savedRecommendations.filter(r => r.status === 'saved').length}
                    </div>
                    <div className="text-sm text-gray-600">Not Started</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {savedRecommendations.filter(r => r.status === 'in_progress').length}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {savedRecommendations.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saved Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {savedRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{recommendation.skill}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={`${priorityColors[recommendation.priority as keyof typeof priorityColors]} border`}>
                          {recommendation.priority}
                        </Badge>
                        <Badge className={`${statusColors[recommendation.status as keyof typeof statusColors]} border`}>
                          {recommendation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{recommendation.reason}</p>
                    
                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">{recommendation.progressPercentage}%</span>
                      </div>
                      <Progress value={recommendation.progressPercentage} className="h-2" />
                    </div>

                    {/* Learning Path Display */}
                    {recommendation.learningPathData && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Learning Path
                        </h4>
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {recommendation.learningPathData.totalDuration}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {recommendation.learningPathData.difficulty}
                          </Badge>
                        </div>
                        
                        {recommendation.learningPathData.steps?.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Learning Steps:</h5>
                            {recommendation.learningPathData.steps.map((step: any, index: number) => {
                              const isCompleted = completedSteps[`${recommendation.id}`]?.includes(index) || false;
                              return (
                                <div key={index} className={`bg-white rounded p-3 border ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                                      {step.title}
                                    </div>
                                    {!isCompleted && recommendation.status !== 'completed' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          completeStep.mutate({
                                            savedRecommendationId: recommendation.id,
                                            stepIndex: index,
                                            stepTitle: step.title
                                          });
                                          setCompletedSteps(prev => ({
                                            ...prev,
                                            [`${recommendation.id}`]: [...(prev[`${recommendation.id}`] || []), index]
                                          }));
                                        }}
                                        disabled={completeStep.isPending}
                                        className="text-xs h-6 px-2"
                                      >
                                        {completeStep.isPending ? (
                                          <Clock className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Complete"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">{step.description}</div>
                                  {step.resources?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {step.resources.slice(0, 2).map((resource: any, resourceIndex: number) => (
                                        <a 
                                          key={resourceIndex}
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                                        >
                                          {resource.title}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex gap-2 flex-wrap">
                        {recommendation.status !== 'completed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleProgressUpdate(recommendation.id, Math.min(100, recommendation.progressPercentage + 25))}
                              disabled={updateProgress.isPending}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              +25% Progress
                            </Button>
                            {recommendation.progressPercentage >= 75 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markComplete.mutate(recommendation.id)}
                                disabled={markComplete.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                          </>
                        )}
                        {recommendation.progressPercentage >= 50 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAdvancedMaterial.mutate({ skill: recommendation.skill })}
                            disabled={requestAdvancedMaterial.isPending}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            {requestAdvancedMaterial.isPending ? (
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <TrendingUp className="h-4 w-4 mr-2" />
                            )}
                            Advanced Materials
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRecommendation.mutate(recommendation.id)}
                        disabled={deleteRecommendation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Completion Info */}
                    {recommendation.completedAt && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        Completed on {new Date(recommendation.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Advanced Materials Section */}
            {Object.keys(advancedMaterials).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    Advanced Learning Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(advancedMaterials).map(([skill, material]) => (
                      <div key={skill} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 text-purple-900">{skill} - Advanced Track</h3>
                        <div className="flex gap-2 mb-4">
                          <Badge variant="outline" className="text-xs">
                            {material.totalDuration}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize text-purple-600">
                            {material.difficulty}
                          </Badge>
                        </div>
                        
                        {material.steps?.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Advanced Learning Steps:</h4>
                            {material.steps.map((step: any, index: number) => (
                              <div key={index} className="bg-purple-50 rounded p-3 border border-purple-200">
                                <div className="font-medium text-sm text-purple-900">{step.title}</div>
                                <div className="text-xs text-gray-600 mb-2">{step.description}</div>
                                {step.resources?.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {step.resources.map((resource: any, resourceIndex: number) => (
                                      <a 
                                        key={resourceIndex}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-purple-600 hover:underline flex items-center gap-1 bg-purple-100 px-2 py-1 rounded"
                                      >
                                        {resource.title}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {material.certifications?.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-medium text-sm">Advanced Certifications:</h4>
                            <div className="flex flex-wrap gap-2">
                              {material.certifications.map((cert: any, index: number) => (
                                <a
                                  key={index}
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm hover:bg-yellow-100 flex items-center gap-2"
                                >
                                  <NotebookPen className="h-4 w-4 text-yellow-600" />
                                  <div>
                                    <div className="font-medium">{cert.name}</div>
                                    <div className="text-xs text-gray-600">{cert.provider} - {cert.timeToComplete}</div>
                                  </div>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}