import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Star, Users, Edit3, Check, X as XIcon, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EmployeeSkill, InsertEmployeeSkill } from "@shared/schema";

interface SkillsWithLevelsProps {
  employeeId: number;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function SkillsWithLevels({ 
  employeeId, 
  isOwnProfile, 
  isEditing, 
  onEditToggle 
}: SkillsWithLevelsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState({
    name: "",
    level: "beginner" as const,
    years: 1
  });
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["/api/employees", employeeId, "skills"],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/skills`);
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<EmployeeSkill[]>;
    },
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch all skills");
      return response.json() as Promise<string[]>;
    },
  });

  const { data: aiSuggestions = [], refetch: refetchSuggestions } = useQuery({
    queryKey: ["/api/skills/ai-suggestions", newSkill.name],
    queryFn: async () => {
      if (!newSkill.name.trim() || newSkill.name.length < 2) return [];
      const response = await fetch("/api/skills/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentSkill: newSkill.name,
          context: "skill_input",
          existingSkills: skills.map(s => s.skillName)
        })
      });
      if (!response.ok) return [];
      return response.json() as Promise<string[]>;
    },
    enabled: newSkill.name.length >= 2,
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skill: Omit<InsertEmployeeSkill, "employeeId">) => {
      return apiRequest(`/api/employees/${employeeId}/skills`, "POST", {
        ...skill,
        employeeId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      setNewSkill({ name: "", level: "beginner", years: 1 });
      toast({
        title: "Skill added",
        description: "Your skill has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: async ({ skillId, updates }: { skillId: number; updates: Partial<InsertEmployeeSkill> }) => {
      return apiRequest(`/api/employees/${employeeId}/skills/${skillId}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      setEditingSkill(null);
      toast({
        title: "Skill updated",
        description: "Your skill has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      return apiRequest(`/api/employees/${employeeId}/skills/${skillId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      toast({
        title: "Skill removed",
        description: "Your skill has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStarRating = (level: string) => {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const stars = levels[level as keyof typeof levels] || 1;
    return "⭐".repeat(stars);
  };

  const getLevelColor = (level: string) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-blue-100 text-blue-800", 
      advanced: "bg-purple-100 text-purple-800",
      expert: "bg-orange-100 text-orange-800"
    };
    return colors[level as keyof typeof colors] || colors.beginner;
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    
    addSkillMutation.mutate({
      skillName: newSkill.name.trim(),
      experienceLevel: newSkill.level,
      yearsOfExperience: newSkill.years,
      lastUsed: new Date(),
      isEndorsed: false,
      endorsementCount: 0
    });
  };

  const handleUpdateSkill = (skillId: number, updates: Partial<InsertEmployeeSkill>) => {
    updateSkillMutation.mutate({ skillId, updates });
  };

  const handleSkillNameChange = (value: string) => {
    setNewSkill(prev => ({ ...prev, name: value }));
    setShowSuggestions(value.length >= 2);
    setSelectedSuggestion(-1);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setNewSkill(prev => ({ ...prev, name: suggestion }));
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    const filteredExistingSkills = allSkills.filter(s => 
      s.toLowerCase().includes(newSkill.name.toLowerCase()) && 
      !skills.some(es => es.skillName === s)
    );
    const allSuggestions = [...aiSuggestions, ...filteredExistingSkills];
    const uniqueSuggestions = allSuggestions.filter((skill, index) => 
      allSuggestions.indexOf(skill) === index
    );
    const suggestions = uniqueSuggestions.slice(0, 8);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Skills & Experience</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {skills.length} skills
          </Badge>
        </div>
        {isOwnProfile && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEditToggle}
            className="flex items-center space-x-1"
          >
            <Edit3 className="h-3 w-3" />
            <span>{isEditing ? "Done" : "Manage"}</span>
          </Button>
        )}
      </div>

      {isEditing && isOwnProfile && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lightbulb className="h-4 w-4" />
                <span>Type any skill to get AI-powered suggestions and guidance</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Input
                    placeholder="Enter any skill (e.g., Python, Leadership, Risk Analysis...)"
                    value={newSkill.name}
                    onChange={(e) => handleSkillNameChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => newSkill.name.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pr-8"
                  />
                  {newSkill.name.length >= 2 && (
                    <Sparkles className="absolute right-2 top-2.5 h-4 w-4 text-orange-500 animate-pulse" />
                  )}
                  
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {(() => {
                        const filteredExistingSkills = allSkills.filter(s => 
                          s.toLowerCase().includes(newSkill.name.toLowerCase()) && 
                          !skills.some(es => es.skillName === s)
                        );
                        const allSuggestions = [...aiSuggestions, ...filteredExistingSkills];
                        const uniqueSuggestions = allSuggestions.filter((skill, index) => 
                          allSuggestions.indexOf(skill) === index
                        );
                        const suggestions = uniqueSuggestions.slice(0, 8);
                        
                        if (suggestions.length === 0) {
                          return (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              <Sparkles className="h-4 w-4 mx-auto mb-1" />
                              AI suggestions loading...
                            </div>
                          );
                        }
                        
                        return suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              index === selectedSuggestion ? 'bg-orange-50 border-orange-200' : ''
                            }`}
                            onClick={() => handleSelectSuggestion(suggestion)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{suggestion}</span>
                              {aiSuggestions.includes(suggestion) && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                                  AI
                                </Badge>
                              )}
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
                
                <Select 
                  value={newSkill.level} 
                  onValueChange={(value: any) => setNewSkill(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner ⭐</SelectItem>
                    <SelectItem value="intermediate">Intermediate ⭐⭐</SelectItem>
                    <SelectItem value="advanced">Advanced ⭐⭐⭐</SelectItem>
                    <SelectItem value="expert">Expert ⭐⭐⭐⭐</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  placeholder="Years"
                  min="1"
                  max="50"
                  value={newSkill.years}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) || 1 }))}
                />
                
                <Button 
                  onClick={handleAddSkill}
                  disabled={!newSkill.name.trim() || addSkillMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {skills.map((skill) => (
          <SkillItem
            key={skill.id}
            skill={skill}
            isEditing={isEditing && editingSkill === skill.id}
            isOwnProfile={isOwnProfile}
            canEdit={isEditing}
            onEdit={() => setEditingSkill(skill.id)}
            onCancelEdit={() => setEditingSkill(null)}
            onUpdate={(updates) => handleUpdateSkill(skill.id, updates)}
            onDelete={() => deleteSkillMutation.mutate(skill.id)}
            getStarRating={getStarRating}
            getLevelColor={getLevelColor}
          />
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No skills listed yet</p>
          {isOwnProfile && (
            <p className="text-sm">Click "Manage" to add your skills</p>
          )}
        </div>
      )}
    </div>
  );
}

interface SkillItemProps {
  skill: EmployeeSkill;
  isEditing: boolean;
  isOwnProfile: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: Partial<InsertEmployeeSkill>) => void;
  onDelete: () => void;
  getStarRating: (level: string) => string;
  getLevelColor: (level: string) => string;
}

function SkillItem({
  skill,
  isEditing,
  isOwnProfile,
  canEdit,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  getStarRating,
  getLevelColor
}: SkillItemProps) {
  const [editForm, setEditForm] = useState({
    level: skill.experienceLevel,
    years: skill.yearsOfExperience
  });

  const handleSave = () => {
    onUpdate({
      experienceLevel: editForm.level,
      yearsOfExperience: editForm.years
    });
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center">
            <Badge className="bg-gray-100 text-gray-800">{skill.skillName}</Badge>
          </div>
          <Select 
            value={editForm.level} 
            onValueChange={(value: any) => setEditForm(prev => ({ ...prev, level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner ⭐</SelectItem>
              <SelectItem value="intermediate">Intermediate ⭐⭐</SelectItem>
              <SelectItem value="advanced">Advanced ⭐⭐⭐</SelectItem>
              <SelectItem value="expert">Expert ⭐⭐⭐⭐</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="1"
            max="50"
            value={editForm.years || 1}
            onChange={(e) => setEditForm(prev => ({ ...prev, years: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit}>
            <XIcon className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <Badge className={getLevelColor(skill.experienceLevel)} variant="secondary">
          {skill.skillName}
        </Badge>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">{getStarRating(skill.experienceLevel)}</span>
          <span>{skill.experienceLevel}</span>
          <span>•</span>
          <span>{skill.yearsOfExperience} year{skill.yearsOfExperience !== 1 ? 's' : ''}</span>
        </div>
        {(skill.endorsementCount || 0) > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>{skill.endorsementCount || 0} endorsement{(skill.endorsementCount || 0) !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      {isOwnProfile && canEdit && (
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}