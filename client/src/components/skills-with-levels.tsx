import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Edit3, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SkillWithLevel {
  id?: number;
  skillName: string;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  lastUsed?: string;
  isEndorsed?: boolean;
  endorsementCount?: number;
}

interface SkillsWithLevelsProps {
  employeeId: number;
  skills: SkillWithLevel[];
  onSkillsChange?: (skills: SkillWithLevel[]) => void;
  readonly?: boolean;
}

const experienceLevels = [
  { value: "beginner", label: "Beginner", color: "bg-gray-100 text-gray-800", stars: 1 },
  { value: "intermediate", label: "Intermediate", color: "bg-blue-100 text-blue-800", stars: 2 },
  { value: "advanced", label: "Advanced", color: "bg-green-100 text-green-800", stars: 3 },
  { value: "expert", label: "Expert", color: "bg-purple-100 text-purple-800", stars: 4 },
];

export default function SkillsWithLevels({ employeeId, skills, onSkillsChange, readonly = false }: SkillsWithLevelsProps) {
  const [localSkills, setLocalSkills] = useState<SkillWithLevel[]>(skills);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState<Partial<SkillWithLevel>>({
    skillName: "",
    experienceLevel: "beginner",
    yearsOfExperience: 1,
  });
  const { toast } = useToast();

  useEffect(() => {
    setLocalSkills(skills);
  }, [skills]);

  const getExperienceLevelInfo = (level: string) => {
    return experienceLevels.find(l => l.value === level) || experienceLevels[0];
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 4 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a skill name",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    if (localSkills.some(s => s.skillName.toLowerCase() === newSkill.skillName?.toLowerCase())) {
      toast({
        title: "Error",
        description: "This skill already exists",
        variant: "destructive",
      });
      return;
    }

    const skillToAdd: SkillWithLevel = {
      skillName: newSkill.skillName.trim(),
      experienceLevel: newSkill.experienceLevel as any || "beginner",
      yearsOfExperience: newSkill.yearsOfExperience || 1,
      lastUsed: new Date().toISOString(),
      isEndorsed: false,
      endorsementCount: 0,
    };

    try {
      // In a real implementation, you would call an API here
      // const response = await fetch(`/api/employee-skills`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ...skillToAdd, employeeId }),
      // });
      
      // For now, simulate adding the skill
      const updatedSkills = [...localSkills, { ...skillToAdd, id: Date.now() }];
      setLocalSkills(updatedSkills);
      onSkillsChange?.(updatedSkills);
      
      setNewSkill({ skillName: "", experienceLevel: "beginner", yearsOfExperience: 1 });
      setIsAddingSkill(false);
      
      toast({
        title: "Success",
        description: "Skill added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      // In a real implementation, you would call an API here
      // await fetch(`/api/employee-skills/${skillId}`, { method: "DELETE" });
      
      const updatedSkills = localSkills.filter(s => s.id !== skillId);
      setLocalSkills(updatedSkills);
      onSkillsChange?.(updatedSkills);
      
      toast({
        title: "Success",
        description: "Skill removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSkill = async (skillId: number, updates: Partial<SkillWithLevel>) => {
    try {
      // In a real implementation, you would call an API here
      // await fetch(`/api/employee-skills/${skillId}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(updates),
      // });
      
      const updatedSkills = localSkills.map(s => 
        s.id === skillId ? { ...s, ...updates } : s
      );
      setLocalSkills(updatedSkills);
      onSkillsChange?.(updatedSkills);
      setEditingSkillId(null);
      
      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Skills & Experience Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {localSkills.map((skill) => {
            const levelInfo = getExperienceLevelInfo(skill.experienceLevel);
            const isEditing = editingSkillId === skill.id;
            
            return (
              <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex flex-col">
                    <span className="font-medium">{skill.skillName}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={levelInfo.color}>
                        {levelInfo.label}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {renderStars(levelInfo.stars)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {skill.yearsOfExperience} years
                      </span>
                      {skill.endorsementCount && skill.endorsementCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {skill.endorsementCount} endorsements
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {!readonly && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSkillId(isEditing ? null : skill.id!)}
                    >
                      {isEditing ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveSkill(skill.id!)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          
          {isAddingSkill && !readonly && (
            <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Skill name (e.g., JavaScript)"
                  value={newSkill.skillName || ""}
                  onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                />
                <Select
                  value={newSkill.experienceLevel || "beginner"}
                  onValueChange={(value) => setNewSkill({ ...newSkill, experienceLevel: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center space-x-2">
                          <span>{level.label}</span>
                          <div className="flex items-center">
                            {renderStars(level.stars)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Years"
                  value={newSkill.yearsOfExperience || 1}
                  onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 1 })}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleAddSkill}>
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingSkill(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!isAddingSkill && !readonly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingSkill(true)}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}