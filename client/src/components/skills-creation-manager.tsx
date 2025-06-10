import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Star, Edit3, Sparkles, Lightbulb, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SkillWithExperience {
  id: string; // temporary ID for managing state
  skillName: string;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
}

interface SkillsCreationManagerProps {
  skills: SkillWithExperience[];
  onSkillsChange: (skills: SkillWithExperience[]) => void;
  className?: string;
}

export default function SkillsCreationManager({ 
  skills, 
  onSkillsChange,
  className = ""
}: SkillsCreationManagerProps) {
  const [newSkill, setNewSkill] = useState({
    name: "",
    level: "beginner" as const,
    years: 1
  });
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  const { data: allSkills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch all skills");
      return response.json() as Promise<string[]>;
    },
  });

  const { data: aiSuggestions = [] } = useQuery({
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
    
    const newSkillEntry: SkillWithExperience = {
      id: `skill_${Date.now()}_${Math.random()}`,
      skillName: newSkill.name.trim(),
      experienceLevel: newSkill.level,
      yearsOfExperience: newSkill.years
    };
    
    onSkillsChange([...skills, newSkillEntry]);
    setNewSkill({ name: "", level: "beginner", years: 1 });
  };

  const handleUpdateSkill = (skillId: string, updates: Partial<SkillWithExperience>) => {
    const updatedSkills = skills.map(skill => 
      skill.id === skillId ? { ...skill, ...updates } : skill
    );
    onSkillsChange(updatedSkills);
    setEditingSkill(null);
  };

  const handleDeleteSkill = (skillId: string) => {
    const updatedSkills = skills.filter(skill => skill.id !== skillId);
    onSkillsChange(updatedSkills);
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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Skills & Experience</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {skills.length} skills
          </Badge>
        </div>
      </div>

      {/* Add new skill form */}
      <Card className="border-dashed border-2 border-gray-300 bg-gradient-to-br from-orange-50 to-blue-50">
        <CardContent className="pt-6 pb-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-gray-700">
              <Lightbulb className="h-5 w-5 text-orange-500" />
              <span className="text-base font-medium">Add a new skill with experience details</span>
            </div>
            
            <div className="space-y-4">
              {/* Skill Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Skill Name</label>
                <div className="relative">
                  <Input
                    placeholder="Enter any skill (e.g., Python, Leadership, Risk Analysis, Data Science...)"
                    value={newSkill.name}
                    onChange={(e) => handleSkillNameChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => newSkill.name.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="h-12 text-base pr-10 border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                  {newSkill.name.length >= 2 && (
                    <Sparkles className="absolute right-3 top-3.5 h-5 w-5 text-orange-500 animate-pulse" />
                  )}
                  
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
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
                            <div className="p-4 text-center text-gray-500">
                              <Sparkles className="h-5 w-5 mx-auto mb-2 text-orange-400" />
                              <span className="text-sm">AI suggestions loading...</span>
                            </div>
                          );
                        }
                        
                        return suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            className={`w-full text-left px-4 py-3 text-base hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              index === selectedSuggestion ? 'bg-orange-50 border-orange-200' : ''
                            }`}
                            onClick={() => handleSelectSuggestion(suggestion)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{suggestion}</span>
                              {aiSuggestions.includes(suggestion) && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs font-semibold">
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
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Type to see AI-powered suggestions and existing skills</span>
                </p>
              </div>

              {/* Experience Level and Years */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Experience Level</label>
                  <Select 
                    value={newSkill.level} 
                    onValueChange={(value: any) => setNewSkill(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner" className="text-base py-3">
                        <div className="flex items-center space-x-2">
                          <span>⭐</span>
                          <span>Beginner</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate" className="text-base py-3">
                        <div className="flex items-center space-x-2">
                          <span>⭐⭐</span>
                          <span>Intermediate</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced" className="text-base py-3">
                        <div className="flex items-center space-x-2">
                          <span>⭐⭐⭐</span>
                          <span>Advanced</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expert" className="text-base py-3">
                        <div className="flex items-center space-x-2">
                          <span>⭐⭐⭐⭐</span>
                          <span>Expert</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                  <Input
                    type="number"
                    placeholder="Enter years"
                    min="1"
                    max="50"
                    value={newSkill.years}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) || 1 }))}
                    className="h-12 text-base border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
              </div>

              {/* Add Button */}
              <Button 
                onClick={handleAddSkill}
                disabled={!newSkill.name.trim()}
                className="w-full h-12 text-base font-medium bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Skill
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map((skill) => (
          <SkillItem
            key={skill.id}
            skill={skill}
            isEditing={editingSkill === skill.id}
            onEdit={() => setEditingSkill(skill.id)}
            onCancelEdit={() => setEditingSkill(null)}
            onUpdate={(updates) => handleUpdateSkill(skill.id, updates)}
            onDelete={() => handleDeleteSkill(skill.id)}
            getStarRating={getStarRating}
            getLevelColor={getLevelColor}
          />
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No skills added yet</p>
          <p className="text-sm">Use the form above to add your first skill</p>
        </div>
      )}
    </div>
  );
}

interface SkillItemProps {
  skill: SkillWithExperience;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: Partial<SkillWithExperience>) => void;
  onDelete: () => void;
  getStarRating: (level: string) => string;
  getLevelColor: (level: string) => string;
}

function SkillItem({
  skill,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  getStarRating,
  getLevelColor
}: SkillItemProps) {
  const [editData, setEditData] = useState({
    experienceLevel: skill.experienceLevel,
    yearsOfExperience: skill.yearsOfExperience
  });

  const handleSave = () => {
    onUpdate(editData);
  };

  if (isEditing) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="font-medium text-gray-900">{skill.skillName}</div>
            
            <div className="space-y-2">
              <Select
                value={editData.experienceLevel}
                onValueChange={(value: any) => setEditData(prev => ({ ...prev, experienceLevel: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">⭐ Beginner</SelectItem>
                  <SelectItem value="intermediate">⭐⭐ Intermediate</SelectItem>
                  <SelectItem value="advanced">⭐⭐⭐ Advanced</SelectItem>
                  <SelectItem value="expert">⭐⭐⭐⭐ Expert</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                min="1"
                max="50"
                value={editData.yearsOfExperience}
                onChange={(e) => setEditData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 1 }))}
                placeholder="Years"
                className="h-10"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate mb-2">{skill.skillName}</div>
            <div className="space-y-1">
              <Badge className={`text-xs font-medium ${getLevelColor(skill.experienceLevel)}`}>
                {getStarRating(skill.experienceLevel)} {skill.experienceLevel}
              </Badge>
              <div className="text-xs text-gray-500">
                {skill.yearsOfExperience} year{skill.yearsOfExperience !== 1 ? 's' : ''} experience
              </div>
            </div>
          </div>
          <div className="flex space-x-1 ml-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}