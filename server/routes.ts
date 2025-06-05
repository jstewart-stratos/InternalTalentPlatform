import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertSkillEndorsementSchema, insertProjectSchema, insertSiteSettingSchema, insertAuditLogSchema, insertUserPermissionSchema } from "@shared/schema";
import { sendEmail } from "./sendgrid";
import { getProjectRecommendationsForEmployee, getEmployeeRecommendationsForProject, getSkillGapAnalysis } from "./ai-recommendations";
import { getProjectRecommendationsForEmployee as getSkillBasedProjectRecs, getEmployeeRecommendationsForProject as getSkillBasedEmployeeRecs } from "./skill-matching";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Update last login
      if (user) {
        await storage.updateUserLastLogin(userId);
      }
      
      // Check if user has an employee profile
      const employeeProfile = await storage.getEmployeeByEmail(user?.email || '');
      
      res.json({
        ...user,
        hasEmployeeProfile: !!employeeProfile,
        employeeProfile
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current user's employee profile
  app.get('/api/employees/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const employee = await storage.getEmployeeByEmail(user.email || '');
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching current employee:", error);
      res.status(500).json({ message: "Failed to fetch employee profile" });
    }
  });

  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const { q: query, department, experienceLevel } = req.query;
      
      if (query || department || experienceLevel) {
        const employees = await storage.searchEmployees(
          query as string || "",
          department as string,
          experienceLevel as string
        );
        res.json(employees);
      } else {
        const employees = await storage.getAllEmployees();
        res.json(employees);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid employee data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create employee" });
      }
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid employee data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update employee" });
      }
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });



  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      const stats = {
        activeUsers: employees.length,
        skillsRegistered: [...new Set(employees.flatMap(e => e.skills))].length,
        successfulMatches: Math.floor(employees.length * 0.7), // Simulated
        projectsCompleted: Math.floor(employees.length * 0.2) // Simulated
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/departments", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const departments = [...new Set(employees.map(e => e.department))];
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.get("/api/trending-skills", async (req, res) => {
    try {
      const trendingSkills = await storage.getTrendingSkills();
      res.json(trendingSkills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending skills" });
    }
  });

  app.post("/api/track-search", async (req, res) => {
    try {
      const { skill } = req.body;
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ error: "Skill is required" });
      }
      
      await storage.trackSkillSearch(skill);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track search" });
    }
  });

  // Skill endorsement routes
  app.post("/api/skill-endorsements", async (req, res) => {
    try {
      const validatedData = insertSkillEndorsementSchema.parse(req.body);
      const endorsement = await storage.createSkillEndorsement(validatedData);
      res.status(201).json(endorsement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid endorsement data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create endorsement" });
      }
    }
  });

  app.get("/api/skill-endorsements/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const endorsements = await storage.getSkillEndorsements(employeeId);
      res.json(endorsements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch endorsements" });
    }
  });

  app.get("/api/skill-endorsements/:employeeId/:skill", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const skill = req.params.skill;
      const endorsements = await storage.getSkillEndorsementsBySkill(employeeId, skill);
      res.json(endorsements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill endorsements" });
    }
  });

  app.delete("/api/skill-endorsements/:employeeId/:endorserId/:skill", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const endorserId = parseInt(req.params.endorserId);
      const skill = req.params.skill;
      
      const success = await storage.removeSkillEndorsement(employeeId, endorserId, skill);
      
      if (!success) {
        return res.status(404).json({ error: "Endorsement not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove endorsement" });
    }
  });

  // Get all endorsements
  app.get("/api/all-endorsements", async (req, res) => {
    try {
      const allEmployees = await storage.getAllEmployees();
      const allEndorsements = [];
      
      for (const employee of allEmployees) {
        const endorsements = await storage.getSkillEndorsements(employee.id);
        allEndorsements.push(...endorsements);
      }
      
      res.json(allEndorsements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch endorsements" });
    }
  });

  // Email route for Contact Me functionality
  const emailSchema = z.object({
    to: z.string().email("Invalid email address"),
    from: z.string().email("Invalid sender email address"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    senderName: z.string().min(1, "Sender name is required")
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const validatedData = emailSchema.parse(req.body);
      
      // Create HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Message from ${validatedData.senderName}</h2>
          <p style="color: #374151; line-height: 1.6;">${validatedData.message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This message was sent through the Stratos Skill Swap platform.<br>
            Reply directly to this email to respond to ${validatedData.senderName}.
          </p>
        </div>
      `;

      const success = await sendEmail({
        to: validatedData.to,
        from: validatedData.from,
        subject: `[Stratos Skill Swap] ${validatedData.subject}`,
        text: `Message from ${validatedData.senderName}:\n\n${validatedData.message}\n\nThis message was sent through the Stratos Skill Swap platform.`,
        html: htmlContent
      });

      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      // Transform deadline string to Date object for validation
      const requestData = {
        ...req.body,
        deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      };
      
      const projectData = insertProjectSchema.parse(requestData);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid project data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create project" });
      }
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updateData);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid project data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update project" });
      }
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      if (!success) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // AI Recommendation routes
  app.get("/api/recommendations/projects/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const allProjects = await storage.getAllProjects();
      const activeProjects = allProjects.filter(p => p.status !== 'completed');
      
      try {
        // Try AI recommendations first
        const recommendations = await getProjectRecommendationsForEmployee(employee, activeProjects);
        res.json(recommendations);
      } catch (aiError) {
        console.log("AI recommendations unavailable, using skill-based matching");
        // Fallback to skill-based matching
        const skillMatches = getSkillBasedProjectRecs(employee, activeProjects);
        const formattedRecommendations = skillMatches.map(match => ({
          project: match.project,
          compatibilityScore: match.compatibilityScore,
          matchingSkills: match.matchingSkills,
          missingSkills: (match.project.requiredSkills || []).filter(skill => 
            !match.matchingSkills.includes(skill)
          ),
          reasoning: `Based on skill analysis: ${match.matchingSkills.length} of ${match.totalRequiredSkills} required skills match. Experience level: ${employee.experienceLevel}.`,
          recommendationLevel: match.recommendationLevel
        }));
        res.json(formattedRecommendations);
      }
    } catch (error) {
      console.error("Error getting project recommendations:", error);
      res.status(500).json({ error: "Failed to generate project recommendations" });
    }
  });

  app.get("/api/recommendations/employees/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const allEmployees = await storage.getAllEmployees();
      
      try {
        // Try AI recommendations first
        const recommendations = await getEmployeeRecommendationsForProject(project, allEmployees);
        res.json(recommendations);
      } catch (aiError) {
        console.log("AI recommendations unavailable, using skill-based matching");
        // Fallback to skill-based matching
        const skillMatches = getSkillBasedEmployeeRecs(project, allEmployees);
        const formattedRecommendations = skillMatches.map(match => ({
          employee: match.employee,
          compatibilityScore: match.compatibilityScore,
          matchingSkills: match.matchingSkills,
          additionalValue: [match.employee.department, match.employee.experienceLevel],
          reasoning: `Skill-based match: ${match.matchingSkills.length} of ${match.totalRequiredSkills} required skills. ${match.employee.experienceLevel} level expertise in ${match.employee.department}.`,
          recommendationLevel: match.recommendationLevel
        }));
        res.json(formattedRecommendations);
      }
    } catch (error) {
      console.error("Error getting employee recommendations:", error);
      res.status(500).json({ error: "Failed to generate employee recommendations" });
    }
  });

  app.post("/api/recommendations/skill-gap", async (req, res) => {
    try {
      const { employeeId, projectId } = req.body;
      
      const employee = await storage.getEmployee(employeeId);
      const project = await storage.getProject(projectId);
      
      if (!employee || !project) {
        return res.status(404).json({ error: "Employee or project not found" });
      }

      const skillGapAnalysis = await getSkillGapAnalysis(employee, project);
      res.json(skillGapAnalysis);
    } catch (error) {
      console.error("Error generating skill gap analysis:", error);
      res.status(500).json({ error: "Failed to generate skill gap analysis" });
    }
  });

  // Admin middleware to check user role
  const requireAdminRole = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to verify admin access" });
    }
  };

  // Admin user management routes
  app.get("/api/admin/users", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:userId/role", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'manager', 'user'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "user_role_updated",
        targetType: "user",
        targetId: userId,
        changes: { role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.put("/api/admin/users/:userId/deactivate", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deactivateUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "user_deactivated",
        targetType: "user",
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });

  app.put("/api/admin/users/:userId/activate", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.activateUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "user_activated",
        targetType: "user",
        targetId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ error: "Failed to activate user" });
    }
  });

  // Site settings routes
  app.get("/api/admin/settings", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await storage.getSiteSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.put("/api/admin/settings/:key", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const setting = await storage.updateSiteSetting(key, value, req.user.claims.sub);

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "setting_updated",
        targetType: "setting",
        targetId: key,
        changes: { value },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(setting);
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ error: "Failed to update site setting" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const settingData = insertSiteSettingSchema.parse({
        ...req.body,
        updatedBy: req.user.claims.sub
      });
      
      const setting = await storage.createSiteSetting(settingData);

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "setting_created",
        targetType: "setting",
        targetId: setting.key,
        changes: settingData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid setting data", details: error.errors });
      } else {
        console.error("Error creating site setting:", error);
        res.status(500).json({ error: "Failed to create site setting" });
      }
    }
  });

  // Audit log routes
  app.get("/api/admin/audit-logs", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getAuditLogs(limit ? parseInt(limit as string) : 100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/admin/audit-logs/:userId", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getAuditLogsByUser(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user audit logs:", error);
      res.status(500).json({ error: "Failed to fetch user audit logs" });
    }
  });

  // User permissions routes
  app.get("/api/admin/users/:userId/permissions", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { userId } = req.params;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/admin/users/:userId/permissions", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;
      
      const newPermission = await storage.grantUserPermission({
        userId,
        permission,
        grantedBy: req.user.claims.sub
      });

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "permission_granted",
        targetType: "user",
        targetId: userId,
        changes: { permission },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(newPermission);
    } catch (error) {
      console.error("Error granting user permission:", error);
      res.status(500).json({ error: "Failed to grant user permission" });
    }
  });

  app.delete("/api/admin/users/:userId/permissions/:permission", isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { userId, permission } = req.params;
      
      const success = await storage.revokeUserPermission(userId, permission);
      if (!success) {
        return res.status(404).json({ error: "Permission not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: "permission_revoked",
        targetType: "user",
        targetId: userId,
        changes: { permission },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking user permission:", error);
      res.status(500).json({ error: "Failed to revoke user permission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
