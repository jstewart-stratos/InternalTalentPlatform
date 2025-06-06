import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    enabled: true
  });

  // Fuzzy matching function
  const fuzzyMatch = (text: string, query: string): number => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) {
      return 1.0; // Exact substring match gets highest score
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

  // Search results using useMemo
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchResults: SearchResult[] = [];
    const allSkills = new Set<string>();
    
    // Search employees
    employees.forEach(employee => {
      // Search in name
      const nameScore = fuzzyMatch(employee.name, query);
      if (nameScore > 0.3) {
        searchResults.push({
          type: 'employee',
          employee,
          score: nameScore + 0.5 // Boost employee matches
        });
      }
      
      // Search in title
      const titleScore = fuzzyMatch(employee.title, query);
      if (titleScore > 0.3) {
        searchResults.push({
          type: 'employee',
          employee,
          score: titleScore + 0.3
        });
      }
      
      // Collect all skills
      employee.skills.forEach(skill => allSkills.add(skill));
    });
    
    // Search skills
    [...allSkills].forEach(skill => {
      const skillScore = fuzzyMatch(skill, query);
      if (skillScore > 0.3) {
        searchResults.push({
          type: 'skill',
          skill,
          score: skillScore
        });
      }
    });
    
    // Remove duplicates and sort by score
    const uniqueResults = searchResults.filter((result, index, self) => {
      if (result.type === 'employee') {
        return index === self.findIndex(r => r.type === 'employee' && r.employee?.id === result.employee?.id);
      } else {
        return index === self.findIndex(r => r.type === 'skill' && r.skill === result.skill);
      }
    });
    
    return uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to 8 results
  }, [query, employees]);

  // Update dropdown visibility
  useEffect(() => {
    const shouldOpen = query.trim().length > 0 && results.length > 0;
    setIsOpen(shouldOpen);
    if (!shouldOpen) {
      setSelectedIndex(-1);
    }
  }, [query, results.length]);

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
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 bg-background/50 border-border/50 focus:bg-background"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.type === 'employee' ? result.employee?.id : result.skill}`}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 border-b border-border/50 last:border-b-0 ${
                  index === selectedIndex ? 'bg-accent/70' : ''
                }`}
                onClick={() => handleResultSelect(result)}
              >
                {result.type === 'employee' && result.employee ? (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {result.employee.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.employee.title}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent rounded-full">
                      <Hash className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {result.skill}
                        </Badge>
                        <span className="text-sm text-muted-foreground">skill</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}