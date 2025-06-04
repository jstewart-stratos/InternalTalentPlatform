import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@shared/schema";

interface QuickSearchProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onSkillSelect?: (skill: string) => void;
  placeholder?: string;
}

interface SearchResult {
  type: 'employee' | 'skill';
  employee?: Employee;
  skill?: string;
  score: number;
}

export default function QuickSearch({ onEmployeeSelect, onSkillSelect, placeholder = "Quick search..." }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  // Fuzzy matching function
  const fuzzyMatch = (text: string, query: string): number => {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(queryLower)) {
      return 1.0 - (textLower.indexOf(queryLower) / textLower.length);
    }
    
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score += 1;
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length ? score / textLower.length : 0;
  };

  // Search function using useMemo to prevent recreating on every render
  const searchResults = useMemo(() => {
    const searchEmployeesAndSkills = (searchQuery: string): SearchResult[] => {
      if (!searchQuery.trim()) return [];
      
      const results: SearchResult[] = [];
      const allSkills = new Set<string>();
      
      // Search employees
      employees.forEach(employee => {
        // Search in name
        const nameScore = fuzzyMatch(employee.name, searchQuery);
        if (nameScore > 0.3) {
          results.push({
            type: 'employee',
            employee,
            score: nameScore + 0.5 // Boost employee matches
          });
        }
        
        // Search in title
        const titleScore = fuzzyMatch(employee.title, searchQuery);
        if (titleScore > 0.3) {
          results.push({
            type: 'employee',
            employee,
            score: titleScore + 0.3
          });
        }
        
        // Collect all skills
        employee.skills.forEach(skill => allSkills.add(skill));
      });
      
      // Search skills
      Array.from(allSkills).forEach(skill => {
        const skillScore = fuzzyMatch(skill, searchQuery);
        if (skillScore > 0.3) {
          results.push({
            type: 'skill',
            skill,
            score: skillScore
          });
        }
      });
      
      // Remove duplicates and sort by score
      const uniqueResults = results.filter((result, index, self) => {
        if (result.type === 'employee') {
          return index === self.findIndex(r => r.type === 'employee' && r.employee?.id === result.employee?.id);
        } else {
          return index === self.findIndex(r => r.type === 'skill' && r.skill === result.skill);
        }
      });
      
      return uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Limit to 8 results
    };

    return searchEmployeesAndSkills(query);
  }, [query, employees]);

  useEffect(() => {
    setResults(searchResults);
    setSelectedIndex(-1);
    setIsOpen(query.trim().length > 0 && searchResults.length > 0);
  }, [searchResults, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        } else if (results.length > 0) {
          // If no item is selected but there are results, select the first one
          handleResultSelect(results[0]);
        } else if (query.trim() && onSkillSelect) {
          // If no results but there's a query, treat it as a skill search
          onSkillSelect(query.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    if (result.type === 'employee' && result.employee && onEmployeeSelect) {
      onEmployeeSelect(result.employee);
    } else if (result.type === 'skill' && result.skill && onSkillSelect) {
      onSkillSelect(result.skill);
    }
    
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (resultsRef.current && !resultsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-4"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <Card 
          ref={resultsRef}
          className="absolute top-full mt-1 w-full z-50 shadow-lg border-border"
        >
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.type === 'employee' ? result.employee?.id : result.skill}`}
                  className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent/10 border-accent' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleResultSelect(result)}
                >
                  {result.type === 'employee' && result.employee ? (
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={result.employee.profileImage || ""} />
                        <AvatarFallback className="text-xs">
                          {result.employee.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.employee.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {result.employee.title} • {result.employee.department}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Hash className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {result.skill}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Skill
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Search for employees with this skill
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}