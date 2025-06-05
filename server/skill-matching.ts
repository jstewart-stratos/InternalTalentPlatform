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
  const employeeSkills = employee.skills.map(s => s.toLowerCase().trim());
  const requiredSkills = project.requiredSkills || [];
  const projectSkills = requiredSkills.map(s => s.toLowerCase().trim());
  
  // Find exact matching skills
  const exactMatches = requiredSkills.filter(skill => 
    employeeSkills.includes(skill.toLowerCase().trim())
  );
  
  // Find related/transferable skills
  const relatedMatches = findRelatedSkills(employeeSkills, projectSkills);
  const allMatchingSkills = [...exactMatches, ...relatedMatches];
  
  // Calculate compatibility score with improved algorithm
  const exactMatchRatio = projectSkills.length > 0 ? exactMatches.length / projectSkills.length : 0;
  const relatedMatchBonus = relatedMatches.length * 0.1; // 10% bonus per related skill
  const experienceBonus = getExperienceBonus(employee.experienceLevel);
  const departmentBonus = getDepartmentRelevance(employee.department, project);
  
  // Weighted scoring: exact matches are most important
  let compatibilityScore = (exactMatchRatio * 60) + 
                           (relatedMatchBonus * 20) + 
                           (experienceBonus * 15) + 
                           (departmentBonus * 5);
  
  // Bonus for having more skills than required (versatility)
  if (exactMatches.length >= projectSkills.length && employee.skills.length > projectSkills.length) {
    compatibilityScore += 10;
  }
  
  compatibilityScore = Math.min(100, Math.max(0, compatibilityScore));
  
  // Determine recommendation level with adjusted thresholds
  let recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
  if (compatibilityScore >= 80 && exactMatches.length >= projectSkills.length * 0.8) {
    recommendationLevel = 'perfect';
  } else if (compatibilityScore >= 60 && exactMatches.length >= projectSkills.length * 0.6) {
    recommendationLevel = 'good';
  } else if (compatibilityScore >= 40 && exactMatches.length >= projectSkills.length * 0.4) {
    recommendationLevel = 'partial';
  } else {
    recommendationLevel = 'stretch';
  }
  
  return {
    employee,
    project,
    matchingSkills: allMatchingSkills,
    totalRequiredSkills: projectSkills.length,
    compatibilityScore: Math.round(compatibilityScore),
    recommendationLevel
  };
}

// Find related/transferable skills based on technology stacks and skill families
function findRelatedSkills(employeeSkills: string[], projectSkills: string[]): string[] {
  const skillRelationships: Record<string, string[]> = {
    'react': ['javascript', 'typescript', 'jsx', 'html', 'css', 'node.js', 'webpack'],
    'vue.js': ['javascript', 'typescript', 'html', 'css', 'node.js', 'webpack'],
    'angular': ['typescript', 'javascript', 'html', 'css', 'rxjs', 'node.js'],
    'javascript': ['typescript', 'node.js', 'react', 'vue.js', 'angular', 'express'],
    'typescript': ['javascript', 'node.js', 'react', 'angular', 'vue.js'],
    'node.js': ['javascript', 'typescript', 'express', 'mongodb', 'postgresql'],
    'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'machine learning'],
    'django': ['python', 'postgresql', 'html', 'css', 'javascript'],
    'flask': ['python', 'html', 'css', 'javascript', 'postgresql'],
    'postgresql': ['sql', 'database design', 'node.js', 'python', 'django'],
    'mongodb': ['nosql', 'node.js', 'javascript', 'express'],
    'aws': ['cloud computing', 'docker', 'kubernetes', 'devops'],
    'docker': ['kubernetes', 'aws', 'devops', 'linux'],
    'kubernetes': ['docker', 'aws', 'devops', 'microservices'],
    'machine learning': ['python', 'tensorflow', 'pytorch', 'data science'],
    'data science': ['python', 'r', 'machine learning', 'statistics', 'sql'],
    'css': ['html', 'javascript', 'sass', 'react', 'vue.js', 'angular'],
    'html': ['css', 'javascript', 'react', 'vue.js', 'angular'],
    'express': ['node.js', 'javascript', 'typescript', 'mongodb', 'postgresql'],
    'sql': ['postgresql', 'mysql', 'database design', 'data analysis'],
    'git': ['github', 'version control', 'collaboration', 'devops'],
    'linux': ['bash', 'shell scripting', 'docker', 'aws', 'devops'],
    'java': ['spring', 'hibernate', 'maven', 'gradle', 'postgresql'],
    'c#': ['.net', 'asp.net', 'entity framework', 'sql server'],
    'php': ['laravel', 'symfony', 'mysql', 'html', 'css', 'javascript'],
    'ruby': ['rails', 'postgresql', 'html', 'css', 'javascript'],
    'go': ['microservices', 'kubernetes', 'docker', 'cloud computing'],
    'rust': ['systems programming', 'performance optimization', 'webassembly'],
    'swift': ['ios development', 'xcode', 'objective-c', 'mobile development'],
    'kotlin': ['android development', 'java', 'mobile development'],
    'figma': ['ui/ux design', 'prototyping', 'design systems', 'adobe creative suite'],
    'sketch': ['ui/ux design', 'prototyping', 'figma', 'design systems'],
  };

  const relatedSkills: string[] = [];
  
  for (const empSkill of employeeSkills) {
    const relations = skillRelationships[empSkill];
    if (relations) {
      for (const projectSkill of projectSkills) {
        if (relations.includes(projectSkill) && !relatedSkills.includes(projectSkill)) {
          relatedSkills.push(projectSkill);
        }
      }
    }
  }
  
  return relatedSkills;
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