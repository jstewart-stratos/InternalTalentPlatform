import { employees, skillEndorsements, skillSearches, type Employee, type InsertEmployee, type SkillEndorsement, type InsertSkillEndorsement } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  searchEmployees(query: string, department?: string, experienceLevel?: string): Promise<Employee[]>;

  // Skill endorsement methods
  createSkillEndorsement(endorsement: InsertSkillEndorsement): Promise<SkillEndorsement>;
  getSkillEndorsements(employeeId: number): Promise<SkillEndorsement[]>;
  getSkillEndorsementsBySkill(employeeId: number, skill: string): Promise<SkillEndorsement[]>;
  removeSkillEndorsement(employeeId: number, endorserId: number, skill: string): Promise<boolean>;

  // Skill search tracking methods
  trackSkillSearch(skill: string): Promise<void>;
  getTrendingSkills(): Promise<Array<{ skill: string; searchCount: number; employeeCount: number; trending: boolean }>>;
}

export class DatabaseStorage implements IStorage {
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, insertEmployee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set(insertEmployee)
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });
    return result.length > 0;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async searchEmployees(query: string, department?: string, experienceLevel?: string): Promise<Employee[]> {
    const conditions = [];

    if (query) {
      const lowerQuery = `%${query.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(employees.name, lowerQuery),
          ilike(employees.title, lowerQuery),
          ilike(employees.bio, lowerQuery),
          sql`array_to_string(${employees.skills}, ' ') ILIKE ${lowerQuery}`
        )
      );
    }

    if (department && department !== "All Departments") {
      conditions.push(eq(employees.department, department));
    }

    if (experienceLevel && experienceLevel !== "Any Level") {
      switch (experienceLevel) {
        case "Entry Level (0-2 years)":
          conditions.push(sql`${employees.yearsExperience} <= 2`);
          break;
        case "Mid Level (3-5 years)":
          conditions.push(and(
            sql`${employees.yearsExperience} >= 3`,
            sql`${employees.yearsExperience} <= 5`
          ));
          break;
        case "Senior Level (6+ years)":
          conditions.push(sql`${employees.yearsExperience} >= 6`);
          break;
      }
    }

    if (conditions.length > 0) {
      return await db.select().from(employees).where(and(...conditions));
    }

    return await db.select().from(employees);
  }



  async createSkillEndorsement(insertEndorsement: InsertSkillEndorsement): Promise<SkillEndorsement> {
    const [endorsement] = await db
      .insert(skillEndorsements)
      .values({
        ...insertEndorsement,
        createdAt: new Date().toISOString()
      })
      .returning();
    return endorsement;
  }

  async getSkillEndorsements(employeeId: number): Promise<SkillEndorsement[]> {
    return await db
      .select()
      .from(skillEndorsements)
      .where(eq(skillEndorsements.employeeId, employeeId));
  }

  async getSkillEndorsementsBySkill(employeeId: number, skill: string): Promise<SkillEndorsement[]> {
    return await db
      .select()
      .from(skillEndorsements)
      .where(
        and(
          eq(skillEndorsements.employeeId, employeeId),
          eq(skillEndorsements.skill, skill)
        )
      );
  }

  async removeSkillEndorsement(employeeId: number, endorserId: number, skill: string): Promise<boolean> {
    const result = await db
      .delete(skillEndorsements)
      .where(
        and(
          eq(skillEndorsements.employeeId, employeeId),
          eq(skillEndorsements.endorserId, endorserId),
          eq(skillEndorsements.skill, skill)
        )
      )
      .returning({ id: skillEndorsements.id });
    return result.length > 0;
  }

  async trackSkillSearch(skill: string): Promise<void> {
    await db
      .insert(skillSearches)
      .values({
        skill: skill.toLowerCase().trim(),
        searchedAt: new Date().toISOString()
      });
  }

  async getTrendingSkills(): Promise<Array<{ skill: string; searchCount: number; employeeCount: number; trending: boolean }>> {
    const employees = await this.getAllEmployees();
    
    // Get search counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const searchData = await db
      .select({
        skill: skillSearches.skill,
        searchCount: sql<number>`count(*)`.as('searchCount')
      })
      .from(skillSearches)
      .where(sql`${skillSearches.searchedAt} >= ${thirtyDaysAgo.toISOString()}`)
      .groupBy(skillSearches.skill)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    // Calculate employee counts and trending status
    const skillStats = searchData.map(item => {
      const employeeCount = employees.filter(emp => 
        emp.skills.some(skill => skill.toLowerCase() === item.skill.toLowerCase())
      ).length;

      // Consider trending if searched more than 3 times in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const trending = item.searchCount >= 3;

      return {
        skill: item.skill,
        searchCount: item.searchCount,
        employeeCount,
        trending
      };
    });

    return skillStats;
  }
}

export const storage = new DatabaseStorage();
