import { Employee, Project } from "@shared/schema";

interface SkillMatch {
  employee: Employee;
  project: Project;
  matchingSkills: string[];
  totalRequiredSkills: number;
  compatibilityScore: number;
  recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
}

export function calculateSkillCompatibility(employee: Employee, project: Project): SkillMatch {
  const employeeSkills = employee.skills.map(s => s.toLowerCase());
  const requiredSkills = project.requiredSkills || [];
  const projectSkills = requiredSkills.map(s => s.toLowerCase());
  
  // Find matching skills
  const matchingSkills = requiredSkills.filter(skill => 
    employeeSkills.includes(skill.toLowerCase())
  );
  
  // Calculate compatibility score
  const matchRatio = projectSkills.length > 0 ? matchingSkills.length / projectSkills.length : 0;
  const experienceBonus = getExperienceBonus(employee.experienceLevel);
  const departmentBonus = getDepartmentRelevance(employee.department, project);
  
  let compatibilityScore = (matchRatio * 70) + (experienceBonus * 20) + (departmentBonus * 10);
  compatibilityScore = Math.min(100, Math.max(0, compatibilityScore));
  
  // Determine recommendation level
  let recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
  if (compatibilityScore >= 85) recommendationLevel = 'perfect';
  else if (compatibilityScore >= 70) recommendationLevel = 'good';
  else if (compatibilityScore >= 50) recommendationLevel = 'partial';
  else recommendationLevel = 'stretch';
  
  return {
    employee,
    project,
    matchingSkills,
    totalRequiredSkills: projectSkills.length,
    compatibilityScore: Math.round(compatibilityScore),
    recommendationLevel
  };
}

function getExperienceBonus(experienceLevel: string): number {
  switch (experienceLevel.toLowerCase()) {
    case 'lead':
    case 'senior': return 10;
    case 'mid': return 7;
    case 'junior': return 5;
    default: return 0;
  }
}

function getDepartmentRelevance(department: string, project: Project): number {
  const projectKeywords = (project.description + ' ' + project.title).toLowerCase();
  
  const departmentRelevance: Record<string, string[]> = {
    'engineering': ['development', 'api', 'frontend', 'backend', 'infrastructure', 'testing'],
    'design': ['design', 'user', 'interface', 'experience', 'prototype', 'wireframe'],
    'analytics': ['data', 'analytics', 'visualization', 'intelligence', 'metrics'],
    'marketing': ['marketing', 'campaign', 'content', 'social', 'brand'],
    'product': ['product', 'strategy', 'roadmap', 'feature', 'requirements']
  };
  
  const keywords = departmentRelevance[department.toLowerCase()] || [];
  const matches = keywords.filter(keyword => projectKeywords.includes(keyword));
  
  return matches.length > 0 ? 10 : 0;
}

export function getProjectRecommendationsForEmployee(
  employee: Employee, 
  projects: Project[]
): SkillMatch[] {
  const matches = projects.map(project => calculateSkillCompatibility(employee, project));
  
  // Filter out very low compatibility scores and sort by score
  return matches
    .filter(match => match.compatibilityScore >= 30)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 10); // Limit to top 10 recommendations
}

export function getEmployeeRecommendationsForProject(
  project: Project, 
  employees: Employee[]
): SkillMatch[] {
  const matches = employees.map(employee => calculateSkillCompatibility(employee, project));
  
  // Filter out very low compatibility scores and sort by score
  return matches
    .filter(match => match.compatibilityScore >= 30)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 15); // Limit to top 15 candidates
}