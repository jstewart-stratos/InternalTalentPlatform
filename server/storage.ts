import { employees, skillEndorsements, skillSearches, projects, projectApplications, users, siteSettings, adminAuditLog, userPermissions, expertiseRequests, skillExpertise, employeeSkills, teams, teamMembers, teamServiceCategories, serviceCategories, professionalServices, serviceBookings, serviceReviews, servicePortfolios, savedSkillRecommendations, learningPathCache, learningStepCompletions, devLogoutState, type Employee, type InsertEmployee, type SkillEndorsement, type InsertSkillEndorsement, type Project, type InsertProject, type ProjectApplication, type InsertProjectApplication, type User, type UpsertUser, type SiteSetting, type InsertSiteSetting, type AuditLog, type InsertAuditLog, type UserPermission, type InsertUserPermission, type ExpertiseRequest, type InsertExpertiseRequest, type SkillExpertise, type InsertSkillExpertise, type EmployeeSkill, type InsertEmployeeSkill, type Team, type InsertTeam, type TeamMember, type InsertTeamMember, type TeamServiceCategory, type InsertTeamServiceCategory, type ServiceCategory, type InsertServiceCategory, type ProfessionalService, type InsertProfessionalService, type ServiceBooking, type InsertServiceBooking, type ServiceReview, type InsertServiceReview, type ServicePortfolio, type InsertServicePortfolio, type SavedSkillRecommendation, type InsertSavedSkillRecommendation, type LearningPathCache, type InsertLearningPathCache } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ilike, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User authentication methods (for custom auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;

  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  searchEmployees(query: string, experienceLevel?: string): Promise<Employee[]>;

  // Skill endorsement methods
  createSkillEndorsement(endorsement: InsertSkillEndorsement): Promise<SkillEndorsement>;
  getSkillEndorsements(employeeId: number): Promise<SkillEndorsement[]>;
  getSkillEndorsementsBySkill(employeeId: number, skill: string): Promise<SkillEndorsement[]>;
  removeSkillEndorsement(employeeId: number, endorserId: number, skill: string): Promise<boolean>;

  // Individual employee skills methods
  createEmployeeSkill(skill: InsertEmployeeSkill): Promise<EmployeeSkill>;
  getEmployeeSkills(employeeId: number): Promise<EmployeeSkill[]>;
  updateEmployeeSkill(id: number, skill: Partial<InsertEmployeeSkill>): Promise<EmployeeSkill | undefined>;
  deleteEmployeeSkill(id: number): Promise<boolean>;
  getEmployeeSkillByName(employeeId: number, skillName: string): Promise<EmployeeSkill | undefined>;

  // Skill search tracking methods
  trackSkillSearch(skill: string): Promise<void>;
  getTrendingSkills(): Promise<Array<{ skill: string; searchCount: number; employeeCount: number; trending: boolean }>>;
  getAllSkills(): Promise<string[]>;
  getAllEmployeeSkillsWithDetails(): Promise<Array<{
    id: number;
    employeeId: number;
    skillName: string;
    experienceLevel: string;
    yearsOfExperience: number;
    employee: { name: string; department: string };
  }>>;

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



  // Expert directory methods
  createExpertiseRequest(request: InsertExpertiseRequest): Promise<ExpertiseRequest>;
  getExpertiseRequestsForExpert(expertId: number): Promise<ExpertiseRequest[]>;
  getExpertiseRequestsForRequester(requesterId: number): Promise<ExpertiseRequest[]>;
  updateExpertiseRequestStatus(id: number, status: string): Promise<ExpertiseRequest | undefined>;
  createSkillExpertise(expertise: InsertSkillExpertise): Promise<SkillExpertise>;
  getSkillExpertiseByEmployee(employeeId: number): Promise<SkillExpertise[]>;
  updateSkillExpertise(id: number, expertise: Partial<InsertSkillExpertise>): Promise<SkillExpertise | undefined>;

  // Professional services marketplace methods
  // Service categories
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined>;
  deleteServiceCategory(id: number): Promise<boolean>;
  getServicesByCategory(categoryId: number): Promise<ProfessionalService[]>;
  
  // Audit logging methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Professional services
  createProfessionalService(service: InsertProfessionalService): Promise<ProfessionalService>;
  getProfessionalService(id: number): Promise<ProfessionalService | undefined>;
  getProfessionalServicesByProvider(providerId: number): Promise<ProfessionalService[]>;
  getAllProfessionalServices(): Promise<ProfessionalService[]>;
  searchProfessionalServices(query?: string, categoryId?: number, skills?: string[]): Promise<ProfessionalService[]>;
  updateProfessionalService(id: number, service: Partial<InsertProfessionalService>): Promise<ProfessionalService | undefined>;
  deleteProfessionalService(id: number): Promise<boolean>;
  
  // Service bookings
  createServiceBooking(booking: InsertServiceBooking): Promise<ServiceBooking>;

  // Team management methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByMember(employeeId: number): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  getAllTeamsWithMemberCount(): Promise<any[]>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team member management
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, employeeId: number): Promise<boolean>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMembersByEmployee(employeeId: number): Promise<TeamMember[]>;
  updateTeamMemberRole(teamId: number, employeeId: number, role: string): Promise<TeamMember | undefined>;
  approveTeamMember(teamId: number, employeeId: number, approvedBy: number): Promise<TeamMember | undefined>;
  
  // Team service categories
  createTeamServiceCategory(category: InsertTeamServiceCategory): Promise<TeamServiceCategory>;
  getTeamServiceCategories(teamId: number): Promise<TeamServiceCategory[]>;
  updateTeamServiceCategory(id: number, category: Partial<InsertTeamServiceCategory>): Promise<TeamServiceCategory | undefined>;
  deleteTeamServiceCategory(id: number): Promise<boolean>;
  
  // Team services
  getProfessionalServicesByTeam(teamId: number): Promise<ProfessionalService[]>;
  searchTeamServices(query?: string, teamId?: number, categoryId?: number): Promise<ProfessionalService[]>;

  // Saved skill recommendations methods
  saveSkillRecommendation(recommendation: InsertSavedSkillRecommendation): Promise<SavedSkillRecommendation>;
  getSavedSkillRecommendations(employeeId: number): Promise<SavedSkillRecommendation[]>;
  updateSavedSkillRecommendation(id: number, updates: Partial<InsertSavedSkillRecommendation>): Promise<SavedSkillRecommendation | undefined>;
  deleteSavedSkillRecommendation(id: number): Promise<boolean>;
  updateLearningProgress(id: number, progressPercentage: number): Promise<SavedSkillRecommendation | undefined>;
  markSkillRecommendationComplete(id: number): Promise<SavedSkillRecommendation | undefined>;

  // Learning path cache methods
  getCachedLearningPath(skill: string, context?: string, currentLevel?: string, targetLevel?: string): Promise<LearningPathCache | undefined>;
  cacheLearningPath(cacheData: InsertLearningPathCache): Promise<LearningPathCache>;
  updateLearningPathCacheUsage(id: number): Promise<void>;

  // Learning step completion methods
  completeLearningStep(stepData: {
    savedRecommendationId: number;
    stepIndex: number;
    stepTitle: string;
    notes?: string;
    resourcesCompleted?: string[];
  }): Promise<any>;
  getLearningStepCompletions(savedRecommendationId: number): Promise<any[]>;
  uncompleteLearningStep(savedRecommendationId: number, stepIndex: number): Promise<boolean>;
  getSavedSkillRecommendation(id: number): Promise<SavedSkillRecommendation | undefined>;
  updateSavedSkillRecommendationProgress(id: number, progressPercentage: number): Promise<any>;
  getServiceBooking(id: number): Promise<ServiceBooking | undefined>;
  getServiceBookingsByClient(clientId: number): Promise<ServiceBooking[]>;
  getServiceBookingsByProvider(providerId: number): Promise<ServiceBooking[]>;
  updateServiceBooking(id: number, booking: Partial<InsertServiceBooking>): Promise<ServiceBooking | undefined>;
  
  // Service reviews
  createServiceReview(review: InsertServiceReview): Promise<ServiceReview>;
  getServiceReviews(serviceId: number): Promise<ServiceReview[]>;
  getServiceReviewsByProvider(providerId: number): Promise<ServiceReview[]>;
  
  // Service portfolios
  createServicePortfolio(portfolio: InsertServicePortfolio): Promise<ServicePortfolio>;
  getServicePortfolios(serviceId: number): Promise<ServicePortfolio[]>;
  getServicePortfoliosByProvider(providerId: number): Promise<ServicePortfolio[]>;
  updateServicePortfolio(id: number, portfolio: Partial<InsertServicePortfolio>): Promise<ServicePortfolio | undefined>;
  deleteServicePortfolio(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User authentication methods (for custom auth)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  // Legacy upsert method for compatibility
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

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
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
      // Sanitize input to prevent SQL injection
      const sanitizedQuery = query.replace(/['"\\]/g, '').toLowerCase();
      const lowerQuery = `%${sanitizedQuery}%`;
      conditions.push(
        or(
          ilike(employees.name, lowerQuery),
          ilike(employees.title, lowerQuery),
          ilike(employees.bio, lowerQuery),
          sql`array_to_string(${employees.skills}, ' ') ILIKE ${lowerQuery}`
        )
      );
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

  // Individual employee skills methods
  async createEmployeeSkill(insertSkill: InsertEmployeeSkill): Promise<EmployeeSkill> {
    const [skill] = await db
      .insert(employeeSkills)
      .values(insertSkill)
      .returning();
    return skill;
  }

  async getEmployeeSkills(employeeId: number): Promise<EmployeeSkill[]> {
    return await db
      .select()
      .from(employeeSkills)
      .where(eq(employeeSkills.employeeId, employeeId))
      .orderBy(employeeSkills.skillName);
  }

  async updateEmployeeSkill(id: number, updateSkill: Partial<InsertEmployeeSkill>): Promise<EmployeeSkill | undefined> {
    const [skill] = await db
      .update(employeeSkills)
      .set({ ...updateSkill, updatedAt: new Date() })
      .where(eq(employeeSkills.id, id))
      .returning();
    return skill || undefined;
  }

  async deleteEmployeeSkill(id: number): Promise<boolean> {
    const result = await db
      .delete(employeeSkills)
      .where(eq(employeeSkills.id, id));
    return result.rowCount > 0;
  }

  async getEmployeeSkillByName(employeeId: number, skillName: string): Promise<EmployeeSkill | undefined> {
    const [skill] = await db
      .select()
      .from(employeeSkills)
      .where(and(
        eq(employeeSkills.employeeId, employeeId),
        eq(employeeSkills.skillName, skillName)
      ));
    return skill || undefined;
  }

  async getAllSkills(): Promise<string[]> {
    const skills = await db
      .selectDistinct({ skillName: employeeSkills.skillName })
      .from(employeeSkills);
    
    return skills.map(s => s.skillName).sort();
  }

  async getAllEmployeeSkillsWithDetails(): Promise<Array<{
    id: number;
    employeeId: number;
    skillName: string;
    experienceLevel: string;
    yearsOfExperience: number;
    employee: { name: string; department: string };
  }>> {
    const skills = await db
      .select({
        id: employeeSkills.id,
        employeeId: employeeSkills.employeeId,
        skillName: employeeSkills.skillName,
        experienceLevel: employeeSkills.experienceLevel,
        yearsOfExperience: employeeSkills.yearsOfExperience,
        employeeName: employees.name,
        employeeTitle: employees.title
      })
      .from(employeeSkills)
      .innerJoin(employees, eq(employeeSkills.employeeId, employees.id));

    return skills.map(skill => ({
      id: skill.id,
      employeeId: skill.employeeId,
      skillName: skill.skillName,
      experienceLevel: skill.experienceLevel,
      yearsOfExperience: skill.yearsOfExperience || 0,
      employee: {
        name: skill.employeeName,
        department: skill.employeeTitle // Using title as department
      }
    }));
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
      // Use parameterized queries to prevent SQL injection
      const skillConditions = skills.map(skill => {
        // Sanitize skill input and use proper SQL parameterization
        const sanitizedSkill = skill.replace(/['"\\]/g, '');
        return sql`${projects.requiredSkills} @> ARRAY[${sanitizedSkill}]::text[]`;
      });
      
      conditions.push(or(...skillConditions));
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




  // Learning step completion methods
  async completeLearningStep(stepData: {
    savedRecommendationId: number;
    stepIndex: number;
    stepTitle: string;
    notes?: string;
    resourcesCompleted?: string[];
  }) {
    try {
      const [completion] = await db
        .insert(learningStepCompletions)
        .values(stepData)
        .onConflictDoNothing()
        .returning();
      
      // If no completion was returned, fetch the existing one
      if (!completion) {
        const [existing] = await db
          .select()
          .from(learningStepCompletions)
          .where(
            and(
              eq(learningStepCompletions.savedRecommendationId, stepData.savedRecommendationId),
              eq(learningStepCompletions.stepIndex, stepData.stepIndex)
            )
          );
        return existing;
      }
      
      return completion;
    } catch (error) {
      console.error("Error in completeLearningStep:", error);
      throw error;
    }
  }

  async getLearningStepCompletions(savedRecommendationId: number) {
    return await db
      .select()
      .from(learningStepCompletions)
      .where(eq(learningStepCompletions.savedRecommendationId, savedRecommendationId))
      .orderBy(learningStepCompletions.stepIndex);
  }

  async uncompleteLearningStep(savedRecommendationId: number, stepIndex: number) {
    try {
      const result = await db
        .delete(learningStepCompletions)
        .where(
          and(
            eq(learningStepCompletions.savedRecommendationId, savedRecommendationId),
            eq(learningStepCompletions.stepIndex, stepIndex)
          )
        );
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error in uncompleteLearningStep:", error);
      throw error;
    }
  }

  async getSavedSkillRecommendation(id: number) {
    const [recommendation] = await db
      .select()
      .from(savedSkillRecommendations)
      .where(eq(savedSkillRecommendations.id, id));
    return recommendation || undefined;
  }

  async updateSavedSkillRecommendationProgress(id: number, progressPercentage: number) {
    const [updated] = await db
      .update(savedSkillRecommendations)
      .set({ 
        progressPercentage,
        status: progressPercentage >= 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'saved',
        lastAccessedAt: new Date(),
        completedAt: progressPercentage >= 100 ? new Date() : null
      })
      .where(eq(savedSkillRecommendations.id, id))
      .returning();
    return updated;
  }

  // Expert directory methods
  async createExpertiseRequest(insertRequest: InsertExpertiseRequest): Promise<ExpertiseRequest> {
    const [request] = await db
      .insert(expertiseRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getExpertiseRequestsForExpert(expertId: number): Promise<ExpertiseRequest[]> {
    return await db
      .select()
      .from(expertiseRequests)
      .where(eq(expertiseRequests.expertId, expertId))
      .orderBy(desc(expertiseRequests.createdAt));
  }

  async getExpertiseRequestsForRequester(requesterId: number): Promise<ExpertiseRequest[]> {
    return await db
      .select()
      .from(expertiseRequests)
      .where(eq(expertiseRequests.requesterId, requesterId))
      .orderBy(desc(expertiseRequests.createdAt));
  }

  async updateExpertiseRequestStatus(id: number, status: string): Promise<ExpertiseRequest | undefined> {
    const [request] = await db
      .update(expertiseRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(expertiseRequests.id, id))
      .returning();
    return request;
  }

  async createSkillExpertise(insertExpertise: InsertSkillExpertise): Promise<SkillExpertise> {
    const [expertise] = await db
      .insert(skillExpertise)
      .values(insertExpertise)
      .returning();
    return expertise;
  }

  async getSkillExpertiseByEmployee(employeeId: number): Promise<SkillExpertise[]> {
    return await db
      .select()
      .from(skillExpertise)
      .where(eq(skillExpertise.employeeId, employeeId))
      .orderBy(desc(skillExpertise.lastUpdated));
  }

  async updateSkillExpertise(id: number, insertExpertise: Partial<InsertSkillExpertise>): Promise<SkillExpertise | undefined> {
    const [expertise] = await db
      .update(skillExpertise)
      .set({ ...insertExpertise, lastUpdated: new Date() })
      .where(eq(skillExpertise.id, id))
      .returning();
    return expertise;
  }

  // Professional services marketplace methods
  // Service categories
  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return await db
      .select()
      .from(serviceCategories)
      .orderBy(serviceCategories.sortOrder, serviceCategories.name);
  }

  async createServiceCategory(insertCategory: InsertServiceCategory): Promise<ServiceCategory> {
    const [category] = await db
      .insert(serviceCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, id));
    return category;
  }

  async updateServiceCategory(id: number, insertCategory: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
    const [category] = await db
      .update(serviceCategories)
      .set(insertCategory)
      .where(eq(serviceCategories.id, id))
      .returning();
    return category;
  }

  async deleteServiceCategory(id: number): Promise<boolean> {
    // Check if category is in use by any services
    const servicesUsingCategory = await db
      .select({ count: sql<number>`count(*)` })
      .from(professionalServices)
      .where(eq(professionalServices.categoryId, id));
    
    if (servicesUsingCategory[0]?.count > 0) {
      throw new Error("Cannot delete category that is in use by services");
    }

    const result = await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .returning({ id: serviceCategories.id });
    return result.length > 0;
  }

  async getServicesByCategory(categoryId: number): Promise<ProfessionalService[]> {
    return await db
      .select()
      .from(professionalServices)
      .where(eq(professionalServices.categoryId, categoryId));
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(adminAuditLog)
      .values(insertLog)
      .returning();
    return log;
  }

  // Professional services
  async createProfessionalService(insertService: InsertProfessionalService): Promise<ProfessionalService> {
    const [service] = await db
      .insert(professionalServices)
      .values(insertService)
      .returning();
    return service;
  }

  async getProfessionalService(id: number): Promise<ProfessionalService | undefined> {
    const [service] = await db
      .select()
      .from(professionalServices)
      .where(eq(professionalServices.id, id));
    return service;
  }

  async getProfessionalServicesByProvider(providerId: number): Promise<ProfessionalService[]> {
    return await db
      .select()
      .from(professionalServices)
      .where(eq(professionalServices.providerId, providerId))
      .orderBy(desc(professionalServices.createdAt));
  }

  async getAllProfessionalServices(): Promise<ProfessionalService[]> {
    return await db
      .select()
      .from(professionalServices)
      .where(and(
        eq(professionalServices.isActive, true),
        eq(professionalServices.isPaused, false)
      ))
      .orderBy(desc(professionalServices.createdAt));
  }

  async searchProfessionalServices(query?: string, categoryId?: number, skills?: string[]): Promise<ProfessionalService[]> {
    let whereCondition = and(
      eq(professionalServices.isActive, true),
      eq(professionalServices.isPaused, false)
    );

    if (query) {
      // Sanitize input to prevent SQL injection
      const sanitizedQuery = query.replace(/['"\\]/g, '');
      whereCondition = and(
        whereCondition,
        or(
          ilike(professionalServices.title, `%${sanitizedQuery}%`),
          ilike(professionalServices.description, `%${sanitizedQuery}%`),
          ilike(professionalServices.shortDescription, `%${sanitizedQuery}%`)
        )
      );
    }

    if (categoryId) {
      whereCondition = and(whereCondition, eq(professionalServices.categoryId, categoryId));
    }

    return await db
      .select()
      .from(professionalServices)
      .where(whereCondition)
      .orderBy(desc(professionalServices.averageRating), desc(professionalServices.bookingCount));
  }

  async updateProfessionalService(id: number, insertService: Partial<InsertProfessionalService>): Promise<ProfessionalService | undefined> {
    const [service] = await db
      .update(professionalServices)
      .set({ ...insertService, updatedAt: new Date() })
      .where(eq(professionalServices.id, id))
      .returning();
    return service;
  }

  async deleteProfessionalService(id: number): Promise<boolean> {
    const result = await db
      .delete(professionalServices)
      .where(eq(professionalServices.id, id))
      .returning({ id: professionalServices.id });
    return result.length > 0;
  }

  // Service bookings
  async createServiceBooking(insertBooking: InsertServiceBooking): Promise<ServiceBooking> {
    const [booking] = await db
      .insert(serviceBookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getServiceBooking(id: number): Promise<ServiceBooking | undefined> {
    const [booking] = await db
      .select()
      .from(serviceBookings)
      .where(eq(serviceBookings.id, id));
    return booking;
  }

  async getServiceBookingsByClient(clientId: number): Promise<ServiceBooking[]> {
    return await db
      .select()
      .from(serviceBookings)
      .where(eq(serviceBookings.clientId, clientId))
      .orderBy(desc(serviceBookings.createdAt));
  }

  async getServiceBookingsByProvider(providerId: number): Promise<ServiceBooking[]> {
    return await db
      .select()
      .from(serviceBookings)
      .where(eq(serviceBookings.providerId, providerId))
      .orderBy(desc(serviceBookings.createdAt));
  }

  async updateServiceBooking(id: number, insertBooking: Partial<InsertServiceBooking>): Promise<ServiceBooking | undefined> {
    const [booking] = await db
      .update(serviceBookings)
      .set({ ...insertBooking, updatedAt: new Date() })
      .where(eq(serviceBookings.id, id))
      .returning();
    return booking;
  }

  // Service reviews
  async createServiceReview(insertReview: InsertServiceReview): Promise<ServiceReview> {
    const [review] = await db
      .insert(serviceReviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getServiceReviews(serviceId: number): Promise<ServiceReview[]> {
    return await db
      .select()
      .from(serviceReviews)
      .where(eq(serviceReviews.serviceId, serviceId))
      .orderBy(desc(serviceReviews.createdAt));
  }

  async getServiceReviewsByProvider(providerId: number): Promise<ServiceReview[]> {
    return await db
      .select()
      .from(serviceReviews)
      .where(eq(serviceReviews.providerId, providerId))
      .orderBy(desc(serviceReviews.createdAt));
  }

  // Service portfolios
  async createServicePortfolio(insertPortfolio: InsertServicePortfolio): Promise<ServicePortfolio> {
    const [portfolio] = await db
      .insert(servicePortfolios)
      .values(insertPortfolio)
      .returning();
    return portfolio;
  }

  async getServicePortfolios(serviceId: number): Promise<ServicePortfolio[]> {
    return await db
      .select()
      .from(servicePortfolios)
      .where(and(
        eq(servicePortfolios.serviceId, serviceId),
        eq(servicePortfolios.isPublic, true)
      ))
      .orderBy(servicePortfolios.sortOrder, desc(servicePortfolios.createdAt));
  }

  async getServicePortfoliosByProvider(providerId: number): Promise<ServicePortfolio[]> {
    return await db
      .select()
      .from(servicePortfolios)
      .where(eq(servicePortfolios.providerId, providerId))
      .orderBy(servicePortfolios.sortOrder, desc(servicePortfolios.createdAt));
  }

  async updateServicePortfolio(id: number, insertPortfolio: Partial<InsertServicePortfolio>): Promise<ServicePortfolio | undefined> {
    const [portfolio] = await db
      .update(servicePortfolios)
      .set({ ...insertPortfolio, updatedAt: new Date() })
      .where(eq(servicePortfolios.id, id))
      .returning();
    return portfolio;
  }

  async deleteServicePortfolio(id: number): Promise<boolean> {
    const result = await db
      .delete(servicePortfolios)
      .where(eq(servicePortfolios.id, id))
      .returning({ id: servicePortfolios.id });
    return result.length > 0;
  }

  // Saved skill recommendations methods
  async saveSkillRecommendation(recommendation: InsertSavedSkillRecommendation): Promise<SavedSkillRecommendation> {
    const [saved] = await db
      .insert(savedSkillRecommendations)
      .values(recommendation)
      .returning();
    return saved;
  }

  async getSavedSkillRecommendations(employeeId: number): Promise<SavedSkillRecommendation[]> {
    return await db
      .select()
      .from(savedSkillRecommendations)
      .where(eq(savedSkillRecommendations.employeeId, employeeId))
      .orderBy(desc(savedSkillRecommendations.savedAt));
  }

  async updateSavedSkillRecommendation(id: number, updates: Partial<InsertSavedSkillRecommendation>): Promise<SavedSkillRecommendation | undefined> {
    const [updated] = await db
      .update(savedSkillRecommendations)
      .set({ ...updates, lastAccessedAt: new Date() })
      .where(eq(savedSkillRecommendations.id, id))
      .returning();
    return updated;
  }

  async deleteSavedSkillRecommendation(id: number): Promise<boolean> {
    const result = await db
      .delete(savedSkillRecommendations)
      .where(eq(savedSkillRecommendations.id, id))
      .returning({ id: savedSkillRecommendations.id });
    return result.length > 0;
  }

  async updateLearningProgress(id: number, progressPercentage: number): Promise<SavedSkillRecommendation | undefined> {
    const [updated] = await db
      .update(savedSkillRecommendations)
      .set({ 
        progressPercentage, 
        lastAccessedAt: new Date(),
        status: progressPercentage >= 100 ? 'completed' : 'in_progress'
      })
      .where(eq(savedSkillRecommendations.id, id))
      .returning();
    return updated;
  }

  async markSkillRecommendationComplete(id: number): Promise<SavedSkillRecommendation | undefined> {
    const [completed] = await db
      .update(savedSkillRecommendations)
      .set({ 
        status: 'completed', 
        progressPercentage: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      })
      .where(eq(savedSkillRecommendations.id, id))
      .returning();
    return completed;
  }

  // Learning path cache methods
  async getCachedLearningPath(skill: string, context = "general", currentLevel = "beginner", targetLevel = "intermediate"): Promise<LearningPathCache | undefined> {
    const [cached] = await db
      .select()
      .from(learningPathCache)
      .where(
        and(
          eq(learningPathCache.skill, skill.toLowerCase()),
          eq(learningPathCache.context, context),
          eq(learningPathCache.currentLevel, currentLevel),
          eq(learningPathCache.targetLevel, targetLevel)
        )
      )
      .limit(1);
    
    if (cached) {
      // Update usage stats
      await this.updateLearningPathCacheUsage(cached.id);
    }
    
    return cached;
  }

  async cacheLearningPath(cacheData: InsertLearningPathCache): Promise<LearningPathCache> {
    const [cached] = await db
      .insert(learningPathCache)
      .values({
        ...cacheData,
        skill: cacheData.skill.toLowerCase()
      })
      .returning();
    return cached;
  }

  async updateLearningPathCacheUsage(id: number): Promise<void> {
    await db
      .update(learningPathCache)
      .set({ 
        lastUsedAt: new Date(),
        usageCount: sql`${learningPathCache.usageCount} + 1`
      })
      .where(eq(learningPathCache.id, id));
  }

  // Development logout state management
  async getDevLogoutState(): Promise<boolean> {
    try {
      const [state] = await db
        .select()
        .from(devLogoutState)
        .where(eq(devLogoutState.id, 'singleton'));
      
      return state?.isLoggedOut || false;
    } catch (error) {
      console.log('[AUTH] Error getting logout state:', error);
      return false;
    }
  }

  async setDevLogoutState(isLoggedOut: boolean): Promise<void> {
    try {
      await db
        .insert(devLogoutState)
        .values({
          id: 'singleton',
          isLoggedOut,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: devLogoutState.id,
          set: {
            isLoggedOut,
            updatedAt: new Date(),
          },
        });
      console.log(`[AUTH] Set database logout state to: ${isLoggedOut}`);
    } catch (error) {
      console.log('[AUTH] Error setting logout state:', error);
    }
  }

  // Team management methods
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));
    return team;
  }

  async getTeamsByMember(employeeId: number): Promise<Team[]> {
    return await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        profileImage: teams.profileImage,
        website: teams.website,
        specialties: teams.specialties,
        isActive: teams.isActive,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(and(
        eq(teamMembers.employeeId, employeeId),
        eq(teamMembers.isActive, true),
        eq(teams.isActive, true)
      ));
  }

  async getAllTeams(): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.isActive, true))
      .orderBy(teams.name);
  }

  async updateTeam(id: number, insertTeam: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set({ ...insertTeam, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const [result] = await db
      .update(teams)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning({ id: teams.id });
    return !!result;
  }

  // Team member management
  async addTeamMember(insertMember: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async removeTeamMember(teamId: number, employeeId: number): Promise<boolean> {
    const [result] = await db
      .update(teamMembers)
      .set({ isActive: false })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.employeeId, employeeId)
      ))
      .returning({ id: teamMembers.id });
    return !!result;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.isActive, true)
      ))
      .orderBy(teamMembers.joinedAt);
  }

  async getTeamMembersByEmployee(employeeId: number): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.employeeId, employeeId),
        eq(teamMembers.isActive, true)
      ))
      .orderBy(teamMembers.joinedAt);
  }

  async updateTeamMemberRole(teamId: number, employeeId: number, role: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.employeeId, employeeId)
      ))
      .returning();
    return member;
  }

  async approveTeamMember(teamId: number, employeeId: number, approvedBy: number): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({ 
        approvedBy,
        approvedAt: new Date(),
        isActive: true
      })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.employeeId, employeeId)
      ))
      .returning();
    return member;
  }

  // Team service categories
  async createTeamServiceCategory(insertCategory: InsertTeamServiceCategory): Promise<TeamServiceCategory> {
    const [category] = await db
      .insert(teamServiceCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getTeamServiceCategories(teamId: number): Promise<TeamServiceCategory[]> {
    return await db
      .select()
      .from(teamServiceCategories)
      .where(and(
        eq(teamServiceCategories.teamId, teamId),
        eq(teamServiceCategories.isActive, true)
      ))
      .orderBy(teamServiceCategories.name);
  }

  async updateTeamServiceCategory(id: number, insertCategory: Partial<InsertTeamServiceCategory>): Promise<TeamServiceCategory | undefined> {
    const [category] = await db
      .update(teamServiceCategories)
      .set(insertCategory)
      .where(eq(teamServiceCategories.id, id))
      .returning();
    return category;
  }

  async deleteTeamServiceCategory(id: number): Promise<boolean> {
    const [result] = await db
      .update(teamServiceCategories)
      .set({ isActive: false })
      .where(eq(teamServiceCategories.id, id))
      .returning({ id: teamServiceCategories.id });
    return !!result;
  }

  // Team services
  async getProfessionalServicesByTeam(teamId: number): Promise<ProfessionalService[]> {
    return await db
      .select()
      .from(professionalServices)
      .where(and(
        eq(professionalServices.teamId, teamId),
        eq(professionalServices.isActive, true)
      ))
      .orderBy(professionalServices.createdAt);
  }

  async searchTeamServices(query?: string, teamId?: number, categoryId?: number): Promise<ProfessionalService[]> {
    let whereConditions = [eq(professionalServices.isActive, true)];
    
    if (teamId) {
      whereConditions.push(eq(professionalServices.teamId, teamId));
    }
    
    if (categoryId) {
      whereConditions.push(eq(professionalServices.teamCategoryId, categoryId));
    }
    
    if (query) {
      whereConditions.push(
        or(
          sql`${professionalServices.title} ILIKE ${`%${query}%`}`,
          sql`${professionalServices.description} ILIKE ${`%${query}%`}`
        )
      );
    }

    return await db
      .select()
      .from(professionalServices)
      .where(and(...whereConditions))
      .orderBy(professionalServices.createdAt);
  }

  async getAllTeamsWithMemberCount(): Promise<any[]> {
    const teamsWithCounts = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        profileImage: teams.profileImage,
        website: teams.website,
        specialties: teams.specialties,
        isActive: teams.isActive,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: sql<number>`COUNT(CASE WHEN ${teamMembers.isActive} = true THEN 1 END)`.as('memberCount'),
        visibility: sql<string>`'public'`.as('visibility')
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teams.isActive, true))
      .groupBy(teams.id)
      .orderBy(teams.createdAt);
    
    return teamsWithCounts;
  }

  // Team management helpers for team managers
  async getUserTeams(userId: string): Promise<any[]> {
    const employee = await this.getEmployeeByUserId(parseInt(userId));
    if (!employee) return [];

    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        profileImage: teams.profileImage,
        website: teams.website,
        specialties: teams.specialties,
        isActive: teams.isActive,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberRole: teamMembers.role,
        joinedAt: teamMembers.joinedAt
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(
        and(
          eq(teamMembers.employeeId, employee.id),
          eq(teamMembers.isActive, true),
          eq(teams.isActive, true)
        )
      );

    return userTeams;
  }

  async isTeamManager(userId: string, teamId: number): Promise<boolean> {
    const employee = await this.getEmployeeByUserId(parseInt(userId));
    if (!employee) return false;

    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.employeeId, employee.id),
          eq(teamMembers.isActive, true),
          eq(teamMembers.role, "leader")
        )
      );

    return membership.length > 0;
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    const members = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        employeeId: teamMembers.employeeId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        isActive: teamMembers.isActive,
        approvedBy: teamMembers.approvedBy,
        approvedAt: teamMembers.approvedAt,
        // Employee details
        employeeName: employees.name,
        employeeEmail: sql<string>`(SELECT ${users.email} FROM ${users} WHERE ${users.id} = ${employees.userId})`.as('employeeEmail'),
        employeeTitle: employees.title,
        employeeSkills: employees.skills
      })
      .from(teamMembers)
      .innerJoin(employees, eq(teamMembers.employeeId, employees.id))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.isActive, true)
        )
      )
      .orderBy(teamMembers.joinedAt);

    return members;
  }

  async updateTeamMemberRole(teamId: number, employeeId: number, newRole: string): Promise<boolean> {
    try {
      await db
        .update(teamMembers)
        .set({ role: newRole })
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.employeeId, employeeId)
          )
        );
      return true;
    } catch (error) {
      console.error("Error updating team member role:", error);
      return false;
    }
  }

  async removeTeamMember(teamId: number, employeeId: number): Promise<boolean> {
    try {
      await db
        .update(teamMembers)
        .set({ isActive: false })
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.employeeId, employeeId)
          )
        );
      return true;
    } catch (error) {
      console.error("Error removing team member:", error);
      return false;
    }
  }

}

export const storage = new DatabaseStorage();
