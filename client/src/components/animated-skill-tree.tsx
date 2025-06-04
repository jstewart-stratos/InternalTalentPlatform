import { useState, useEffect, useRef } from "react";
import { ChevronRight, Users, Award, Network, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AnimatedSkillTreeProps {
  employees: Employee[];
  endorsements: SkillEndorsement[];
  onSkillSelect?: (skill: string) => void;
}

export default function AnimatedSkillTree({ employees, endorsements, onSkillSelect }: AnimatedSkillTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
      name: 'Skills Network',
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technology': '#3b82f6',
      'Design': '#8b5cf6',
      'Analytics': '#10b981',
      'Marketing': '#f59e0b',
      'Management': '#6366f1',
      'Finance': '#059669',
      'Other': '#6b7280'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getNodeColor = (category: string, level: number) => {
    const colors = {
      'Technology': level === 1 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800',
      'Design': level === 1 ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800',
      'Analytics': level === 1 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800',
      'Marketing': level === 1 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800',
      'Management': level === 1 ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-800',
      'Finance': level === 1 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800',
      'Other': level === 1 ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || (level === 1 ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800');
  };

  // Calculate node positions for SVG connections
  useEffect(() => {
    if (!containerRef.current) return;
    
    const positions = new Map();
    const elements = containerRef.current.querySelectorAll('[data-node-id]');
    
    elements.forEach((element) => {
      const nodeId = element.getAttribute('data-node-id');
      if (nodeId) {
        const rect = element.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        positions.set(nodeId, {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2
        });
      }
    });
    
    setNodePositions(positions);
  }, [expandedNodes]);

  const renderConnections = () => {
    if (nodePositions.size === 0) return null;

    const connections: JSX.Element[] = [];
    const traverseTree = (node: SkillNode, parentPos?: { x: number; y: number }) => {
      const nodePos = nodePositions.get(node.id);
      if (parentPos && nodePos && expandedNodes.has(node.id)) {
        const pathId = `path-${node.id}`;
        connections.push(
          <g key={pathId}>
            <path
              d={`M ${parentPos.x} ${parentPos.y} Q ${(parentPos.x + nodePos.x) / 2} ${parentPos.y + 20} ${nodePos.x} ${nodePos.y}`}
              stroke={getCategoryColor(node.category)}
              strokeWidth="2"
              fill="none"
              className="transition-all duration-500 ease-in-out"
              style={{
                strokeDasharray: hoveredNode === node.id ? '5,5' : 'none',
                strokeOpacity: hoveredNode === node.id ? 1 : 0.6
              }}
            />
            <circle
              cx={nodePos.x}
              cy={nodePos.y}
              r="4"
              fill={getCategoryColor(node.category)}
              className="transition-all duration-300 ease-in-out"
              style={{
                transform: hoveredNode === node.id ? 'scale(1.5)' : 'scale(1)',
                opacity: hoveredNode === node.id ? 1 : 0.8
              }}
            />
          </g>
        );
      }
      
      if (node.children && expandedNodes.has(node.id)) {
        node.children.forEach(child => traverseTree(child, nodePos));
      }
    };

    skillTree.children?.forEach(child => traverseTree(child, nodePositions.get('root')));
    return connections;
  };

  const renderSkillNode = (node: SkillNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedSkill === node.name;
    const isHovered = hoveredNode === node.id;

    return (
      <div key={node.id} className="relative">
        <div
          data-node-id={node.id}
          className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ease-in-out ${
            isSelected ? 'bg-accent/20 border-2 border-accent shadow-lg' : 
            isHovered ? 'bg-gray-50 shadow-lg scale-105' : 'hover:bg-gray-50 hover:shadow-md'
          } ${depth > 0 ? 'ml-8' : ''}`}
          style={{
            marginLeft: depth * 32,
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0px)',
            borderRadius: node.level === 0 ? '1rem' : node.level === 1 ? '0.75rem' : '0.5rem'
          }}
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
              className="transition-transform duration-300 ease-in-out p-1 rounded-full hover:bg-gray-200"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </div>
          )}
          
          {node.level === 0 && <Network className="h-5 w-5 text-accent" />}
          {node.level === 1 && <Zap className="h-4 w-4 text-white" />}
          
          <Badge 
            className={`${getNodeColor(node.category, node.level)} transition-all duration-300 ${
              isHovered ? 'scale-110 shadow-md' : ''
            } ${node.level === 0 ? 'text-lg px-4 py-2' : node.level === 1 ? 'px-3 py-1' : 'px-2 py-1'}`}
          >
            {node.name}
          </Badge>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <Users className="h-3 w-3 mr-1" />
              {node.employees.length}
            </span>
            {node.endorsements > 0 && (
              <span className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                <Award className="h-3 w-3 mr-1 text-yellow-600" />
                {node.endorsements}
              </span>
            )}
          </div>

          {node.level === 2 && (
            <div className="ml-auto">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs transition-all duration-200 hover:scale-110 hover:bg-accent hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkillClick(node.name);
                }}
              >
                Explore
              </Button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: isExpanded ? '2000px' : '0px',
              opacity: isExpanded ? 1 : 0
            }}
          >
            <div className="mt-4 space-y-2">
              {node.children!.map(child => renderSkillNode(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-2xl">
          <div className="p-2 bg-accent rounded-lg">
            <Network className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Interactive Skill Network
          </span>
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {employees.length} professionals
            </span>
            <span className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              {endorsements.length} endorsements
            </span>
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              {skillTree.children?.length || 0} skill categories
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div ref={containerRef} className="relative">
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {renderConnections()}
          </svg>
          
          <div className="relative space-y-3" style={{ zIndex: 2 }}>
            {renderSkillNode(skillTree)}
          </div>
        </div>

        {selectedSkill && (
          <div className="mt-8 p-6 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20 transition-all duration-500 ease-in-out">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-accent rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-accent">Selected Skill: {selectedSkill}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {employees.filter(emp => emp.skills?.includes(selectedSkill)).length} employees have this skill
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">
                  {endorsements.filter(end => end.skill === selectedSkill).length} total endorsements
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}