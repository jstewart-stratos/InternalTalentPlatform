import { db } from "./db";
import { employees, employeeSkills } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed data for individual skill experience levels
export async function seedEmployeeSkills() {
  console.log("Seeding employee skills with experience levels...");
  
  // Get all employees to populate their individual skills
  const allEmployees = await db.select().from(employees);
  
  // Skill categories with typical progression paths
  const skillProgression = {
    // Technical skills - often have clear progression
    "JavaScript": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Python": { beginner: 1, intermediate: 3, advanced: 5, expert: 7 },
    "React": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Node.js": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "SQL": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Java": { beginner: 1, intermediate: 3, advanced: 5, expert: 10 },
    "C#": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "API Development": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Database Design": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Cloud Computing": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Docker": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Kubernetes": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    
    // Financial & domain skills
    "Risk Assessment": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Financial Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 10 },
    "Compliance": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Regulatory Reporting": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Credit Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Investment Management": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Insurance Underwriting": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Claims Processing": { beginner: 1, intermediate: 2, advanced: 3, expert: 6 },
    "Actuarial Analysis": { beginner: 2, intermediate: 4, advanced: 6, expert: 10 },
    "Portfolio Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    
    // Soft skills - progression based on experience and leadership
    "Project Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Team Leadership": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    "Strategic Planning": { beginner: 2, intermediate: 4, advanced: 6, expert: 10 },
    "Client Relations": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Business Analysis": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Data Analysis": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Presentation Skills": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Negotiation": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Change Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Vendor Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
  };

  // Function to determine experience level based on years
  function getExperienceLevel(skillName: string, employeeYears: number): { level: string, years: number } {
    const progression = skillProgression[skillName as keyof typeof skillProgression];
    if (!progression) {
      // Default progression for unknown skills
      if (employeeYears >= 6) return { level: "expert", years: Math.min(employeeYears, 8) };
      if (employeeYears >= 3) return { level: "advanced", years: Math.min(employeeYears, 5) };
      if (employeeYears >= 1) return { level: "intermediate", years: Math.min(employeeYears, 3) };
      return { level: "beginner", years: 1 };
    }

    // Determine level based on employee's total experience and skill-specific progression
    const skillExperience = Math.max(1, Math.floor(employeeYears * (0.3 + Math.random() * 0.7))); // 30-100% of total experience in this skill
    
    if (skillExperience >= progression.expert) return { level: "expert", years: skillExperience };
    if (skillExperience >= progression.advanced) return { level: "advanced", years: skillExperience };
    if (skillExperience >= progression.intermediate) return { level: "intermediate", years: skillExperience };
    return { level: "beginner", years: Math.max(1, skillExperience) };
  }

  // Function to get random last used date (within last 2 years for active skills)
  function getLastUsedDate(): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 730); // 0-2 years ago
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  let totalSkillsAdded = 0;

  for (const employee of allEmployees) {
    if (employee.skills && employee.skills.length > 0) {
      for (const skillName of employee.skills) {
        // Check if skill already exists for this employee
        const existingSkills = await db
          .select()
          .from(employeeSkills)
          .where(eq(employeeSkills.employeeId, employee.id));
        
        const existingSkill = existingSkills.find(s => s.skillName === skillName.trim());
          
        if (!existingSkill) {
          const { level, years } = getExperienceLevel(skillName.trim(), employee.yearsExperience);
          const isEndorsed = Math.random() > 0.7; // 30% chance of being endorsed
          const endorsementCount = isEndorsed ? Math.floor(Math.random() * 5) + 1 : 0;
          
          await db.insert(employeeSkills).values({
            employeeId: employee.id,
            skillName: skillName.trim(),
            experienceLevel: level,
            yearsOfExperience: years,
            lastUsed: getLastUsedDate(),
            isEndorsed,
            endorsementCount,
          });
          
          totalSkillsAdded++;
        }
      }
    }
  }
  
  console.log(`Successfully seeded ${totalSkillsAdded} individual skill records for ${allEmployees.length} employees`);
}

// Function to get a summary of skill levels across the organization
export async function getSkillLevelSummary() {
  const skillSummary = await db
    .select()
    .from(employeeSkills);
    
  const summary = {
    totalSkills: skillSummary.length,
    byLevel: {
      beginner: skillSummary.filter(s => s.experienceLevel === 'beginner').length,
      intermediate: skillSummary.filter(s => s.experienceLevel === 'intermediate').length,
      advanced: skillSummary.filter(s => s.experienceLevel === 'advanced').length,
      expert: skillSummary.filter(s => s.experienceLevel === 'expert').length,
    },
    endorsedSkills: skillSummary.filter(s => s.isEndorsed).length,
    topSkills: skillSummary.reduce((acc, skill) => {
      acc[skill.skillName] = (acc[skill.skillName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
  
  return summary;
}