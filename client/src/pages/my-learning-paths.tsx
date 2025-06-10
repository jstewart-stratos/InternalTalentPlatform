import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, ExternalLink, CheckCircle, Trash2, Play, Heart } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SavedSkillRecommendation {
  id: number;
  employeeId: number;
  skillName: string;
  priority: string;
  reason: string;
  learningPath: any;
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
                      <CardTitle className="text-lg">{recommendation.skillName}</CardTitle>
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
                    {recommendation.learningPath && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Learning Path
                        </h4>
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {recommendation.learningPath.totalDuration}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {recommendation.learningPath.difficulty}
                          </Badge>
                        </div>
                        
                        {recommendation.learningPath.steps?.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Learning Steps:</h5>
                            {recommendation.learningPath.steps.slice(0, 2).map((step: any, index: number) => (
                              <div key={index} className="bg-white rounded p-3 border">
                                <div className="font-medium text-sm">{step.title}</div>
                                <div className="text-xs text-gray-600 mb-2">{step.description}</div>
                                {step.resources?.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={step.resources[0].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      {step.resources[0].title}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}