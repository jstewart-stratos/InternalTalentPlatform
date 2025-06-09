import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, BarChart3, Star } from "lucide-react";

interface SkillLevelSummary {
  totalSkills: number;
  byLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  endorsedSkills: number;
  topSkills: Record<string, number>;
}

export default function AdminSkillSeeding() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [summary, setSummary] = useState<SkillLevelSummary | null>(null);
  const { toast } = useToast();

  const handleSeedSkillLevels = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/admin/seed-skill-levels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to seed skill levels");
      }

      const result = await response.json();
      setSummary(result.summary);
      
      toast({
        title: "Success",
        description: "Individual skill experience levels populated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed skill levels",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch("/api/admin/skill-levels-summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  // Load summary on component mount
  useState(() => {
    loadSummary();
  });

  const topSkillsArray = summary ? Object.entries(summary.topSkills)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Individual Skill Experience Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Transform basic skill lists into detailed experience tracking with individual skill levels, 
            years of experience, and endorsement data for more precise talent matching.
          </p>
          
          <Button 
            onClick={handleSeedSkillLevels} 
            disabled={isSeeding}
            className="w-full"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Skills...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Populate Individual Skill Levels
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Skill Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Skills:</span>
                  <Badge variant="outline">{summary.totalSkills}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">Beginner</span>
                    </div>
                    <Badge variant="secondary">{summary.byLevel.beginner}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <span className="text-sm">Intermediate</span>
                    </div>
                    <Badge variant="secondary">{summary.byLevel.intermediate}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <span className="text-sm">Advanced</span>
                    </div>
                    <Badge variant="secondary">{summary.byLevel.advanced}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <span className="text-sm">Expert</span>
                    </div>
                    <Badge variant="secondary">{summary.byLevel.expert}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Endorsed Skills:</span>
                  <Badge className="bg-green-100 text-green-800">{summary.endorsedSkills}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Skills by Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSkillsArray.map(([skill, count]) => (
                  <div key={skill} className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">{skill}</span>
                    <Badge variant="outline">{count} people</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}