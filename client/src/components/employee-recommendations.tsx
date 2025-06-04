import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Users, Star, Target, TrendingUp, Lightbulb, Mail, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee, Project } from "@shared/schema";

interface EmployeeRecommendation {
  employee: Employee;
  compatibilityScore: number;
  matchingSkills: string[];
  additionalValue: string[];
  reasoning: string;
  recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
}

interface EmployeeRecommendationsProps {
  project: Project;
  onEmployeeSelect?: (employee: Employee) => void;
}

const recommendationColors = {
  perfect: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-blue-100 text-blue-800 border-blue-200",
  partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
  stretch: "bg-purple-100 text-purple-800 border-purple-200"
};

const recommendationIcons = {
  perfect: Star,
  good: TrendingUp,
  partial: Target,
  stretch: Lightbulb
};

export default function EmployeeRecommendations({ project, onEmployeeSelect }: EmployeeRecommendationsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["/api/recommendations/employees", project.id],
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/employees/${project.id}`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json() as EmployeeRecommendation[];
    },
    enabled: !!project.id
  });

  const toggleExpanded = (employeeId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedCards(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            Recommended Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-3 text-gray-600">Finding best candidates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            Recommended Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No suitable candidates found at this time.</p>
            <p className="text-sm text-gray-500 mt-2">
              Consider broadening skill requirements or posting publicly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          AI-Recommended Team Members
        </CardTitle>
        <p className="text-sm text-gray-600">
          Best candidates based on skills, experience, and project requirements
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.slice(0, 6).map((rec) => {
          const RecommendationIcon = recommendationIcons[rec.recommendationLevel];
          const isExpanded = expandedCards.has(rec.employee.id);
          
          return (
            <Card key={rec.employee.id} className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={rec.employee.profileImage || undefined} />
                      <AvatarFallback>
                        {rec.employee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{rec.employee.name}</h3>
                        <Badge className={recommendationColors[rec.recommendationLevel]}>
                          <RecommendationIcon className="h-3 w-3 mr-1" />
                          {rec.recommendationLevel}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-gray-600">{rec.employee.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {rec.employee.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.employee.experienceLevel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Match Score:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={rec.compatibilityScore} className="w-20 h-2" />
                            <span className="text-sm font-bold text-accent">{rec.compatibilityScore}%</span>
                          </div>
                        </div>
                      </div>

                      {rec.matchingSkills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Relevant skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.matchingSkills.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs bg-green-50 text-green-700">
                                {skill}
                              </Badge>
                            ))}
                            {rec.matchingSkills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{rec.matchingSkills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{rec.reasoning}</p>
                          </div>

                          {rec.additionalValue.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Additional value:</p>
                              <div className="flex flex-wrap gap-1">
                                {rec.additionalValue.map((value, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => onEmployeeSelect?.(rec.employee)}
                              className="bg-accent hover:bg-accent/90"
                              size="sm"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(rec.employee.id)}
                    className="ml-2"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}