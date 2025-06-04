import { useState } from "react";
import { ChevronRight, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Employee, SkillEndorsement } from "@shared/schema";

interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  employees: Employee[];
  endorsements: number;
  children?: SkillNode[];
  x?: number;
  y?: number;
}

interface SkillTreeProps {
  employees: Employee[];
  endorsements: SkillEndorsement[];
  onSkillSelect?: (skill: string) => void;
}

export default function SkillTree({ employees, endorsements, onSkillSelect }: SkillTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build skill tree structure from employee data
  const buildSkillTree = (): SkillNode => {
    const skillMap = new Map<string, {
      employees: Employee[];
      endorsements: number;
      category: string;
    }>();

    // Aggregate skills from all employees
    employees.forEach(employee => {
      employee.skills?.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, {
            employees: [],
            endorsements: 0,
            category: getCategoryForSkill(skill)
          });
        }
        skillMap.get(skill)!.employees.push(employee);
      });
    });

    // Add endorsement counts
    endorsements.forEach(endorsement => {
      const skillData = skillMap.get(endorsement.skill);
      if (skillData) {
        skillData.endorsements++;
      }
    });

    // Group skills by category
    const categories = new Map<string, SkillNode[]>();
    
    skillMap.forEach((data, skillName) => {
      const category = data.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category)!.push({
        id: skillName,
        name: skillName,
        category,
        level: 2,
        employees: data.employees,
        endorsements: data.endorsements
      });
    });

    // Create category nodes
    const categoryNodes: SkillNode[] = [];
    categories.forEach((skills, categoryName) => {
      // Sort skills by endorsement count
      skills.sort((a, b) => b.endorsements - a.endorsements);
      
      categoryNodes.push({
        id: categoryName,
        name: categoryName,
        category: categoryName,
        level: 1,
        employees: skills.flatMap(s => s.employees),
        endorsements: skills.reduce((sum, s) => sum + s.endorsements, 0),
        children: skills
      });
    });

    // Sort categories by total endorsements
    categoryNodes.sort((a, b) => b.endorsements - a.endorsements);

    return {
      id: 'root',
      name: 'Skills Overview',
      category: 'root',
      level: 0,
      employees,
      endorsements: endorsements.length,
      children: categoryNodes
    };
  };

  const getCategoryForSkill = (skill: string): string => {
    const techSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Kubernetes', 'Docker', 'JavaScript', 'Vue.js'];
    const designSkills = ['Figma', 'Prototyping', 'User Research', 'UI/UX Design', 'Adobe Creative Suite'];
    const analyticsSkills = ['Analytics', 'Data Analysis', 'Machine Learning', 'Business Intelligence', 'Statistical Analysis'];
    const marketingSkills = ['Go-to-Market', 'Content Strategy', 'Digital Marketing', 'Brand Management', 'SEO'];
    const managementSkills = ['Team Leadership', 'Scrum Master', 'Process Optimization', 'Project Management', 'Agile'];
    const financeSkills = ['Financial Planning', 'Investment Analysis', 'Risk Management', 'Tax Planning', 'Estate Planning'];

    if (techSkills.includes(skill)) return 'Technology';
    if (designSkills.includes(skill)) return 'Design';
    if (analyticsSkills.includes(skill)) return 'Analytics';
    if (marketingSkills.includes(skill)) return 'Marketing';
    if (managementSkills.includes(skill)) return 'Management';
    if (financeSkills.includes(skill)) return 'Finance';
    return 'Other';
  };

  const skillTree = buildSkillTree();

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
    onSkillSelect?.(skill);
  };

  const getNodeColor = (category: string, level: number) => {
    const colors = {
      'Technology': level === 1 ? 'bg-blue-500' : 'bg-blue-100 text-blue-800',
      'Design': level === 1 ? 'bg-purple-500' : 'bg-purple-100 text-purple-800',
      'Analytics': level === 1 ? 'bg-green-500' : 'bg-green-100 text-green-800',
      'Marketing': level === 1 ? 'bg-orange-500' : 'bg-orange-100 text-orange-800',
      'Management': level === 1 ? 'bg-indigo-500' : 'bg-indigo-100 text-indigo-800',
      'Finance': level === 1 ? 'bg-emerald-500' : 'bg-emerald-100 text-emerald-800',
      'Other': level === 1 ? 'bg-gray-500' : 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || (level === 1 ? 'bg-gray-500' : 'bg-gray-100 text-gray-800');
  };

  const renderSkillNode = (node: SkillNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedSkill === node.name;
    const isHovered = hoveredNode === node.id;

    return (
      <div
        key={node.id}
        className={`ml-${depth * 4} transition-all duration-300 ease-in-out`}
        style={{
          opacity: 1,
          transform: 'translateX(0px)'
        }}
      >
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected ? 'bg-accent/20 border-2 border-accent' : 
            isHovered ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else if (node.level === 2) {
              handleSkillClick(node.name);
            }
          }}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {hasChildren && (
            <div
              className="transition-transform duration-200 ease-in-out"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </div>
          )}
          
          <Badge 
            className={`${getNodeColor(node.category, node.level)} ${
              node.level === 1 ? 'text-white' : ''
            } transition-all duration-200 ${isHovered ? 'scale-105' : ''}`}
          >
            {node.name}
          </Badge>

          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {node.employees.length}
            </span>
            {node.endorsements > 0 && (
              <span className="flex items-center">
                <Award className="h-3 w-3 mr-1" />
                {node.endorsements}
              </span>
            )}
          </div>

          {node.level === 2 && (
            <div className="ml-auto transition-transform duration-150 hover:scale-110">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkillClick(node.name);
                }}
              >
                View
              </Button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              opacity: isExpanded ? 1 : 0,
              maxHeight: isExpanded ? '1000px' : '0px'
            }}
          >
            <div className="ml-6 border-l-2 border-gray-200 pl-4 mt-2">
              {node.children!.map(child => renderSkillNode(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Interactive Skill Tree</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{employees.length} employees</span>
            <span>•</span>
            <span>{endorsements.length} endorsements</span>
          </div>
        </div>

        <div className="space-y-2">
          {renderSkillNode(skillTree)}
        </div>

        {selectedSkill && (
          <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20 transition-all duration-300 ease-in-out">
            <h4 className="font-semibold text-accent mb-2">Selected Skill: {selectedSkill}</h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                {employees.filter(emp => emp.skills?.includes(selectedSkill)).length} employees have this skill
              </span>
              <span>
                {endorsements.filter(end => end.skill === selectedSkill).length} total endorsements
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}