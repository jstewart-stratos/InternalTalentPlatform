import { db } from "./db";
import { employees, employeeSkills } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed data for individual skill experience levels
export async function seedEmployeeSkills() {
  console.log("Seeding employee skills with experience levels...");
  
  // Get all employees to populate their individual skills
  const allEmployees = await db.select().from(employees);
  
  // Financial Services & Insurance skill categories with typical progression paths
  const skillProgression = {
    // Core Financial Services Skills
    "Risk Assessment": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Financial Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 10 },
    "Credit Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Investment Management": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Portfolio Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Asset Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Wealth Management": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Private Banking": { beginner: 1, intermediate: 4, advanced: 7, expert: 12 },
    "Corporate Finance": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Mergers & Acquisitions": { beginner: 2, intermediate: 4, advanced: 7, expert: 12 },
    "Financial Planning": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Tax Planning": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    
    // Insurance Specific Skills  
    "Insurance Underwriting": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Claims Processing": { beginner: 1, intermediate: 2, advanced: 3, expert: 6 },
    "Actuarial Analysis": { beginner: 2, intermediate: 4, advanced: 6, expert: 10 },
    "Life Insurance": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Property & Casualty": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Health Insurance": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Reinsurance": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    "Insurance Sales": { beginner: 1, intermediate: 2, advanced: 3, expert: 6 },
    "Policy Administration": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Claims Investigation": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    
    // Regulatory & Compliance
    "Compliance": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Regulatory Reporting": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "AML Compliance": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "KYC Procedures": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Sarbanes-Oxley": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Basel III": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    "GDPR Compliance": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Financial Auditing": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Internal Controls": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    
    // Financial Technology
    "FinTech Solutions": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Trading Systems": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Payment Processing": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Blockchain": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Digital Banking": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Mobile Banking": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Robo-Advisory": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Algorithmic Trading": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    
    // Data & Analytics
    "Financial Modeling": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Quantitative Analysis": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    "Risk Modeling": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Excel Advanced": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "SQL": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Python": { beginner: 1, intermediate: 3, advanced: 5, expert: 7 },
    "R Programming": { beginner: 1, intermediate: 3, advanced: 5, expert: 7 },
    "SAS": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Tableau": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Power BI": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    
    // Client & Business Skills
    "Client Relations": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Relationship Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Sales Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Business Development": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Product Development": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Market Research": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Due Diligence": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Vendor Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    
    // Leadership & Management
    "Project Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Team Leadership": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
    "Strategic Planning": { beginner: 2, intermediate: 4, advanced: 6, expert: 10 },
    "Change Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Business Analysis": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Process Improvement": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Performance Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
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