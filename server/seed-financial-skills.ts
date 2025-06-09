import { db } from "./db";
import { employees, employeeSkills } from "@shared/schema";
import { eq } from "drizzle-orm";

// Financial Services & Insurance focused skill seeding
export async function seedFinancialServicesSkills() {
  console.log("Seeding financial services and insurance skills for all employees...");
  
  // Get all employees
  const allEmployees = await db.select().from(employees);
  
  // Financial services skill pools by role/department
  const financialSkillPools = {
    // Core Financial Skills - High priority for all financial roles
    core: [
      "Risk Assessment", "Financial Analysis", "Compliance", "Regulatory Reporting",
      "Financial Modeling", "Excel Advanced", "Data Analysis", "Client Relations"
    ],
    
    // Investment & Portfolio Management
    investment: [
      "Investment Management", "Portfolio Management", "Asset Management", 
      "Wealth Management", "Market Research", "Quantitative Analysis",
      "Risk Modeling", "Due Diligence"
    ],
    
    // Banking & Credit
    banking: [
      "Credit Analysis", "Corporate Finance", "Private Banking", 
      "Digital Banking", "Mobile Banking", "Payment Processing",
      "AML Compliance", "KYC Procedures"
    ],
    
    // Insurance Specific
    insurance: [
      "Insurance Underwriting", "Claims Processing", "Actuarial Analysis",
      "Life Insurance", "Property & Casualty", "Health Insurance",
      "Reinsurance", "Policy Administration", "Claims Investigation"
    ],
    
    // Technology & Analytics
    technology: [
      "FinTech Solutions", "Trading Systems", "Blockchain", "SQL",
      "Python", "R Programming", "SAS", "Tableau", "Power BI",
      "Algorithmic Trading", "Robo-Advisory"
    ],
    
    // Regulatory & Compliance
    regulatory: [
      "Sarbanes-Oxley", "Basel III", "GDPR Compliance", "Financial Auditing",
      "Internal Controls", "AML Compliance", "KYC Procedures"
    ],
    
    // Leadership & Business
    leadership: [
      "Project Management", "Team Leadership", "Strategic Planning",
      "Change Management", "Business Analysis", "Sales Management",
      "Business Development", "Performance Management"
    ]
  };

  // Skill progression mapping
  const skillProgression = {
    "Risk Assessment": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Financial Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 10 },
    "Credit Analysis": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Investment Management": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Portfolio Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Asset Management": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Wealth Management": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Private Banking": { beginner: 1, intermediate: 4, advanced: 7, expert: 12 },
    "Corporate Finance": { beginner: 1, intermediate: 3, advanced: 6, expert: 10 },
    "Financial Planning": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Insurance Underwriting": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Claims Processing": { beginner: 1, intermediate: 2, advanced: 3, expert: 6 },
    "Actuarial Analysis": { beginner: 2, intermediate: 4, advanced: 6, expert: 10 },
    "Life Insurance": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Property & Casualty": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Health Insurance": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Compliance": { beginner: 1, intermediate: 2, advanced: 4, expert: 8 },
    "Regulatory Reporting": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "AML Compliance": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "KYC Procedures": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Financial Modeling": { beginner: 1, intermediate: 3, advanced: 5, expert: 8 },
    "Excel Advanced": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "SQL": { beginner: 1, intermediate: 2, advanced: 4, expert: 6 },
    "Python": { beginner: 1, intermediate: 3, advanced: 5, expert: 7 },
    "Tableau": { beginner: 1, intermediate: 2, advanced: 3, expert: 5 },
    "Client Relations": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Project Management": { beginner: 1, intermediate: 2, advanced: 4, expert: 7 },
    "Team Leadership": { beginner: 2, intermediate: 3, advanced: 5, expert: 8 },
  };

  function getSkillsForEmployee(employee: any): string[] {
    const skills = new Set<string>();
    
    // Add core financial skills for everyone
    const coreSkillCount = Math.floor(Math.random() * 4) + 3; // 3-6 core skills
    const shuffledCore = [...financialSkillPools.core].sort(() => 0.5 - Math.random());
    shuffledCore.slice(0, coreSkillCount).forEach(skill => skills.add(skill));
    
    // Add role-specific skills based on title/role
    const title = employee.title?.toLowerCase() || '';
    
    if (title.includes('insurance') || title.includes('underwriting') || title.includes('claims')) {
      const insuranceCount = Math.floor(Math.random() * 4) + 2; // 2-5 insurance skills
      const shuffledInsurance = [...financialSkillPools.insurance].sort(() => 0.5 - Math.random());
      shuffledInsurance.slice(0, insuranceCount).forEach(skill => skills.add(skill));
    }
    
    if (title.includes('investment') || title.includes('portfolio') || title.includes('wealth')) {
      const investmentCount = Math.floor(Math.random() * 4) + 2; // 2-5 investment skills
      const shuffledInvestment = [...financialSkillPools.investment].sort(() => 0.5 - Math.random());
      shuffledInvestment.slice(0, investmentCount).forEach(skill => skills.add(skill));
    }
    
    if (title.includes('credit') || title.includes('lending') || title.includes('bank')) {
      const bankingCount = Math.floor(Math.random() * 3) + 2; // 2-4 banking skills
      const shuffledBanking = [...financialSkillPools.banking].sort(() => 0.5 - Math.random());
      shuffledBanking.slice(0, bankingCount).forEach(skill => skills.add(skill));
    }
    
    if (title.includes('technology') || title.includes('analyst') || title.includes('data')) {
      const techCount = Math.floor(Math.random() * 3) + 2; // 2-4 tech skills
      const shuffledTech = [...financialSkillPools.technology].sort(() => 0.5 - Math.random());
      shuffledTech.slice(0, techCount).forEach(skill => skills.add(skill));
    }
    
    if (title.includes('compliance') || title.includes('risk') || title.includes('audit')) {
      const regCount = Math.floor(Math.random() * 3) + 2; // 2-4 regulatory skills
      const shuffledReg = [...financialSkillPools.regulatory].sort(() => 0.5 - Math.random());
      shuffledReg.slice(0, regCount).forEach(skill => skills.add(skill));
    }
    
    if (title.includes('manager') || title.includes('director') || title.includes('lead')) {
      const leadershipCount = Math.floor(Math.random() * 3) + 2; // 2-4 leadership skills
      const shuffledLeadership = [...financialSkillPools.leadership].sort(() => 0.5 - Math.random());
      shuffledLeadership.slice(0, leadershipCount).forEach(skill => skills.add(skill));
    }
    
    // Ensure minimum skill count
    const allSkills = Object.values(financialSkillPools).flat();
    while (skills.size < 5) {
      const randomSkill = allSkills[Math.floor(Math.random() * allSkills.length)];
      skills.add(randomSkill);
    }
    
    // Cap at reasonable maximum
    const skillArray = Array.from(skills);
    return skillArray.slice(0, Math.min(15, skillArray.length));
  }

  function getExperienceLevel(skillName: string, employeeYears: number): { level: string, years: number } {
    const progression = skillProgression[skillName as keyof typeof skillProgression];
    const defaultProgression = { beginner: 1, intermediate: 2, advanced: 4, expert: 6 };
    const skillProg = progression || defaultProgression;
    
    // Calculate skill-specific experience (30-80% of total experience)
    const skillExperience = Math.max(1, Math.floor(employeeYears * (0.3 + Math.random() * 0.5)));
    
    if (skillExperience >= skillProg.expert) return { level: "expert", years: skillExperience };
    if (skillExperience >= skillProg.advanced) return { level: "advanced", years: skillExperience };
    if (skillExperience >= skillProg.intermediate) return { level: "intermediate", years: skillExperience };
    return { level: "beginner", years: Math.max(1, skillExperience) };
  }

  function getLastUsedDate(): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 365); // Within last year
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  let totalSkillsAdded = 0;

  for (const employee of allEmployees) {
    const skillsToAdd = getSkillsForEmployee(employee);
    
    for (const skillName of skillsToAdd) {
      // Check if skill already exists for this employee
      const existingSkills = await db
        .select()
        .from(employeeSkills)
        .where(eq(employeeSkills.employeeId, employee.id));
      
      const existingSkill = existingSkills.find(s => s.skillName === skillName);
        
      if (!existingSkill) {
        const { level, years } = getExperienceLevel(skillName, employee.yearsExperience);
        const isEndorsed = Math.random() > 0.6; // 40% chance of being endorsed
        const endorsementCount = isEndorsed ? Math.floor(Math.random() * 5) + 1 : 0;
        
        await db.insert(employeeSkills).values({
          employeeId: employee.id,
          skillName: skillName,
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
  
  console.log(`Successfully seeded ${totalSkillsAdded} financial services skills for ${allEmployees.length} employees`);
  return { skillsAdded: totalSkillsAdded, employeesUpdated: allEmployees.length };
}