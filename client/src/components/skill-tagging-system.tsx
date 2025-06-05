import { useState, useEffect, useRef } from "react";
import { Plus, X, Sparkles, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface SkillTaggingSystemProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
  showAISuggestions?: boolean;
  context?: 'profile' | 'project' | 'search';
}

interface SkillSuggestion {
  skill: string;
  relevance: number;
  category: string;
  relatedTo?: string[];
}

export default function SkillTaggingSystem({
  selectedSkills,
  onSkillsChange,
  placeholder = "Add skills...",
  maxSkills = 20,
  showAISuggestions = true,
  context = 'profile'
}: SkillTaggingSystemProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get existing skills from the platform for autocomplete
  const { data: existingSkills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<string[]>;
    },
  });

  // Get AI skill suggestions based on current skills and context
  const { data: aiSuggestions = [] } = useQuery({
    queryKey: ["/api/skills/ai-suggestions", selectedSkills, context],
    queryFn: async () => {
      if (!showAISuggestions || selectedSkills.length === 0) return [];
      const response = await fetch("/api/skills/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentSkills: selectedSkills, 
          context,
          limit: 8 
        }),
      });
      if (!response.ok) return [];
      return response.json() as Promise<SkillSuggestion[]>;
    },
    enabled: showAISuggestions && selectedSkills.length > 0,
  });

  // Popular skills based on platform data
  const { data: popularSkills = [] } = useQuery({
    queryKey: ["/api/skills/popular"],
    queryFn: async () => {
      const response = await fetch("/api/skills/popular?limit=12");
      if (!response.ok) throw new Error("Failed to fetch popular skills");
      return response.json() as Promise<{ skill: string; count: number }[]>;
    },
  });

  // Filter suggestions based on input and exclude already selected skills
  const filteredSuggestions = existingSkills
    .filter(skill => 
      skill.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedSkills.includes(skill)
    )
    .slice(0, 8);

  const suggestedPopularSkills = popularSkills
    .filter(item => !selectedSkills.includes(item.skill))
    .slice(0, 6);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill) && selectedSkills.length < maxSkills) {
      onSkillsChange([...selectedSkills, trimmedSkill]);
      setInputValue("");
      setIsOpen(false);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && !inputValue && selectedSkills.length > 0) {
      removeSkill(selectedSkills[selectedSkills.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (selectedSkills.length === 0) {
      setShowSuggestions(true);
    }
  };

  const getSkillColor = (skill: string) => {
    // Simple hash function to assign consistent colors
    const hash = skill.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-orange-100 text-orange-800",
      "bg-teal-100 text-teal-800",
    ];
    return colors[hash % colors.length];
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Skills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className={`${getSkillColor(skill)} flex items-center gap-1 px-3 py-1`}
          >
            <Tag className="h-3 w-3" />
            <span>{skill}</span>
            <button
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Input Field */}
      {selectedSkills.length < maxSkills && (
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSuggestions(!showSuggestions);
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="mr-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {(isOpen || showSuggestions) && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
              <CardContent className="p-3">
                {/* Input-based suggestions */}
                {inputValue && filteredSuggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Matching Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {filteredSuggestions.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {showAISuggestions && aiSuggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-orange-500" />
                      AI Suggestions
                    </h4>
                    <div className="space-y-1">
                      {aiSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.skill}
                          onClick={() => addSkill(suggestion.skill)}
                          className="w-full text-left px-2 py-2 text-xs bg-orange-50 hover:bg-orange-100 rounded-md transition-colors flex items-center justify-between"
                        >
                          <span>{suggestion.skill}</span>
                          <div className="flex items-center text-orange-600">
                            <span className="text-xs mr-1">{suggestion.category}</span>
                            <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Skills */}
                {(!inputValue || filteredSuggestions.length === 0) && suggestedPopularSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Popular Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {suggestedPopularSkills.map((item) => (
                        <button
                          key={item.skill}
                          onClick={() => addSkill(item.skill)}
                          className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center"
                        >
                          <span>{item.skill}</span>
                          <span className="ml-1 text-blue-600">({item.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add custom skill */}
                {inputValue && !filteredSuggestions.includes(inputValue) && (
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => addSkill(inputValue)}
                      className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add "{inputValue}" as new skill
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Skills limit indicator */}
      <div className="mt-2 text-xs text-gray-500">
        {selectedSkills.length}/{maxSkills} skills
      </div>
    </div>
  );
}