import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, ExternalLink, Check, X } from "lucide-react";
import { SiLinkedin } from "react-icons/si";

interface LinkedInSkill {
  name: string;
  endorsements: number;
  category: string;
}

interface LinkedInSkillsImportProps {
  onSkillsSelected: (skills: string[]) => void;
  currentSkills?: string[];
  className?: string;
}

export default function LinkedInSkillsImport({ 
  onSkillsSelected, 
  currentSkills = [],
  className = "" 
}: LinkedInSkillsImportProps) {
  const [linkedInProfile, setLinkedInProfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedInSkills, setLinkedInSkills] = useState<LinkedInSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [importComplete, setImportComplete] = useState(false);
  const { toast } = useToast();

  const handleImportSkills = async () => {
    if (!linkedInProfile.trim()) {
      toast({
        title: "LinkedIn Profile Required",
        description: "Please enter your LinkedIn profile URL or username",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/linkedin/import-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: linkedInProfile }),
      });

      if (!response.ok) {
        throw new Error('Failed to import LinkedIn skills');
      }

      const skills: LinkedInSkill[] = await response.json();
      setLinkedInSkills(skills);
      
      // Pre-select skills not already in current skills
      const newSkills = skills
        .filter(skill => !currentSkills.includes(skill.name))
        .map(skill => skill.name);
      setSelectedSkills(new Set(newSkills));

      toast({
        title: "Skills Imported Successfully",
        description: `Found ${skills.length} skills from your LinkedIn profile`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Unable to import skills from LinkedIn. Please check your profile URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillToggle = (skillName: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillName)) {
      newSelected.delete(skillName);
    } else {
      newSelected.add(skillName);
    }
    setSelectedSkills(newSelected);
  };

  const handleAddSelectedSkills = () => {
    const skillsToAdd = Array.from(selectedSkills);
    onSkillsSelected(skillsToAdd);
    setImportComplete(true);
    toast({
      title: "Skills Added",
      description: `${skillsToAdd.length} skills have been added to your profile`,
    });
  };

  const groupedSkills = linkedInSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, LinkedInSkill[]>);

  if (importComplete) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <Check className="h-5 w-5" />
            <span className="font-medium">LinkedIn skills imported successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SiLinkedin className="h-5 w-5 text-blue-600" />
          <span>Import Skills from LinkedIn</span>
        </CardTitle>
        <CardDescription>
          Automatically import your professional skills from your LinkedIn profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedInSkills.length === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin-profile">LinkedIn Profile URL or Username</Label>
              <div className="flex space-x-2">
                <Input
                  id="linkedin-profile"
                  placeholder="https://linkedin.com/in/your-profile or username"
                  value={linkedInProfile}
                  onChange={(e) => setLinkedInProfile(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleImportSkills} 
                  disabled={isLoading || !linkedInProfile.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How to find your LinkedIn profile URL:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to your LinkedIn profile page</li>
                    <li>Copy the URL from your browser (e.g., linkedin.com/in/yourname)</li>
                    <li>Or just enter your LinkedIn username</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                LinkedIn Skills ({linkedInSkills.length} found)
              </h3>
              <Button 
                onClick={handleAddSelectedSkills}
                disabled={selectedSkills.size === 0}
              >
                Add Selected Skills ({selectedSkills.size})
              </Button>
            </div>

            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {Object.entries(groupedSkills).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {skills.map((skill) => {
                        const isCurrentSkill = currentSkills.includes(skill.name);
                        const isSelected = selectedSkills.has(skill.name);
                        
                        return (
                          <div
                            key={skill.name}
                            className={`flex items-center space-x-3 p-2 rounded-lg border ${
                              isCurrentSkill 
                                ? 'bg-gray-100 border-gray-300' 
                                : isSelected 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isCurrentSkill}
                              onCheckedChange={() => handleSkillToggle(skill.name)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isCurrentSkill ? 'text-gray-500' : ''}`}>
                                  {skill.name}
                                </span>
                                {isCurrentSkill && (
                                  <Badge variant="secondary" className="text-xs">
                                    Already Added
                                  </Badge>
                                )}
                              </div>
                              {skill.endorsements > 0 && (
                                <p className="text-xs text-gray-500">
                                  {skill.endorsements} endorsements
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setLinkedInSkills([]);
                  setSelectedSkills(new Set());
                  setLinkedInProfile("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <p className="text-sm text-gray-500">
                Select skills to add to your profile
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}