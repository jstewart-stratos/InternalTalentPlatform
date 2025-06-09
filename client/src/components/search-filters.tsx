import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SearchFiltersProps {
  onSearch: (query: string, experienceLevel: string) => void;
  isLoading?: boolean;
}

export default function SearchFilters({ onSearch, isLoading }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Any Level");

  const popularSkills = ["JavaScript", "Project Management", "Data Analysis", "UI/UX Design", "Digital Marketing"];

  const handleSearch = () => {
    onSearch(query, experienceLevel);
  };

  const handleSkillClick = (skill: string) => {
    setQuery(skill);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Skills</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g., React, Project Management, Data Analysis"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary h-4 w-4" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any Level">Any Level</SelectItem>
                <SelectItem value="Entry Level (0-2 years)">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="Mid Level (3-5 years)">Mid Level (3-5 years)</SelectItem>
                <SelectItem value="Senior Level (6+ years)">Senior Level (6+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-sm text-gray-600 mr-2">Popular Skills:</span>
          {popularSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => handleSkillClick(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Searching..." : "Search Talent"}
          </Button>
          <Button
            onClick={() => onSearch("", "Any Level")}
            disabled={isLoading}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            View All Employees
          </Button>
        </div>
      </div>
    </div>
  );
}
