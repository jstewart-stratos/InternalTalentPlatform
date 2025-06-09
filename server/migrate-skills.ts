import { db } from "./db";
import { employees, employeeSkills } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Migration utility to populate employee_skills table with existing skills data
export async function migrateSkillsToIndividualRecords() {
  console.log("Starting skills migration...");
  
  const allEmployees = await db.select().from(employees);
  
  for (const employee of allEmployees) {
    if (employee.skills && employee.skills.length > 0) {
      for (const skillName of employee.skills) {
        // Check if skill already exists for this employee
        const [existingSkill] = await db
          .select()
          .from(employeeSkills)
          .where(eq(employeeSkills.employeeId, employee.id))
          .where(eq(employeeSkills.skillName, skillName));
          
        if (!existingSkill) {
          // Determine experience level based on employee's overall experience
          let experienceLevel = "beginner";
          if (employee.yearsExperience >= 6) {
            experienceLevel = "expert";
          } else if (employee.yearsExperience >= 3) {
            experienceLevel = "advanced";
          } else if (employee.yearsExperience >= 1) {
            experienceLevel = "intermediate";
          }
          
          await db.insert(employeeSkills).values({
            employeeId: employee.id,
            skillName: skillName.trim(),
            experienceLevel,
            yearsOfExperience: Math.max(1, Math.floor(employee.yearsExperience / 2)),
            lastUsed: new Date(),
          });
        }
      }
    }
  }
  
  console.log(`Migration completed for ${allEmployees.length} employees`);
}

// Function to get skills with experience levels for an employee
export async function getEmployeeSkillsWithLevels(employeeId: number) {
  return await db
    .select()
    .from(employeeSkills)
    .where(eq(employeeSkills.employeeId, employeeId))
    .orderBy(employeeSkills.skillName);
}