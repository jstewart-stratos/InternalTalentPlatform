import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Employee } from '@shared/schema';

interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  x: number;
  y: number;
  connections: string[];
  employees: Employee[];
  color: string;
}

interface SkillTreeProps {
  employees: Employee[];
  onSkillSelect?: (skill: string) => void;
  selectedSkill?: string;
}

const SKILL_CATEGORIES = {
  'Frontend': { color: '#3B82F6', position: { x: 200, y: 100 } },
  'Backend': { color: '#10B981', position: { x: 400, y: 100 } },
  'Data': { color: '#8B5CF6', position: { x: 300, y: 250 } },
  'Design': { color: '#F59E0B', position: { x: 100, y: 250 } },
  'DevOps': { color: '#EF4444', position: { x: 500, y: 250 } },
  'Management': { color: '#6366F1', position: { x: 300, y: 400 } }
};

const SKILL_CONNECTIONS: Record<string, string[]> = {
  'React': ['TypeScript', 'Node.js', 'GraphQL'],
  'TypeScript': ['React', 'Node.js'],
  'Node.js': ['TypeScript', 'Express', 'MongoDB'],
  'Python': ['Machine Learning', 'Django', 'SQL'],
  'Machine Learning': ['Python', 'TensorFlow', 'R'],
  'Figma': ['Prototyping', 'Design Systems'],
  'AWS': ['Docker', 'Kubernetes'],
  'Docker': ['AWS', 'Kubernetes'],
  'Kubernetes': ['Docker', 'AWS']
};

export default function SkillTree({ employees, onSkillSelect, selectedSkill }: SkillTreeProps) {
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    generateSkillTree();
  }, [employees]);

  const generateSkillTree = () => {
    const skillMap = new Map<string, { employees: Employee[], category: string }>();
    
    employees.forEach(employee => {
      employee.skills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { employees: [], category: categorizeSkill(skill) });
        }
        skillMap.get(skill)!.employees.push(employee);
      });
    });

    const nodes: SkillNode[] = [];
    const categoryPositions = new Map<string, { x: number, y: number, count: number }>();
    
    // Initialize category positions
    Object.entries(SKILL_CATEGORIES).forEach(([category, config]) => {
      categoryPositions.set(category, { ...config.position, count: 0 });
    });

    skillMap.forEach((data, skillName) => {
      const category = data.category;
      const categoryPos = categoryPositions.get(category)!;
      const angle = (categoryPos.count * Math.PI * 2) / getSkillsInCategory(skillMap, category);
      const radius = 80 + (data.employees.length * 10);
      
      const node: SkillNode = {
        id: skillName,
        name: skillName,
        category,
        level: data.employees.length,
        x: categoryPos.x + Math.cos(angle) * radius,
        y: categoryPos.y + Math.sin(angle) * radius,
        connections: SKILL_CONNECTIONS[skillName] || [],
        employees: data.employees,
        color: SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]?.color || '#6B7280'
      };
      
      nodes.push(node);
      categoryPos.count++;
    });

    setSkillNodes(nodes);
  };

  const categorizeSkill = (skill: string): string => {
    const frontendSkills = ['React', 'TypeScript', 'JavaScript', 'Vue', 'Angular', 'CSS', 'HTML'];
    const backendSkills = ['Node.js', 'Python', 'Java', 'C#', 'Express', 'Django', 'Spring'];
    const dataSkills = ['SQL', 'Machine Learning', 'TensorFlow', 'R', 'Analytics', 'Tableau'];
    const designSkills = ['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Adobe Creative Suite'];
    const devopsSkills = ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'];
    const managementSkills = ['Scrum Master', 'Team Leadership', 'Process Optimization', 'Agile Coaching'];

    if (frontendSkills.includes(skill)) return 'Frontend';
    if (backendSkills.includes(skill)) return 'Backend';
    if (dataSkills.includes(skill)) return 'Data';
    if (designSkills.includes(skill)) return 'Design';
    if (devopsSkills.includes(skill)) return 'DevOps';
    if (managementSkills.includes(skill)) return 'Management';
    return 'Frontend';
  };

  const getSkillsInCategory = (skillMap: Map<string, any>, category: string): number => {
    return Array.from(skillMap.keys()).filter(skill => categorizeSkill(skill) === category).length;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getConnectedNodes = (nodeId: string): string[] => {
    const node = skillNodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    return node.connections.filter(connId => 
      skillNodes.some(n => n.id === connId)
    );
  };

  const renderConnection = (from: SkillNode, to: SkillNode) => {
    const isHighlighted = hoveredSkill === from.id || hoveredSkill === to.id || 
                         selectedSkill === from.id || selectedSkill === to.id;
    
    return (
      <motion.line
        key={`${from.id}-${to.id}`}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isHighlighted ? from.color : '#E5E7EB'}
        strokeWidth={isHighlighted ? 2 : 1}
        opacity={isHighlighted ? 0.8 : 0.3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
      />
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Interactive Skill Tree</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('out')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('in')}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative w-full h-96 bg-white rounded-lg border overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Render connections */}
            {skillNodes.map(node =>
              node.connections.map(connId => {
                const targetNode = skillNodes.find(n => n.id === connId);
                return targetNode ? renderConnection(node, targetNode) : null;
              })
            )}
            
            {/* Render skill nodes */}
            {skillNodes.map(node => {
              const isHovered = hoveredSkill === node.id;
              const isSelected = selectedSkill === node.id;
              const isConnected = hoveredSkill ? getConnectedNodes(hoveredSkill).includes(node.id) : false;
              
              return (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  onMouseEnter={() => setHoveredSkill(node.id)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  onClick={() => onSkillSelect?.(node.id)}
                  className="cursor-pointer"
                >
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(20, 15 + node.level * 2)}
                    fill={node.color}
                    opacity={isHovered || isSelected || isConnected ? 0.9 : 0.7}
                    stroke={isSelected ? '#1F2937' : 'white'}
                    strokeWidth={isSelected ? 3 : 2}
                    animate={{
                      r: isHovered ? Math.max(25, 20 + node.level * 2) : Math.max(20, 15 + node.level * 2)
                    }}
                  />
                  
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-medium fill-white pointer-events-none"
                    fontSize={Math.min(10, node.name.length > 8 ? 8 : 10)}
                  >
                    {node.name.length > 10 ? `${node.name.slice(0, 8)}...` : node.name}
                  </text>
                  
                  <text
                    x={node.x}
                    y={node.y + Math.max(25, 20 + node.level * 2) + 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 pointer-events-none"
                  >
                    {node.employees.length} expert{node.employees.length !== 1 ? 's' : ''}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
        
        {/* Skill details overlay */}
        <AnimatePresence>
          {hoveredSkill && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs"
            >
              {(() => {
                const node = skillNodes.find(n => n.id === hoveredSkill);
                if (!node) return null;
                
                return (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: node.color }}
                      />
                      <h4 className="font-semibold text-gray-900">{node.name}</h4>
                    </div>
                    <Badge variant="secondary" className="mb-2">
                      {node.category}
                    </Badge>
                    <p className="text-sm text-gray-600 mb-2">
                      {node.employees.length} employee{node.employees.length !== 1 ? 's' : ''} with this skill
                    </p>
                    {node.connections.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Related skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {node.connections.slice(0, 3).map(conn => (
                            <Badge key={conn} variant="outline" className="text-xs">
                              {conn}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(SKILL_CATEGORIES).map(([category, config]) => (
          <div key={category} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-sm text-gray-600">{category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}