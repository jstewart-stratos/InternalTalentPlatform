import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TrendingSkill {
  skill: string;
  searchCount: number;
  employeeCount: number;
  trending: boolean;
}

export default function TrendingSkills() {
  const { data: trendingSkills = [], isLoading } = useQuery({
    queryKey: ["/api/trending-skills"],
    queryFn: async () => {
      const response = await fetch("/api/trending-skills");
      if (!response.ok) throw new Error("Failed to fetch trending skills");
      return response.json() as Promise<TrendingSkill[]>;
    },
  });

  const handleSkillClick = (skill: string) => {
    // Navigate to expert directory filtered by this skill
    const params = new URLSearchParams();
    params.set('skill', skill);
    window.location.href = `/expert-directory?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Skills</h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Discover the most sought-after skills in your organization and connect with experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingSkills.slice(0, 6).map((item, index) => (
            <Card 
              key={item.skill} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary"
              onClick={() => handleSkillClick(item.skill)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.skill}</h3>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{item.employeeCount} experts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.searchCount} searches</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.trending && (
                      <Badge variant="default" className="bg-accent text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                    <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((item.searchCount / Math.max(...trendingSkills.map(s => s.searchCount))) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {trendingSkills.length === 0 && (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trending skills yet</h3>
            <p className="text-gray-500">Start searching for skills to see trending data.</p>
          </div>
        )}
      </div>
    </div>
  );
}