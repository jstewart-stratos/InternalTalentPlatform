import { employees, skillEndorsements, skillSearches, projects, projectApplications, users, siteSettings, adminAuditLog, userPermissions, departments, type Employee, type InsertEmployee, type SkillEndorsement, type InsertSkillEndorsement, type Project, type InsertProject, type ProjectApplication, type InsertProjectApplication, type User, type UpsertUser, type SiteSetting, type InsertSiteSetting, type AuditLog, type InsertAuditLog, type UserPermission, type InsertUserPermission, type Department, type InsertDepartment } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User authentication methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  getAllSkills(): Promise<string[]>;

  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByOwner(ownerId: number): Promise<Project[]>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  searchProjects(query: string, skills?: string[]): Promise<Project[]>;

  // Project application methods
  createProjectApplication(application: InsertProjectApplication): Promise<ProjectApplication>;
  getProjectApplications(projectId: number): Promise<ProjectApplication[]>;
  getUserApplications(applicantId: number): Promise<ProjectApplication[]>;
  updateApplicationStatus(id: number, status: 'accepted' | 'rejected'): Promise<ProjectApplication | undefined>;

  // Admin management methods
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  deactivateUser(userId: string): Promise<boolean>;
  activateUser(userId: string): Promise<boolean>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Site settings methods
  getSiteSettings(category?: string): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(key: string, value: string, updatedBy: string): Promise<SiteSetting>;
  createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;
  deleteSiteSetting(key: string): Promise<boolean>;

  // Audit logging methods
  logAdminAction(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;

  // User permissions methods
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  grantUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  revokeUserPermission(userId: string, permission: string): Promise<boolean>;
  hasPermission(userId: string, permission: string): Promise<boolean>;

  // Department management methods
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  deactivateDepartment(id: number): Promise<boolean>;
  activateDepartment(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User authentication methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

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
    
    // Create skill frequency map from all employee skills
    const skillMap = new Map<string, number>();
    employees.forEach(emp => {
      emp.skills.forEach(skill => {
        const normalizedSkill = skill.trim();
        skillMap.set(normalizedSkill, (skillMap.get(normalizedSkill) || 0) + 1);
      });
    });

    // Get recent search data (last 30 days) if available
    let searchData: Array<{ skill: string; searchCount: number }> = [];
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      searchData = await db
        .select({
          skill: skillSearches.skill,
          searchCount: sql<number>`count(*)`.as('searchCount')
        })
        .from(skillSearches)
        .where(sql`${skillSearches.searchedAt} >= ${thirtyDaysAgo.toISOString()}`)
        .groupBy(skillSearches.skill)
        .orderBy(sql`count(*) desc`)
        .limit(10);
    } catch (error) {
      // If search tracking fails, continue with skill popularity data
    }

    // Combine search data with skill popularity
    const searchMap = new Map(searchData.map(item => [item.skill.toLowerCase(), item.searchCount]));
    
    // Create trending skills based on employee count and search frequency
    const trendingSkills = Array.from(skillMap.entries())
      .map(([skill, employeeCount]) => {
        const searchCount = searchMap.get(skill.toLowerCase()) || 0;
        const trending = employeeCount >= 2 || searchCount >= 2; // Trending if 2+ employees or 2+ searches
        
        return {
          skill,
          searchCount,
          employeeCount,
          trending
        };
      })
      .sort((a, b) => {
        // Sort by search count first, then by employee count
        if (b.searchCount !== a.searchCount) {
          return b.searchCount - a.searchCount;
        }
        return b.employeeCount - a.employeeCount;
      })
      .slice(0, 12);

    return trendingSkills;
  }

  async getAllSkills(): Promise<string[]> {
    const employees = await this.getAllEmployees();
    const allSkills = new Set<string>();
    
    employees.forEach(employee => {
      employee.skills.forEach(skill => {
        allSkills.add(skill.trim());
      });
    });
    
    return Array.from(allSkills).sort();
  }

  // Project methods
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByOwner(ownerId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.ownerId, ownerId));
  }

  async updateProject(id: number, insertProject: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(insertProject)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    return result.length > 0;
  }

  async searchProjects(query: string, skills?: string[]): Promise<Project[]> {
    const conditions = [];
    
    if (query.trim()) {
      conditions.push(
        or(
          ilike(projects.title, `%${query}%`),
          ilike(projects.description, `%${query}%`)
        )
      );
    }

    if (skills && skills.length > 0) {
      // Search for projects that need any of the specified skills
      conditions.push(
        or(
          ...skills.map(skill => 
            sql`${projects.requiredSkills} @> ARRAY[${skill}]`
          )
        )
      );
    }

    if (conditions.length === 0) {
      return await this.getAllProjects();
    }

    return await db
      .select()
      .from(projects)
      .where(and(...conditions));
  }

  // Project application methods
  async createProjectApplication(insertApplication: InsertProjectApplication): Promise<ProjectApplication> {
    const [application] = await db
      .insert(projectApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getProjectApplications(projectId: number): Promise<ProjectApplication[]> {
    return await db
      .select()
      .from(projectApplications)
      .where(eq(projectApplications.projectId, projectId));
  }

  async getUserApplications(applicantId: number): Promise<ProjectApplication[]> {
    return await db
      .select()
      .from(projectApplications)
      .where(eq(projectApplications.applicantId, applicantId));
  }

  async updateApplicationStatus(id: number, status: 'accepted' | 'rejected'): Promise<ProjectApplication | undefined> {
    const [application] = await db
      .update(projectApplications)
      .set({ status })
      .where(eq(projectApplications.id, id))
      .returning();
    return application || undefined;
  }

  // Admin management methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    return result.length > 0;
  }

  async activateUser(userId: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    return result.length > 0;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Site settings methods
  async getSiteSettings(category?: string): Promise<SiteSetting[]> {
    if (category) {
      return await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.category, category));
    }
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async updateSiteSetting(key: string, value: string, updatedBy: string): Promise<SiteSetting> {
    const [setting] = await db
      .update(siteSettings)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(siteSettings.key, key))
      .returning();
    
    if (!setting) {
      // Create new setting if it doesn't exist
      const [newSetting] = await db
        .insert(siteSettings)
        .values({ key, value, updatedBy })
        .returning();
      return newSetting;
    }
    
    return setting;
  }

  async createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const [newSetting] = await db
      .insert(siteSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async deleteSiteSetting(key: string): Promise<boolean> {
    const result = await db
      .delete(siteSettings)
      .where(eq(siteSettings.key, key))
      .returning({ id: siteSettings.id });
    return result.length > 0;
  }

  // Audit logging methods
  async logAdminAction(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(adminAuditLog)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(adminAuditLog)
      .orderBy(sql`${adminAuditLog.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.userId, userId))
      .orderBy(sql`${adminAuditLog.createdAt} DESC`);
  }

  // User permissions methods
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
  }

  async grantUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [newPermission] = await db
      .insert(userPermissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async revokeUserPermission(userId: string, permission: string): Promise<boolean> {
    const result = await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      )
      .returning({ id: userPermissions.id });
    return result.length > 0;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      );
    return !!result;
  }

  // Department management methods
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async updateDepartment(id: number, insertDepartment: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db
      .update(departments)
      .set({ ...insertDepartment, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return result.length > 0;
  }

  async deactivateDepartment(id: number): Promise<boolean> {
    const result = await db
      .update(departments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return result.length > 0;
  }

  async activateDepartment(id: number): Promise<boolean> {
    const result = await db
      .update(departments)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
