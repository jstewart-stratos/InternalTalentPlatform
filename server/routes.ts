import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertSkillEndorsementSchema, insertProjectSchema, insertSiteSettingSchema, insertAuditLogSchema, insertUserPermissionSchema, insertTeamSchema, insertTeamMemberSchema, insertTeamServiceCategorySchema, insertServiceCategorySchema, insertProfessionalServiceSchema, insertServiceBookingSchema, insertServiceReviewSchema, insertServicePortfolioSchema, insertSavedSkillRecommendationSchema, teamMembers } from "@shared/schema";
import { db } from "./db";
import { sendEmail } from "./sendgrid";
import { getProjectRecommendationsForEmployee, getEmployeeRecommendationsForProject, getSkillGapAnalysis } from "./ai-recommendations";
import OpenAI from "openai";
import { getProjectRecommendationsForEmployee as getSkillBasedProjectRecs, getEmployeeRecommendationsForProject as getSkillBasedEmployeeRecs } from "./skill-matching";
import { seedEmployeeSkills, getSkillLevelSummary } from "./seed-employee-skills";
import { setupCustomAuth, requireAuth, requireAdmin, requireTeamManager, requireTeamManagerOrAdmin, requireTeamManagerAccess, hashPassword } from "./auth";
import { securityHeaders, sanitizeInput, rateLimit, validateRequest } from "./middleware/security";
import { cacheMiddleware, clearCache } from "./middleware/cache";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware globally
  app.use(securityHeaders);
  app.use(sanitizeInput);
  
  // Auth middleware setup
  setupCustomAuth(app);
  
  // Use custom authentication middleware
  const authMiddleware = requireAuth;

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Logout route
  app.post('/api/logout', rateLimit(5, 60000), (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
        res.json({ success: true, message: 'Logged out successfully' });
      });
    } else {
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });

  // Auth routes are handled in auth.ts module

  // Get current user's employee profile
  app.get('/api/employees/current', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Employee routes with caching and rate limiting
  app.get("/api/employees", cacheMiddleware(300), rateLimit(100, 60000), async (req, res) => {
    try {
      const { q: query, experienceLevel } = req.query;
      
      if (query || experienceLevel) {
        const employees = await storage.searchEmployees(
          query as string || "",
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

  app.get("/api/employees/:id", cacheMiddleware(600), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid employee ID" });
      }
      
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", 
    authMiddleware, 
    rateLimit(10, 60000), 
    validateRequest(insertEmployeeSchema), 
    async (req: any, res) => {
    try {
      const { skillsWithExperience, ...employeeBody } = req.body;
      
      // Debug logging (can be removed in production)
      // console.log("Received employee data:", req.body);
      
      // Add userId from authenticated user
      const employeeData = {
        ...employeeBody,
        userId: req.user.id
      };
      
      // Check if employee already exists for this user
      const existingEmployee = await storage.getEmployeeByUserId(req.user.id);
      
      let employee;
      if (existingEmployee) {
        // Update existing employee
        employee = await storage.updateEmployee(existingEmployee.id, employeeData);
      } else {
        // Create new employee
        employee = await storage.createEmployee(employeeData);
      }

      if (!employee) {
        return res.status(500).json({ error: "Failed to create or update employee" });
      }

      // Handle individual skills with experience levels if provided
      if (skillsWithExperience && Array.isArray(skillsWithExperience)) {
        // Create individual skill records
        for (const skillData of skillsWithExperience) {
          try {
            await storage.createEmployeeSkill({
              employeeId: employee.id,
              skillName: skillData.skillName,
              experienceLevel: skillData.experienceLevel,
              yearsOfExperience: skillData.yearsOfExperience,
              lastUsed: new Date(),
              isEndorsed: false,
              endorsementCount: 0
            });
          } catch (skillError) {
            console.error(`Failed to create skill ${skillData.skillName}:`, skillError);
          }
        }
      }
      
      // Clear employee cache
      clearCache('/api/employees');
      
      res.status(existingEmployee ? 200 : 201).json(employee);
    } catch (error) {
      console.error("Employee creation error:", error);
      res.status(500).json({ error: "Failed to create employee" });
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

  app.put("/api/employees/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { skillsWithExperience, ...employeeBody } = req.body;
      
      // Debug logging (can be removed in production)
      // console.log("PUT - Received employee update data:", req.body);
      
      // Add userId from authenticated user
      const employeeData = {
        ...employeeBody,
        userId: req.user.id
      };
      
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Handle individual skills with experience levels if provided
      if (skillsWithExperience && Array.isArray(skillsWithExperience)) {
        // First, remove existing skills for this employee
        try {
          await storage.deleteEmployeeSkills(id);
        } catch (deleteError) {
          console.warn("Failed to delete existing skills:", deleteError);
        }
        
        // Create new individual skill records
        for (const skillData of skillsWithExperience) {
          try {
            await storage.createEmployeeSkill({
              employeeId: employee.id,
              skillName: skillData.skillName,
              experienceLevel: skillData.experienceLevel,
              yearsOfExperience: skillData.yearsOfExperience,
              lastUsed: new Date(),
              isEndorsed: false,
              endorsementCount: 0
            });
          } catch (skillError) {
            console.error(`Failed to create skill ${skillData.skillName}:`, skillError);
          }
        }
      }
      
      // Clear employee cache
      clearCache('/api/employees');
      
      res.json(employee);
    } catch (error) {
      console.error("Employee update error:", error);
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



  // Analytics routes with caching
  app.get("/api/analytics/stats", authMiddleware, cacheMiddleware(600), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      const allSkills = employees.flatMap(e => e.skills || []);
      const uniqueSkills = [...new Set(allSkills)];
      
      const stats = {
        activeUsers: employees.length,
        skillsRegistered: uniqueSkills.length,
        successfulMatches: Math.floor(employees.length * 0.7),
        projectsCompleted: Math.floor(employees.length * 0.2)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Analytics stats error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });



  app.get("/api/trending-skills", cacheMiddleware(300), rateLimit(50, 60000), async (req, res) => {
    try {
      const trendingSkills = await storage.getTrendingSkills();
      res.json(trendingSkills);
    } catch (error) {
      console.error("Trending skills error:", error);
      res.status(500).json({ error: "Failed to fetch trending skills" });
    }
  });

  app.post("/api/track-search", async (req, res) => {
    try {
      const { skill } = req.body;
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ error: "Skill is required" });
      }
      
      // Sanitize skill input to prevent SQL injection
      const sanitizedSkill = skill.replace(/['"\\]/g, '').trim();
      if (sanitizedSkill.length === 0) {
        return res.status(400).json({ error: "Invalid skill name" });
      }
      
      await storage.trackSkillSearch(sanitizedSkill);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track search" });
    }
  });

  // Employee skills management routes
  app.get("/api/employees/:id/skills", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const skills = await storage.getEmployeeSkills(employeeId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee skills" });
    }
  });

  app.post("/api/employees/:id/skills", requireAuth, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      console.log('Add skill request:', {
        employeeId,
        userId,
        hasUser: !!req.user,
        hasClaims: !!req.user?.claims,
        body: req.body
      });
      
      // Verify user can only add skills to their own profile
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        console.log('Employee not found for ID:', employeeId);
        return res.status(404).json({ error: "Employee not found" });
      }
      
      const currentEmployee = await storage.getEmployeeByUserId(userId);
      console.log('Current employee lookup:', {
        userId,
        foundEmployee: currentEmployee?.id,
        targetEmployeeId: employeeId,
        match: currentEmployee?.id === employeeId
      });
      
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return res.status(403).json({ error: "Cannot add skills to another user's profile" });
      }

      if (!req.body.skillName || !req.body.skillName.trim()) {
        return res.status(400).json({ error: "Skill name is required" });
      }

      // Sanitize skill name to prevent SQL injection
      const sanitizedSkillName = req.body.skillName.replace(/['"\\]/g, '').trim();
      if (sanitizedSkillName.length === 0) {
        return res.status(400).json({ error: "Invalid skill name" });
      }

      const skillData = {
        employeeId,
        skillName: sanitizedSkillName,
        experienceLevel: req.body.experienceLevel || 'beginner',
        yearsOfExperience: req.body.yearsOfExperience || 1,
        lastUsed: new Date(req.body.lastUsed || Date.now()),
        isEndorsed: req.body.isEndorsed || false,
        endorsementCount: req.body.endorsementCount || 0
      };
      
      console.log('Creating skill:', skillData);
      const skill = await storage.createEmployeeSkill(skillData);
      res.status(201).json(skill);
    } catch (error) {
      console.error('Error creating employee skill:', error);
      res.status(500).json({ error: "Failed to create employee skill", details: (error as Error).message });
    }
  });

  app.put("/api/employees/:id/skills/:skillId", requireAuth, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const skillId = parseInt(req.params.skillId);
      const userId = req.user?.claims?.sub;
      
      // Verify user can only update skills on their own profile
      const currentEmployee = await storage.getEmployeeByUserId(userId);
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return res.status(403).json({ error: "Cannot update skills on another user's profile" });
      }

      const updateData: any = {};
      if (req.body.experienceLevel) updateData.experienceLevel = req.body.experienceLevel;
      if (req.body.yearsOfExperience) updateData.yearsOfExperience = req.body.yearsOfExperience;
      if (req.body.lastUsed) updateData.lastUsed = new Date(req.body.lastUsed);
      if (req.body.isEndorsed !== undefined) updateData.isEndorsed = req.body.isEndorsed;
      if (req.body.endorsementCount !== undefined) updateData.endorsementCount = req.body.endorsementCount;
      
      const skill = await storage.updateEmployeeSkill(skillId, updateData);
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      console.error('Error updating employee skill:', error);
      res.status(500).json({ error: "Failed to update employee skill", details: (error as Error).message });
    }
  });

  app.delete("/api/employees/:id/skills/:skillId", requireAuth, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const skillId = parseInt(req.params.skillId);
      const userId = req.user?.claims?.sub;
      
      // Verify user can only delete skills from their own profile
      const currentEmployee = await storage.getEmployeeByUserId(userId);
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return res.status(403).json({ error: "Cannot delete skills from another user's profile" });
      }

      const success = await storage.deleteEmployeeSkill(skillId);
      if (!success) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting employee skill:', error);
      res.status(500).json({ error: "Failed to delete employee skill", details: (error as Error).message });
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

  // Get all employee skills for analytics
  app.get("/api/all-employee-skills", async (req, res) => {
    try {
      const allSkills = await storage.getAllEmployeeSkillsWithDetails();
      res.json(allSkills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all employee skills" });
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

  // Skills API for tagging system
  app.get("/api/skills/all", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const allSkills = new Set<string>();
      
      employees.forEach(employee => {
        employee.skills.forEach(skill => allSkills.add(skill));
      });
      
      const projects = await storage.getAllProjects();
      projects.forEach(project => {
        project.requiredSkills.forEach(skill => allSkills.add(skill));
      });
      
      res.json(Array.from(allSkills).sort());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.get("/api/skills/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const employees = await storage.getAllEmployees();
      const skillCounts = new Map<string, number>();
      
      employees.forEach(employee => {
        employee.skills.forEach(skill => {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        });
      });
      
      const popularSkills = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      res.json(popularSkills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular skills" });
    }
  });

  // Seed financial services skills for all employees
  app.post("/api/skills/seed-financial", async (req, res) => {
    try {
      const { seedEmployeeSkills } = await import("./seed-employee-skills");
      await seedEmployeeSkills();
      res.json({ 
        message: "Financial services skills seeded successfully for all employees"
      });
    } catch (error) {
      console.error("Error seeding financial skills:", error);
      res.status(500).json({ error: "Failed to seed financial skills" });
    }
  });

  app.post("/api/skills/ai-suggestions", async (req, res) => {
    try {
      const { currentSkill, existingSkills = [], context, limit = 8 } = req.body;
      
      // Handle both currentSkills (old format) and existingSkills (new format)
      const userSkills = req.body.currentSkills || existingSkills || [];

      // Get all skills from the platform for fallback suggestions
      const employees = await storage.getAllEmployees();
      const projects = await storage.getAllProjects();
      const allSkills = new Set<string>();
      
      employees.forEach(employee => {
        employee.skills.forEach(skill => allSkills.add(skill));
      });
      
      projects.forEach(project => {
        project.requiredSkills.forEach(skill => allSkills.add(skill));
      });

      // Create skill-based suggestions using pattern matching
      const suggestions = [];
      const skillArray = Array.from(allSkills);
      
      // Rule-based skill suggestions based on current skills
      const skillRelations = {
        'JavaScript': ['TypeScript', 'React', 'Node.js', 'Vue.js', 'Angular'],
        'TypeScript': ['JavaScript', 'React', 'Node.js', 'Angular'],
        'React': ['JavaScript', 'TypeScript', 'Redux', 'Next.js', 'GraphQL'],
        'Python': ['Django', 'Flask', 'FastAPI', 'Machine Learning', 'Data Science'],
        'Java': ['Spring', 'Maven', 'Hibernate', 'Microservices'],
        'CSS': ['HTML', 'Sass', 'Tailwind CSS', 'Bootstrap'],
        'HTML': ['CSS', 'JavaScript', 'React'],
        'SQL': ['PostgreSQL', 'MySQL', 'Database Design', 'Data Analysis'],
        'Machine Learning': ['Python', 'TensorFlow', 'PyTorch', 'Data Science'],
        'AWS': ['Cloud Computing', 'DevOps', 'Docker', 'Kubernetes'],
        'Docker': ['Kubernetes', 'DevOps', 'AWS', 'CI/CD'],
        'Git': ['GitHub', 'GitLab', 'CI/CD', 'Version Control']
      };

      // Generate suggestions based on current input and existing skills
      for (const userSkill of userSkills) {
        const relatedSkills = skillRelations[userSkill as keyof typeof skillRelations] || [];
        for (const relatedSkill of relatedSkills) {
          if (allSkills.has(relatedSkill) && !userSkills.includes(relatedSkill)) {
            suggestions.push(relatedSkill);
          }
        }
      }

      // If typing a skill, suggest based on partial match
      if (currentSkill && currentSkill.length >= 2) {
        const partialMatches = skillArray.filter(skill => 
          skill.toLowerCase().includes(currentSkill.toLowerCase()) && 
          !userSkills.includes(skill)
        );
        suggestions.push(...partialMatches);
      }

      // Add complementary skills based on context
      if (context === 'project') {
        const projectSkills = ['Project Management', 'Agile', 'Scrum', 'Leadership'];
        for (const skill of projectSkills) {
          if (allSkills.has(skill) && !userSkills.includes(skill)) {
            suggestions.push(skill);
          }
        }
      }

      // Remove duplicates and return unique suggestions
      const uniqueSet = new Set(suggestions);
      const uniqueSuggestions = [];
      for (const suggestion of uniqueSet) {
        uniqueSuggestions.push(suggestion);
      }
      const finalSuggestions = uniqueSuggestions.slice(0, limit);

      res.json(uniqueSuggestions);
    } catch (error) {
      console.error('Error generating skill suggestions:', error);
      res.status(500).json({ error: "Failed to generate skill suggestions" });
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

  app.get("/api/projects/owner/:ownerId", async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      const projects = await storage.getProjectsByOwner(ownerId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects by owner" });
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
          additionalValue: [match.employee.experienceLevel, match.employee.address || "No location"],
          reasoning: `Skill-based match: ${match.matchingSkills.length} of ${match.totalRequiredSkills} required skills. ${match.employee.experienceLevel} level expertise.`,
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

  // Learning step completion routes
  app.get("/api/learning-steps/completions/:recommendationId", requireAuth, async (req: any, res) => {
    try {
      const recommendationId = parseInt(req.params.recommendationId);
      const stepCompletions = await storage.getLearningStepCompletions(recommendationId);
      res.json(stepCompletions);
    } catch (error) {
      console.error("Error fetching learning step completions:", error);
      res.status(500).json({ error: "Failed to fetch learning step completions" });
    }
  });

  app.post("/api/learning-steps/complete", requireAuth, async (req: any, res) => {
    try {
      const { savedRecommendationId, stepIndex, stepTitle, notes, resourcesCompleted } = req.body;
      
      const completion = await storage.completeLearningStep({
        savedRecommendationId,
        stepIndex,
        stepTitle,
        notes,
        resourcesCompleted
      });

      // Calculate updated progress based on completed steps
      const recommendation = await storage.getSavedSkillRecommendation(savedRecommendationId);
      if (recommendation?.learningPathData?.steps) {
        const totalSteps = recommendation.learningPathData.steps.length;
        const completedSteps = await storage.getLearningStepCompletions(savedRecommendationId);
        const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);
        
        await storage.updateSavedSkillRecommendationProgress(savedRecommendationId, progressPercentage);
      }

      res.json(completion);
    } catch (error) {
      console.error("Error completing learning step:", error);
      res.status(500).json({ error: "Failed to complete learning step" });
    }
  });

  app.delete("/api/learning-steps/complete", requireAuth, async (req: any, res) => {
    try {
      const { savedRecommendationId, stepIndex } = req.body;
      
      await storage.uncompleteLearningStep(savedRecommendationId, stepIndex);

      // Calculate updated progress based on remaining completed steps
      const recommendation = await storage.getSavedSkillRecommendation(savedRecommendationId);
      if (recommendation?.learningPathData?.steps) {
        const totalSteps = recommendation.learningPathData.steps.length;
        const completedSteps = await storage.getLearningStepCompletions(savedRecommendationId);
        const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);
        
        await storage.updateSavedSkillRecommendationProgress(savedRecommendationId, progressPercentage);
      }
      
      res.json({ success: true, message: "Step marked as incomplete" });
    } catch (error) {
      console.error("Error uncompleting learning step:", error);
      res.status(500).json({ error: "Failed to mark step as incomplete" });
    }
  });

  app.post("/api/learning-paths/advanced-material", requireAuth, async (req: any, res) => {
    try {
      const { skill, currentLevel = 'intermediate', targetLevel = 'advanced' } = req.body;
      
      // Check cache first
      const cachedPath = await storage.getCachedLearningPath(skill, 'advanced', currentLevel, targetLevel);
      if (cachedPath) {
        console.log(`Using cached advanced learning path for: ${skill}`);
        return res.json(cachedPath.learningPathData);
      }

      // Generate advanced learning path using AI
      const advancedPath = await generateCuratedLearningPath(skill, currentLevel, targetLevel, 'advanced');
      
      // Cache the generated path
      await storage.cacheLearningPath(skill, 'advanced', currentLevel, targetLevel, advancedPath);
      console.log(`Generated and cached advanced learning path for: ${skill}`);
      
      res.json(advancedPath);
    } catch (error) {
      console.error("Error generating advanced learning material:", error);
      res.status(500).json({ error: "Failed to generate advanced learning material" });
    }
  });

  // Admin middleware to check user role
  const requireAdminRole = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        await storage.logAdminAction({
          userId,
          action: 'unauthorized_admin_access_attempt',
          targetType: 'admin_endpoint',
          changes: { 
            endpoint: req.path,
            method: req.method
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(403).json({ error: "Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Admin role verification error:", error);
      res.status(500).json({ error: "Failed to verify admin access" });
    }
  };

  // Admin user management routes
  app.get("/api/admin/users", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user (Admin only)
  app.put("/api/admin/users/:id", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, email, role, password } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Email already in use by another user" });
      }

      // Prepare update data
      const updateData: any = {
        firstName,
        lastName,
        email,
        role
      };

      // Hash password if provided
      if (password) {
        updateData.password = await hashPassword(password);
      }

      // Update user information
      const updatedUser = await storage.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
        action: "user_updated",
        targetType: "user",
        targetId: userId.toString(),
        changes: { firstName, lastName, email, role, passwordChanged: !!password },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Create new user (Admin only)
  app.post("/api/admin/users", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, role = 'user' } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password using the same method as registration
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isActive: true,
        emailVerified: true
      });

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
        action: "user_created",
        targetType: "user",
        targetId: user.id.toString(),
        changes: { email, firstName, lastName, role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Return user without password
      const { password: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:userId/role", authMiddleware, requireAdminRole, async (req: any, res) => {
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
        userId: req.user.id,
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

  app.put("/api/admin/users/:userId/deactivate", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deactivateUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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

  app.put("/api/admin/users/:userId/activate", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.activateUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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
  app.get("/api/admin/settings", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await storage.getSiteSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.put("/api/admin/settings/:key", requireAuth, requireAdminRole, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const setting = await storage.updateSiteSetting(key, value, req.user.id);

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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

  app.post("/api/admin/settings", requireAuth, requireAdminRole, async (req: any, res) => {
    try {
      const settingData = insertSiteSettingSchema.parse({
        ...req.body,
        updatedBy: req.user.id
      });
      
      const setting = await storage.createSiteSetting(settingData);

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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
  app.get("/api/admin/audit-logs", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getAuditLogs(limit ? parseInt(limit as string) : 100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/admin/audit-logs/:userId", requireAuth, requireAdminRole, async (req, res) => {
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
  app.get("/api/admin/users/:userId/permissions", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { userId } = req.params;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/admin/users/:userId/permissions", requireAuth, requireAdminRole, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;
      
      const newPermission = await storage.grantUserPermission({
        userId,
        permission,
        grantedBy: req.user.id
      });

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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

  app.delete("/api/admin/users/:userId/permissions/:permission", requireAuth, requireAdminRole, async (req: any, res) => {
    try {
      const { userId, permission } = req.params;
      
      const success = await storage.revokeUserPermission(userId, permission);
      if (!success) {
        return res.status(404).json({ error: "Permission not found" });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
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




  // User seeding endpoint (development only)
  app.post('/api/seed-users', async (req, res) => {
    try {
      console.log("Starting user seeding process...");
      
      // Get all employees
      const employees = await storage.getAllEmployees();
      console.log(`Found ${employees.length} employees`);
      
      if (employees.length === 0) {
        return res.json({ message: "No employees found to create users for", count: 0 });
      }

      // Get existing users
      const existingUsers = await storage.getAllUsers();
      console.log(`Found ${existingUsers.length} existing users`);
      const existingEmails = new Set(existingUsers.map(user => user.email));

      let createdCount = 0;
      let skippedCount = 0;
      const createdUsers = [];
      const errors = [];

      for (const employee of employees) {
        console.log(`Processing employee: ${employee.name} (${employee.email})`);
        
        if (!employee.email) {
          console.log(`Skipping ${employee.name} - no email`);
          skippedCount++;
          continue;
        }

        if (existingEmails.has(employee.email)) {
          console.log(`Skipping ${employee.email} - user already exists`);
          skippedCount++;
          continue;
        }

        // Determine user role based on employee position
        const title = employee.title.toLowerCase();
        let role = 'user';
        
        if (title.includes('director') || 
            title.includes('manager') || 
            title.includes('lead') ||
            (title.includes('senior') && (title.includes('advisor') || title.includes('planner')))) {
          role = 'admin';
        }

        // Create user account for employee
        try {
          const userData = {
            id: `emp_${employee.id}`,
            email: employee.email,
            firstName: employee.name.split(' ')[0],
            lastName: employee.name.split(' ').slice(1).join(' ') || '',
            profileImageUrl: employee.profileImage || null,
            role: role,
            isActive: true
          };
          
          console.log(`Creating user with data:`, userData);
          const newUser = await storage.upsertUser(userData);
          console.log(`Successfully created user for ${employee.name}`);

          createdUsers.push(newUser);
          createdCount++;
        } catch (error) {
          console.error(`Failed to create user for ${employee.name}:`, error);
          errors.push({ employee: employee.name, error: error.message });
          skippedCount++;
        }
      }

      console.log(`User seeding completed: ${createdCount} created, ${skippedCount} skipped`);
      
      res.json({ 
        message: `User seeding completed: ${createdCount} created, ${skippedCount} skipped`,
        created: createdCount,
        skipped: skippedCount,
        users: createdUsers,
        errors: errors
      });
    } catch (error) {
      console.error("Error seeding users:", error);
      res.status(500).json({ 
        error: "Failed to seed users", 
        details: error.message,
        stack: error.stack 
      });
    }
  });







  // Professional skills generation based on user profile
  async function generateProfessionalSkills(user: any, employee: any) {
    const userRole = employee?.title || 'Professional';
    const userDepartment = employee?.department || 'General';
    const userExperience = employee?.experienceLevel || 'mid';
    
    // Base professional skills
    const baseSkills = [
      { name: 'Communication', endorsements: Math.floor(Math.random() * 15) + 20, category: 'Soft Skills' },
      { name: 'Problem Solving', endorsements: Math.floor(Math.random() * 12) + 15, category: 'Soft Skills' },
      { name: 'Team Collaboration', endorsements: Math.floor(Math.random() * 10) + 18, category: 'Soft Skills' },
      { name: 'Project Management', endorsements: Math.floor(Math.random() * 8) + 12, category: 'Management' },
      { name: 'Critical Thinking', endorsements: Math.floor(Math.random() * 10) + 14, category: 'Soft Skills' },
    ];

    // Department-specific skills
    const departmentSkills = getDepartmentSpecificSkills(userDepartment);
    
    // Role-specific skills
    const roleSkills = getRoleSpecificSkills(userRole, userExperience);
    
    // Combine and randomize skills
    const allSkills = [...baseSkills, ...departmentSkills, ...roleSkills];
    const uniqueSkills = allSkills.filter((skill, index, self) => 
      index === self.findIndex(s => s.name === skill.name)
    );
    
    const shuffled = uniqueSkills.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(15, shuffled.length));
  }

  function getDepartmentSpecificSkills(department: string) {
    const departmentSkillsMap: { [key: string]: any[] } = {
      'Engineering': [
        { name: 'JavaScript', endorsements: Math.floor(Math.random() * 20) + 15, category: 'Programming Languages' },
        { name: 'Python', endorsements: Math.floor(Math.random() * 15) + 12, category: 'Programming Languages' },
        { name: 'SQL', endorsements: Math.floor(Math.random() * 18) + 14, category: 'Database Management' },
        { name: 'Git', endorsements: Math.floor(Math.random() * 12) + 10, category: 'Development Tools' },
        { name: 'React', endorsements: Math.floor(Math.random() * 16) + 8, category: 'Frontend Development' },
        { name: 'Node.js', endorsements: Math.floor(Math.random() * 14) + 6, category: 'Backend Development' },
      ],
      'Design': [
        { name: 'UI/UX Design', endorsements: Math.floor(Math.random() * 25) + 20, category: 'Design' },
        { name: 'Figma', endorsements: Math.floor(Math.random() * 20) + 15, category: 'Design Tools' },
        { name: 'Adobe Creative Suite', endorsements: Math.floor(Math.random() * 18) + 12, category: 'Design Tools' },
        { name: 'Prototyping', endorsements: Math.floor(Math.random() * 15) + 10, category: 'Design Process' },
        { name: 'User Research', endorsements: Math.floor(Math.random() * 12) + 8, category: 'Research' },
      ],
      'Marketing': [
        { name: 'Digital Marketing', endorsements: Math.floor(Math.random() * 22) + 18, category: 'Marketing' },
        { name: 'Content Strategy', endorsements: Math.floor(Math.random() * 18) + 14, category: 'Content' },
        { name: 'SEO', endorsements: Math.floor(Math.random() * 16) + 12, category: 'Marketing' },
        { name: 'Google Analytics', endorsements: Math.floor(Math.random() * 14) + 10, category: 'Analytics' },
        { name: 'Social Media Marketing', endorsements: Math.floor(Math.random() * 20) + 15, category: 'Marketing' },
      ],
      'Analytics': [
        { name: 'Data Analysis', endorsements: Math.floor(Math.random() * 25) + 20, category: 'Analytics' },
        { name: 'SQL', endorsements: Math.floor(Math.random() * 22) + 18, category: 'Database Management' },
        { name: 'Python', endorsements: Math.floor(Math.random() * 18) + 15, category: 'Programming Languages' },
        { name: 'Tableau', endorsements: Math.floor(Math.random() * 16) + 12, category: 'Data Visualization' },
        { name: 'Statistical Analysis', endorsements: Math.floor(Math.random() * 14) + 10, category: 'Analytics' },
      ]
    };

    return departmentSkillsMap[department] || [];
  }

  function getRoleSpecificSkills(role: string, experience: string) {
    const roleSkills = [];
    const experienceMultiplier = experience === 'senior' ? 1.5 : experience === 'junior' ? 0.7 : 1;

    if (role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer')) {
      roleSkills.push(
        { name: 'Software Architecture', endorsements: Math.floor((Math.random() * 12 + 8) * experienceMultiplier), category: 'Engineering' },
        { name: 'Code Review', endorsements: Math.floor((Math.random() * 10 + 6) * experienceMultiplier), category: 'Engineering' },
        { name: 'Testing', endorsements: Math.floor((Math.random() * 8 + 5) * experienceMultiplier), category: 'Engineering' }
      );
    }

    if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead')) {
      roleSkills.push(
        { name: 'Team Leadership', endorsements: Math.floor((Math.random() * 15 + 12) * experienceMultiplier), category: 'Leadership' },
        { name: 'Strategic Planning', endorsements: Math.floor((Math.random() * 12 + 8) * experienceMultiplier), category: 'Management' },
        { name: 'Performance Management', endorsements: Math.floor((Math.random() * 10 + 6) * experienceMultiplier), category: 'Management' }
      );
    }

    if (role.toLowerCase().includes('analyst')) {
      roleSkills.push(
        { name: 'Data Modeling', endorsements: Math.floor((Math.random() * 14 + 10) * experienceMultiplier), category: 'Analytics' },
        { name: 'Business Intelligence', endorsements: Math.floor((Math.random() * 12 + 8) * experienceMultiplier), category: 'Analytics' },
        { name: 'Reporting', endorsements: Math.floor((Math.random() * 10 + 6) * experienceMultiplier), category: 'Analytics' }
      );
    }

    return roleSkills;
  }



  // Helper function to categorize skills
  function categorizeSkill(skill: string): string {
    const categories = {
      'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust'],
      'Frontend Technologies': ['React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'Sass', 'jQuery'],
      'Backend Technologies': ['Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET'],
      'Database Technologies': ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch'],
      'Cloud Platforms': ['AWS', 'Azure', 'Google Cloud', 'Heroku', 'Vercel'],
      'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform'],
      'Management': ['Project Management', 'Team Leadership', 'Agile', 'Scrum'],
      'Design': ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Photoshop']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        return category;
      }
    }
    return 'Other';
  }

  // Expert Directory Routes
  app.get("/api/experts", async (req, res) => {
    try {
      const { search, skill, availability, experience } = req.query;
      
      let employees = await storage.getAllEmployees();
      
      // Filter visible experts only
      employees = employees.filter(emp => emp.isExpertDirectoryVisible !== false);
      
      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        employees = employees.filter(emp => 
          emp.name.toLowerCase().includes(searchLower) ||
          emp.title.toLowerCase().includes(searchLower) ||
          emp.skills.some(s => s.toLowerCase().includes(searchLower)) ||
          (emp.bio && emp.bio.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply skill filter
      if (skill && typeof skill === 'string') {
        employees = employees.filter(emp => 
          emp.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
      }
      
      // Apply availability filter
      if (availability && typeof availability === 'string') {
        employees = employees.filter(emp => emp.availabilityStatus === availability);
      }
      
      // Apply experience filter
      if (experience && typeof experience === 'string') {
        employees = employees.filter(emp => emp.experienceLevel === experience);
      }
      
      // Add expert metadata
      const expertsWithMetadata = await Promise.all(employees.map(async (employee) => {
        const endorsements = await storage.getSkillEndorsements(employee.id);
        
        return {
          ...employee,
          totalEndorsements: endorsements.length,
          menteeCount: Math.floor(Math.random() * 5), // Placeholder for now
          responseTime: getRandomResponseTime(),
        };
      }));
      
      // Sort by total endorsements and experience
      expertsWithMetadata.sort((a, b) => {
        const experienceOrder = { Executive: 4, Senior: 3, "Mid-Level": 2, Junior: 1 };
        const aScore = (a.totalEndorsements || 0) * 10 + (experienceOrder[a.experienceLevel as keyof typeof experienceOrder] || 0);
        const bScore = (b.totalEndorsements || 0) * 10 + (experienceOrder[b.experienceLevel as keyof typeof experienceOrder] || 0);
        return bScore - aScore;
      });
      
      res.json(expertsWithMetadata);
    } catch (error) {
      console.error("Error fetching experts:", error);
      res.status(500).json({ error: "Failed to fetch experts" });
    }
  });

  app.post("/api/experts/request", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const requester = await storage.getEmployeeByUserId(userId);
      
      if (!requester) {
        return res.status(404).json({ error: "Requester profile not found" });
      }

      const validatedData = insertExpertiseRequestSchema.parse({
        ...req.body,
        requesterId: requester.id,
      });
      
      const request = await storage.createExpertiseRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating expertise request:", error);
      res.status(500).json({ error: "Failed to create expertise request" });
    }
  });

  app.get("/api/experts/requests", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const requests = await storage.getExpertiseRequestsForExpert(employee.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching expertise requests:", error);
      res.status(500).json({ error: "Failed to fetch expertise requests" });
    }
  });

  function getRandomResponseTime(): string {
    const times = ["1 hour", "2-4 hours", "same day", "1-2 days"];
    return times[Math.floor(Math.random() * times.length)];
  }

  // Admin endpoint to populate individual skill experience levels
  app.post("/api/admin/seed-skill-levels", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      console.log("Starting skill level seeding...");
      await seedEmployeeSkills();
      
      const summary = await getSkillLevelSummary();
      
      res.json({
        success: true,
        message: "Individual skill experience levels populated successfully",
        summary
      });
    } catch (error) {
      console.error("Error seeding skill levels:", error);
      res.status(500).json({ error: "Failed to seed skill levels" });
    }
  });

  // Saved skill recommendations routes
  app.post("/api/saved-skill-recommendations", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const validatedData = insertSavedSkillRecommendationSchema.parse({
        ...req.body,
        employeeId: employee.id
      });

      const savedRecommendation = await storage.saveSkillRecommendation(validatedData);
      res.json(savedRecommendation);
    } catch (error) {
      console.error("Error saving skill recommendation:", error);
      res.status(500).json({ error: "Failed to save skill recommendation" });
    }
  });

  app.get("/api/saved-skill-recommendations", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const savedRecommendations = await storage.getSavedSkillRecommendations(employee.id);
      res.json(savedRecommendations);
    } catch (error) {
      console.error("Error fetching saved skill recommendations:", error);
      res.status(500).json({ error: "Failed to fetch saved skill recommendations" });
    }
  });

  app.put("/api/saved-skill-recommendations/:id", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedRecommendation = await storage.updateSavedSkillRecommendation(parseInt(id), updates);
      
      if (!updatedRecommendation) {
        return res.status(404).json({ error: "Saved skill recommendation not found" });
      }

      res.json(updatedRecommendation);
    } catch (error) {
      console.error("Error updating saved skill recommendation:", error);
      res.status(500).json({ error: "Failed to update saved skill recommendation" });
    }
  });

  app.delete("/api/saved-skill-recommendations/:id", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSavedSkillRecommendation(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ error: "Saved skill recommendation not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved skill recommendation:", error);
      res.status(500).json({ error: "Failed to delete saved skill recommendation" });
    }
  });

  app.put("/api/saved-skill-recommendations/:id/progress", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { progressPercentage } = req.body;

      const updatedRecommendation = await storage.updateLearningProgress(parseInt(id), progressPercentage);
      
      if (!updatedRecommendation) {
        return res.status(404).json({ error: "Saved skill recommendation not found" });
      }

      res.json(updatedRecommendation);
    } catch (error) {
      console.error("Error updating learning progress:", error);
      res.status(500).json({ error: "Failed to update learning progress" });
    }
  });

  app.put("/api/saved-skill-recommendations/:id/complete", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const completedRecommendation = await storage.markSkillRecommendationComplete(parseInt(id));
      
      if (!completedRecommendation) {
        return res.status(404).json({ error: "Saved skill recommendation not found" });
      }

      res.json(completedRecommendation);
    } catch (error) {
      console.error("Error marking skill recommendation complete:", error);
      res.status(500).json({ error: "Failed to mark skill recommendation complete" });
    }
  });

  // Get skill level summary
  app.get("/api/admin/skill-levels-summary", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const summary = await getSkillLevelSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error getting skill level summary:", error);
      res.status(500).json({ error: "Failed to get skill level summary" });
    }
  });

  // Learning Path Generation with Curated Resources
  app.post("/api/learning-paths", async (req, res) => {
    try {
      const { skill, currentLevel = "beginner", targetLevel = "intermediate", context = "general" } = req.body;
      
      if (!skill) {
        return res.status(400).json({ error: "Skill name is required" });
      }

      // Check cache first
      const cachedPath = await storage.getCachedLearningPath(skill, context, currentLevel, targetLevel);
      if (cachedPath) {
        console.log(`Using cached learning path for: ${skill}`);
        // Validate and fix URLs in cached paths too
        const validatedPath = validateAndFixUrls(cachedPath.learningPathData, skill);
        return res.json(validatedPath);
      }

      let learningPath;
      let generatedBy = "curated";

      // Try OpenAI first if API key is available
      if (process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const prompt = `Generate a comprehensive learning path for acquiring "${skill}" skill in the financial services industry.

Current level: ${currentLevel || 'beginner'}
Target level: ${targetLevel || 'intermediate'}
Context: ${context || 'Professional development for financial services employee'}

CRITICAL: Use ONLY these verified URL patterns to ensure all links work:

For courses, use search URLs only:
- Coursera: https://www.coursera.org/search?query=${encodeURIComponent(skill)}
- edX: https://www.edx.org/search?q=${encodeURIComponent(skill)}
- LinkedIn Learning: https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(skill)}
- Udemy: https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}
- Pluralsight: https://www.pluralsight.com/search?q=${encodeURIComponent(skill)}
- freeCodeCamp: https://www.freecodecamp.org/learn/

For certifications, use general certification pages:
- AWS: https://aws.amazon.com/certification/
- Microsoft: https://docs.microsoft.com/learn/certifications/
- Google Cloud: https://cloud.google.com/certification
- PMI: https://www.pmi.org/certifications
- CFA Institute: https://www.cfainstitute.org/programs

DO NOT create specific course URLs like "/course/specific-course-name" as they may not exist.

Respond with JSON in this exact format:
{
  "skill": "${skill}",
  "totalDuration": "estimated time to complete",
  "difficulty": "beginner/intermediate/advanced",
  "steps": [
    {
      "title": "Step name",
      "description": "What you'll learn",
      "duration": "estimated time",
      "resources": [
        {
          "title": "Resource name",
          "type": "course/book/certification/practice",
          "provider": "Platform or publisher",
          "url": "USE ONLY THE VERIFIED URL PATTERNS ABOVE",
          "cost": "free/paid/price",
          "description": "Brief description"
        }
      ]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "provider": "Certification body",
      "url": "USE ONLY THE VERIFIED URL PATTERNS ABOVE",
      "cost": "price",
      "timeToComplete": "duration"
    }
  ],
  "practiceProjects": [
    {
      "title": "Project name",
      "description": "What to build/practice",
      "difficulty": "level"
    }
  ]
}`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an expert learning advisor for financial services professionals. Provide practical, actionable learning paths with real resources and links. Focus on legitimate educational platforms, certifications, and industry-standard materials."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          learningPath = JSON.parse(response.choices[0].message.content || '{}');
          // Validate and fix URLs to ensure they work
          learningPath = validateAndFixUrls(learningPath, skill);
          generatedBy = "openai";
          console.log(`Generated new OpenAI learning path for: ${skill}`);
        } catch (aiError: any) {
          console.error('OpenAI API error, using curated resources:', aiError);
          // Fall through to curated resources
        }
      }

      // Use curated learning resources if OpenAI failed or unavailable
      if (!learningPath) {
        learningPath = generateCuratedLearningPath(skill, currentLevel, targetLevel, context);
        // Validate and fix URLs for curated paths too
        learningPath = validateAndFixUrls(learningPath, skill);
        console.log(`Generated curated learning path for: ${skill}`);
      }

      // Cache the generated learning path
      try {
        await storage.cacheLearningPath({
          skill,
          context,
          currentLevel,
          targetLevel,
          learningPathData: learningPath,
          generatedBy
        });
        console.log(`Cached learning path for: ${skill}`);
      } catch (cacheError) {
        console.error('Failed to cache learning path:', cacheError);
        // Continue without caching
      }

      res.json(learningPath);

    } catch (error: any) {
      console.error('Error generating learning path:', error);
      res.status(500).json({ 
        error: "Failed to generate learning path",
        message: "Unable to generate learning path. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // URL validation function to ensure all links work
  function validateAndFixUrls(learningPath: any, skill: string): any {
    const fixedPath = { ...learningPath };
    
    // List of problematic URL patterns to replace
    const problematicPatterns = [
      'https://example.com',
      'machine-learning-for-all', // Known 404 from OpenAI
      'ai-in-finance', // Known 404 from OpenAI
      '/dp/1234567890', // Placeholder ISBN
      'USE ONLY THE VERIFIED URL PATTERNS ABOVE'
    ];
    
    // Fix URLs in steps
    if (fixedPath.steps) {
      fixedPath.steps = fixedPath.steps.map((step: any) => {
        if (step.resources) {
          step.resources = step.resources.map((resource: any) => {
            let needsReplacement = false;
            
            // Check if URL contains problematic patterns
            if (resource.url) {
              for (const pattern of problematicPatterns) {
                if (resource.url.includes(pattern)) {
                  needsReplacement = true;
                  break;
                }
              }
            }
            
            if (needsReplacement || !resource.url) {
              // Generate appropriate search URL based on provider
              if (resource.provider && resource.provider.toLowerCase().includes('coursera')) {
                resource.url = `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`;
              } else if (resource.provider && resource.provider.toLowerCase().includes('edx')) {
                resource.url = `https://www.edx.org/search?q=${encodeURIComponent(skill)}`;
              } else if (resource.provider && resource.provider.toLowerCase().includes('linkedin')) {
                resource.url = `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(skill)}`;
              } else if (resource.provider && resource.provider.toLowerCase().includes('udemy')) {
                resource.url = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`;
              } else if (resource.provider && resource.provider.toLowerCase().includes('pluralsight')) {
                resource.url = `https://www.pluralsight.com/search?q=${encodeURIComponent(skill)}`;
              } else if (resource.provider && resource.provider.toLowerCase().includes('freecodecamp')) {
                resource.url = 'https://www.freecodecamp.org/learn/';
              } else {
                // Default to Google search for unknown providers
                resource.url = `https://www.google.com/search?q=${encodeURIComponent(skill + ' course ' + (resource.provider || ''))}`;
              }
            }
            return resource;
          });
        }
        return step;
      });
    }
    
    // Fix URLs in certifications
    if (fixedPath.certifications) {
      fixedPath.certifications = fixedPath.certifications.map((cert: any) => {
        let needsReplacement = false;
        
        if (cert.url) {
          for (const pattern of problematicPatterns) {
            if (cert.url.includes(pattern)) {
              needsReplacement = true;
              break;
            }
          }
        }
        
        if (needsReplacement || !cert.url) {
          if (cert.provider && cert.provider.toLowerCase().includes('aws')) {
            cert.url = 'https://aws.amazon.com/certification/';
          } else if (cert.provider && cert.provider.toLowerCase().includes('microsoft')) {
            cert.url = 'https://docs.microsoft.com/learn/certifications/';
          } else if (cert.provider && cert.provider.toLowerCase().includes('google')) {
            cert.url = 'https://cloud.google.com/certification';
          } else if (cert.provider && cert.provider.toLowerCase().includes('ibm')) {
            cert.url = 'https://www.ibm.com/certify/';
          } else {
            cert.url = `https://www.google.com/search?q=${encodeURIComponent((cert.name || skill) + ' certification')}`;
          }
        }
        return cert;
      });
    }
    
    return fixedPath;
  }

  function generateCuratedLearningPath(skill: string, currentLevel?: string, targetLevel?: string, context?: string) {
    const skillLower = skill.toLowerCase();
    
    // Common financial services skills with curated resources
    const skillPaths: { [key: string]: any } = {
      'python': {
        skill: "Python",
        totalDuration: "8-12 weeks",
        difficulty: "progressive",
        steps: [
          {
            title: "Python Fundamentals",
            description: "Learn Python syntax and basic programming concepts",
            duration: "3-4 weeks",
            resources: [
              {
                title: "Python for Everybody Specialization",
                type: "course",
                provider: "Coursera (University of Michigan)",
                url: "https://www.coursera.org/specializations/python",
                cost: "Free audit, $49/month certificate",
                description: "Comprehensive Python course for beginners"
              },
              {
                title: "Learn Python Programming",
                type: "course",
                provider: "edX",
                url: "https://www.edx.org/search?q=python",
                cost: "Free audit, $99 certificate",
                description: "University-level Python programming courses"
              }
            ]
          }
        ],
        certifications: [
          {
            name: "Python Institute PCEP",
            provider: "Python Institute",
            url: "https://pythoninstitute.org/pcep",
            cost: "$59",
            timeToComplete: "2-4 weeks"
          }
        ],
        practiceProjects: [
          {
            title: "Portfolio Risk Calculator",
            description: "Build a Python tool for financial risk analysis",
            difficulty: "intermediate"
          }
        ]
      },
      'sql': {
        skill: "SQL",
        totalDuration: "6-8 weeks", 
        difficulty: "progressive",
        steps: [
          {
            title: "SQL Fundamentals",
            description: "Master database queries and data manipulation",
            duration: "3-4 weeks",
            resources: [
              {
                title: "SQL for Data Science",
                type: "course",
                provider: "Coursera (UC Davis)",
                url: "https://www.coursera.org/learn/sql-for-data-science",
                cost: "Free audit, $49/month certificate",
                description: "Learn SQL with practical applications"
              },
              {
                title: "SQL Essential Training",
                type: "course",
                provider: "LinkedIn Learning",
                url: "https://www.linkedin.com/learning/search?keywords=sql",
                cost: "$29.99/month",
                description: "Professional SQL training courses"
              }
            ]
          }
        ],
        certifications: [
          {
            name: "Microsoft Azure Database Administrator",
            provider: "Microsoft",
            url: "https://docs.microsoft.com/learn/certifications/azure-database-administrator-associate/",
            cost: "$165",
            timeToComplete: "4-8 weeks"
          }
        ],
        practiceProjects: [
          {
            title: "Financial Reports Dashboard",
            description: "Create SQL queries for financial reporting",
            difficulty: "intermediate"
          }
        ]
      },
      'javascript': {
        skill: "JavaScript",
        totalDuration: "10-14 weeks",
        difficulty: "progressive",
        steps: [
          {
            title: "JavaScript Fundamentals",
            description: "Learn modern JavaScript programming",
            duration: "4-6 weeks",
            resources: [
              {
                title: "JavaScript Algorithms and Data Structures",
                type: "course",
                provider: "freeCodeCamp",
                url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
                cost: "Free",
                description: "Comprehensive JavaScript course with projects"
              },
              {
                title: "The Complete JavaScript Course",
                type: "course",
                provider: "Udemy",
                url: "https://www.udemy.com/courses/search/?q=javascript",
                cost: "$50-200",
                description: "Professional JavaScript development course"
              }
            ]
          }
        ],
        certifications: [
          {
            name: "JavaScript Developer Certification",
            provider: "W3Schools",
            url: "https://www.w3schools.com/cert/cert_javascript.asp",
            cost: "$95",
            timeToComplete: "2-4 weeks"
          }
        ],
        practiceProjects: [
          {
            title: "Financial Calculator Web App",
            description: "Build a modern web application for financial calculations",
            difficulty: "intermediate"
          }
        ]
      }
    };

    // Default path for any skill
    const defaultPath = {
      skill: skill,
      totalDuration: "6-10 weeks",
      difficulty: "progressive", 
      steps: [
        {
          title: `${skill} Fundamentals`,
          description: `Learn core ${skill} concepts and applications`,
          duration: "3-5 weeks",
          resources: [
            {
              title: `${skill} Professional Course`,
              type: "course",
              provider: "LinkedIn Learning",
              url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(skill)}`,
              cost: "$29.99/month",
              description: `Professional ${skill} training course`
            },
            {
              title: `${skill} Fundamentals on Coursera`,
              type: "course",
              provider: "Coursera",
              url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
              cost: "Free audit, $49/month certificate",
              description: `University-level ${skill} courses`
            }
          ]
        }
      ],
      certifications: [
        {
          name: `${skill} Certification`,
          provider: "Professional Bodies",
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' certification')}`,
          cost: "Varies",
          timeToComplete: "4-12 weeks"
        }
      ],
      practiceProjects: [
        {
          title: `${skill} Portfolio Project`,
          description: `Demonstrate ${skill} expertise through practical application`,
          difficulty: targetLevel || "intermediate"
        }
      ]
    };

    return skillPaths[skillLower] || defaultPath;
  }

  // =====================
  // PROFESSIONAL SERVICES MARKETPLACE ENDPOINTS
  // =====================

  // Service Categories Management
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getAllServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ error: "Failed to fetch service categories" });
    }
  });

  app.post("/api/admin/service-categories", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      
      // Log admin action
      await storage.createAuditLog({
        userId,
        action: "service_category_created",
        targetType: "service_category",
        targetId: category.id.toString(),
        changes: { created: validatedData },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating service category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service category" });
      }
    }
  });

  app.patch("/api/admin/service-categories/:id", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const id = parseInt(req.params.id);
      const existingCategory = await storage.getServiceCategory(id);
      
      if (!existingCategory) {
        return res.status(404).json({ error: "Service category not found" });
      }

      const updateData = req.body;
      const category = await storage.updateServiceCategory(id, updateData);
      
      // Log admin action
      await storage.createAuditLog({
        userId,
        action: "service_category_updated",
        targetType: "service_category",
        targetId: id.toString(),
        changes: { before: existingCategory, after: updateData },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating service category:", error);
      res.status(500).json({ error: "Failed to update service category" });
    }
  });

  app.delete("/api/admin/service-categories/:id", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const id = parseInt(req.params.id);
      const existingCategory = await storage.getServiceCategory(id);
      
      if (!existingCategory) {
        return res.status(404).json({ error: "Service category not found" });
      }

      // Check if category is in use
      const servicesUsingCategory = await storage.getServicesByCategory(id);
      if (servicesUsingCategory.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category that is in use", 
          servicesCount: servicesUsingCategory.length 
        });
      }

      await storage.deleteServiceCategory(id);
      
      // Log admin action
      await storage.createAuditLog({
        userId,
        action: "service_category_deleted",
        targetType: "service_category",
        targetId: id.toString(),
        changes: { deleted: existingCategory },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service category:", error);
      res.status(500).json({ error: "Failed to delete service category" });
    }
  });

  app.post("/api/service-categories", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating service category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service category" });
      }
    }
  });

  // Professional Services Management
  app.get("/api/professional-services", async (req, res) => {
    try {
      const { search, categoryId, skills, providerId } = req.query;
      const parsedCategoryId = categoryId ? parseInt(categoryId as string) : undefined;
      const parsedSkills = skills ? (skills as string).split(',') : undefined;
      const parsedProviderId = providerId ? parseInt(providerId as string) : undefined;
      
      // If providerId is specified, get services by provider
      if (parsedProviderId) {
        const services = await storage.getProfessionalServicesByProvider(parsedProviderId);
        res.json(services);
        return;
      }
      
      const services = await storage.searchProfessionalServices(
        search as string, 
        parsedCategoryId, 
        parsedSkills
      );
      res.json(services);
    } catch (error) {
      console.error("Error fetching professional services:", error);
      res.status(500).json({ error: "Failed to fetch professional services" });
    }
  });

  app.get("/api/professional-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getProfessionalService(id);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error fetching professional service:", error);
      res.status(500).json({ error: "Failed to fetch professional service" });
    }
  });

  app.post("/api/professional-services", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const validatedData = insertProfessionalServiceSchema.parse({
        ...req.body,
        providerId: employee.id
      });
      
      const service = await storage.createProfessionalService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating professional service:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid service data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create professional service" });
      }
    }
  });

  app.patch("/api/professional-services/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if service exists and belongs to the user
      const existingService = await storage.getProfessionalService(id);
      if (!existingService) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      if (existingService.providerId !== employee.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateData = { ...req.body };
      delete updateData.providerId; // Prevent changing provider
      
      const service = await storage.updateProfessionalService(id, updateData);
      res.json(service);
    } catch (error) {
      console.error("Error updating professional service:", error);
      res.status(500).json({ error: "Failed to update professional service" });
    }
  });

  app.delete("/api/professional-services/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if service exists and belongs to the user
      const existingService = await storage.getProfessionalService(id);
      if (!existingService) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      if (existingService.providerId !== employee.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const success = await storage.deleteProfessionalService(id);
      if (success) {
        res.json({ message: "Service deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete service" });
      }
    } catch (error) {
      console.error("Error deleting professional service:", error);
      res.status(500).json({ error: "Failed to delete professional service" });
    }
  });

  // Get user's own services
  app.get("/api/my-services", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const services = await storage.getProfessionalServicesByProvider(employee.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching user services:", error);
      res.status(500).json({ error: "Failed to fetch user services" });
    }
  });

  // Service Bookings Management
  app.post("/api/service-bookings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const validatedData = insertServiceBookingSchema.parse({
        ...req.body,
        clientId: employee.id
      });
      
      const booking = await storage.createServiceBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating service booking:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid booking data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service booking" });
      }
    }
  });

  app.get("/api/my-bookings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const { type } = req.query;
      let bookings;
      
      if (type === 'client') {
        bookings = await storage.getServiceBookingsByClient(employee.id);
      } else if (type === 'provider') {
        bookings = await storage.getServiceBookingsByProvider(employee.id);
      } else {
        // Get both client and provider bookings
        const [clientBookings, providerBookings] = await Promise.all([
          storage.getServiceBookingsByClient(employee.id),
          storage.getServiceBookingsByProvider(employee.id)
        ]);
        bookings = {
          clientBookings,
          providerBookings
        };
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ error: "Failed to fetch user bookings" });
    }
  });

  app.patch("/api/service-bookings/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if booking exists and user has access (client or provider)
      const existingBooking = await storage.getServiceBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (existingBooking.clientId !== employee.id && existingBooking.providerId !== employee.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateData = { ...req.body };
      // Prevent changing core booking details
      delete updateData.clientId;
      delete updateData.providerId;
      delete updateData.serviceId;
      
      const booking = await storage.updateServiceBooking(id, updateData);
      res.json(booking);
    } catch (error) {
      console.error("Error updating service booking:", error);
      res.status(500).json({ error: "Failed to update service booking" });
    }
  });

  // Service Reviews Management
  app.post("/api/service-reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const validatedData = insertServiceReviewSchema.parse({
        ...req.body,
        reviewerId: employee.id
      });
      
      const review = await storage.createServiceReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating service review:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid review data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service review" });
      }
    }
  });

  app.get("/api/professional-services/:serviceId/reviews", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const reviews = await storage.getServiceReviews(serviceId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching service reviews:", error);
      res.status(500).json({ error: "Failed to fetch service reviews" });
    }
  });

  // Service Portfolios Management
  app.post("/api/service-portfolios", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const validatedData = insertServicePortfolioSchema.parse({
        ...req.body,
        providerId: employee.id
      });
      
      const portfolio = await storage.createServicePortfolio(validatedData);
      res.status(201).json(portfolio);
    } catch (error) {
      console.error("Error creating service portfolio:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid portfolio data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service portfolio" });
      }
    }
  });

  app.get("/api/professional-services/:serviceId/portfolios", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const portfolios = await storage.getServicePortfolios(serviceId);
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching service portfolios:", error);
      res.status(500).json({ error: "Failed to fetch service portfolios" });
    }
  });

  app.get("/api/my-portfolios", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const portfolios = await storage.getServicePortfoliosByProvider(employee.id);
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching user portfolios:", error);
      res.status(500).json({ error: "Failed to fetch user portfolios" });
    }
  });

  app.patch("/api/service-portfolios/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const updateData = { ...req.body };
      delete updateData.providerId; // Prevent changing provider
      
      const portfolio = await storage.updateServicePortfolio(id, updateData);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error updating service portfolio:", error);
      res.status(500).json({ error: "Failed to update service portfolio" });
    }
  });

  app.delete("/api/service-portfolios/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServicePortfolio(id);
      
      if (success) {
        res.json({ message: "Portfolio deleted successfully" });
      } else {
        res.status(404).json({ error: "Portfolio not found" });
      }
    } catch (error) {
      console.error("Error deleting service portfolio:", error);
      res.status(500).json({ error: "Failed to delete service portfolio" });
    }
  });

  // Service category management endpoints
  app.get("/api/admin/service-categories", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {

      const categories = await storage.getAllServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ error: "Failed to fetch service categories" });
    }
  });

  app.post("/api/admin/service-categories", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const categoryData = req.body;
      const category = await storage.createServiceCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating service category:", error);
      res.status(500).json({ error: "Failed to create service category" });
    }
  });

  app.patch("/api/admin/service-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateServiceCategory(parseInt(id), updates);
      
      if (!category) {
        return res.status(404).json({ error: "Service category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error updating service category:", error);
      res.status(500).json({ error: "Failed to update service category" });
    }
  });

  app.delete("/api/admin/service-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteServiceCategory(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ error: "Service category not found or in use" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service category:", error);
      if (error.message && error.message.includes('in use')) {
        res.status(400).json({ error: "Cannot delete category that is in use by services" });
      } else {
        res.status(500).json({ error: "Failed to delete service category" });
      }
    }
  });

  // Team Management Routes
  
  // Get all teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get teams by member
  app.get("/api/teams/member/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const teams = await storage.getTeamsByMember(employeeId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams by member:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get available teams for user to join (must come before /api/teams/:id)
  app.get("/api/teams/available", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }
      
      const allTeams = await storage.getAllTeams();
      const userTeams = await storage.getEmployeeTeams(employee.id);
      
      const userTeamIds = userTeams.map(t => t.id);
      
      // Filter out teams user is already a member of
      const availableTeams = allTeams.filter(team => !userTeamIds.includes(team.id));
      res.json(availableTeams);
    } catch (error) {
      console.error("Error fetching available teams:", error);
      res.status(500).json({ error: "Failed to fetch available teams" });
    }
  });

  // Get team details
  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Get team members with employee details
      const members = await storage.getTeamMembers(id);
      const teamServices = await storage.getProfessionalServicesByTeam(id);
      const serviceCategories = await storage.getTeamServiceCategories(id);
      
      res.json({
        ...team,
        members,
        services: teamServices,
        serviceCategories
      });
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // Create team (Admin only)
  app.post("/api/teams", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertTeamSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid team data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create team" });
      }
    }
  });

  // Update team (Admin or Team Leader)
  app.put("/api/teams/:id", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const user = await storage.getUser(req.user.id);
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if user is admin or team leader
      let hasPermission = user?.role === 'admin';
      if (!hasPermission) {
        const teamMembers = await storage.getTeamMembers(teamId);
        const userMembership = teamMembers.find(m => m.employeeId === employee.id);
        hasPermission = userMembership?.role === 'leader';
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Admin or team leader access required" });
      }

      const validatedData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(teamId, validatedData);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid team data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update team" });
      }
    }
  });

  // Join team (request membership)
  app.post("/api/teams/:id/join", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const memberData = {
        teamId,
        employeeId: employee.id,
        role: 'member',
        isActive: false // Requires approval
      };
      
      const member = await storage.addTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  // Approve team member (Admin or Team Leader)
  app.post("/api/teams/:teamId/members/:employeeId/approve", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const user = await storage.getUser(req.user.id);
      const approver = await storage.getEmployeeByUserId(req.user.id);
      
      if (!approver) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if user is admin or team leader
      let hasPermission = user?.role === 'admin';
      if (!hasPermission) {
        const teamMembers = await storage.getTeamMembers(teamId);
        const userMembership = teamMembers.find(m => m.employeeId === approver.id);
        hasPermission = userMembership?.role === 'leader';
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Admin or team leader access required" });
      }

      const member = await storage.approveTeamMember(teamId, employeeId, approver.id);
      
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error approving team member:", error);
      res.status(500).json({ error: "Failed to approve team member" });
    }
  });

  // Update team member role (Admin or Team Leader)
  app.put("/api/teams/:teamId/members/:employeeId/role", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const { role } = req.body;
      const user = await storage.getUser(req.user.id);
      const updater = await storage.getEmployeeByUserId(req.user.id);
      
      if (!updater) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if user is admin or team leader
      let hasPermission = user?.role === 'admin';
      if (!hasPermission) {
        const teamMembers = await storage.getTeamMembers(teamId);
        const userMembership = teamMembers.find(m => m.employeeId === updater.id);
        hasPermission = userMembership?.role === 'leader';
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Admin or team leader access required" });
      }

      const member = await storage.updateTeamMemberRole(teamId, employeeId, role);
      
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ error: "Failed to update team member role" });
    }
  });

  // Remove team member
  app.delete("/api/teams/:teamId/members/:employeeId", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const user = await storage.getUser(req.user.id);
      const remover = await storage.getEmployeeByUserId(req.user.id);
      
      if (!remover) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if user is admin, team leader, or removing themselves
      let hasPermission = user?.role === 'admin' || remover.id === employeeId;
      if (!hasPermission) {
        const teamMembers = await storage.getTeamMembers(teamId);
        const userMembership = teamMembers.find(m => m.employeeId === remover.id);
        hasPermission = userMembership?.role === 'leader';
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Admin, team leader access, or self-removal required" });
      }

      const success = await storage.removeTeamMember(teamId, employeeId);
      
      if (!success) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Admin team management routes
  app.get("/api/admin/teams", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const teams = await storage.getAllTeamsWithMemberCount();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get team members for editing
  app.get("/api/admin/teams/:teamId/members", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Update team member role (Admin version)
  app.put("/api/admin/teams/:teamId/members/:employeeId/role", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const { role } = req.body;
      
      // Validate role
      if (!['member', 'manager'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'member' or 'manager'" });
      }

      // Update team member role
      const updated = await storage.updateTeamMemberRole(teamId, employeeId, role);
      
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json({ message: "Team member role updated successfully", role });
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ error: "Failed to update team member role" });
    }
  });

  // ==================== TEAM MANAGER ROUTES ====================
  // These routes allow team managers to manage their own teams

  // Get teams managed by current user
  app.get("/api/team-manager/my-teams", authMiddleware, requireTeamManagerOrAdmin, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Get all teams where user is a manager
      const allTeams = await storage.getAllTeams();
      const managedTeams = [];
      
      for (const team of allTeams) {
        const isManager = await storage.isTeamManager(team.id, employee.id);
        if (isManager || req.user.role === 'admin') {
          const members = await storage.getTeamMembers(team.id);
          managedTeams.push({
            ...team,
            memberCount: members.length
          });
        }
      }

      res.json(managedTeams);
    } catch (error) {
      console.error("Error fetching managed teams:", error);
      res.status(500).json({ error: "Failed to fetch managed teams" });
    }
  });

  // Get team details for team manager
  app.get("/api/team-manager/teams/:teamId", authMiddleware, requireTeamManagerAccess, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const members = await storage.getTeamMembers(teamId);
      res.json({ ...team, members });
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ error: "Failed to fetch team details" });
    }
  });

  // Update team details (team managers)
  app.put("/api/team-manager/teams/:teamId", authMiddleware, requireTeamManagerAccess, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { name, description, expertiseAreas = [], visibility = 'public' } = req.body;

      if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required" });
      }

      const updatedTeam = await storage.updateTeam(teamId, {
        name,
        description,
        expertiseAreas,
        visibility
      });

      if (!updatedTeam) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  // Get team members (team managers)
  app.get("/api/team-manager/teams/:teamId/members", authMiddleware, requireTeamManagerAccess, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Add team member (team managers)
  app.post("/api/team-manager/teams/:teamId/members", authMiddleware, requireTeamManagerAccess, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { employeeId, role = 'member' } = req.body;

      const success = await storage.addTeamMember(teamId, employeeId, role);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to add team member" });
      }

      res.json({ message: "Team member added successfully" });
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ error: "Failed to add team member" });
    }
  });

  // Update team member role (team managers)
  app.put("/api/team-manager/teams/:teamId/members/:employeeId/role", authMiddleware, requireTeamManagerAccess, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const { role } = req.body;
      
      // Validate role
      if (!['member', 'manager'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'member' or 'manager'" });
      }

      // Update team member role
      const updated = await storage.updateTeamMemberRole(teamId, employeeId, role);
      
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json({ message: "Team member role updated successfully", role });
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ error: "Failed to update team member role" });
    }
  });

  // Remove team member (team managers)
  app.delete("/api/team-manager/teams/:teamId/members/:employeeId", authMiddleware, requireTeamManagerAccess, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);

      const success = await storage.removeTeamMember(teamId, employeeId);
      
      if (!success) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Admin: Create employee profile for any user
  app.post("/api/admin/employees", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const { userId, ...employeeData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if employee profile already exists
      const existingEmployee = await storage.getEmployeeByUserId(userId);
      if (existingEmployee) {
        return res.status(400).json({ error: "Employee profile already exists for this user" });
      }

      // Create employee profile with provided data
      const newEmployeeData = {
        ...employeeData,
        userId: userId,
        name: employeeData.name || `${user.firstName} ${user.lastName}`,
        email: employeeData.email || user.email
      };

      const employee = await storage.createEmployee(newEmployeeData);
      
      if (!employee) {
        return res.status(500).json({ error: "Failed to create employee profile" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error creating employee profile:", error);
      res.status(500).json({ error: "Failed to create employee profile" });
    }
  });

  // Get all users for team member selection
  app.get("/api/admin/all-users-for-teams", authMiddleware, requireAdminRole, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const employees = await storage.getAllEmployees();
      
      // Create a map of userId to employee data
      const employeeByUserId = new Map();
      employees.forEach(emp => {
        employeeByUserId.set(emp.userId, emp);
      });
      
      // Combine user and employee data
      const usersForTeams = users.map(user => {
        const employee = employeeByUserId.get(user.id);
        return {
          id: employee ? employee.id : user.id, // Use employee ID if exists, otherwise user ID
          userId: user.id,
          name: employee ? employee.name : `${user.firstName} ${user.lastName}`,
          email: user.email,
          title: employee ? employee.title : 'User', // Default title if no employee profile
          skills: employee ? employee.skills || [] : [],
          hasEmployeeProfile: !!employee
        };
      });
      
      res.json(usersForTeams);
    } catch (error) {
      console.error("Error fetching users for teams:", error);
      res.status(500).json({ error: "Failed to fetch users for teams" });
    }
  });

  // Update team (Admin only)  
  app.put("/api/admin/teams/:id", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { name, description, expertiseAreas = [], visibility = 'public', members = [] } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({ error: "Team name and description are required" });
      }

      // Update team
      const updatedTeam = await storage.updateTeam(teamId, {
        name,
        description,
        specialties: expertiseAreas
      });

      if (!updatedTeam) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Update team members if provided
      if (members && members.length >= 0) {
        // Get current team members
        const currentMembers = await storage.getTeamMembers(teamId);
        const currentMemberIds = currentMembers.map(m => m.employeeId);
        
        // Remove members not in the new list
        for (const memberId of currentMemberIds) {
          if (!members.includes(memberId)) {
            await storage.removeTeamMember(teamId, memberId);
          }
        }
        
        // Add new members - but only if they have employee profiles
        for (const memberId of members) {
          if (memberId === null || memberId === undefined) {
            console.warn("Skipping null/undefined member ID");
            continue;
          }
          
          if (!currentMemberIds.includes(memberId)) {
            // Check if this ID corresponds to an employee
            const employee = await storage.getEmployee(memberId);
            if (employee) {
              // Add team member directly with explicit values for admin
              await db
                .insert(teamMembers)
                .values({
                  teamId: teamId,
                  employeeId: memberId,
                  role: 'member',
                  isActive: true
                });
            } else {
              console.warn(`Skipping user ID ${memberId} - no employee profile found`);
            }
          }
        }
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
        action: "team_updated",
        targetType: "team",
        targetId: teamId.toString(),
        changes: { name, description, expertiseAreas, visibility, members },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  // Create new team (Admin only)
  app.post("/api/admin/teams", authMiddleware, requireAdminRole, async (req: any, res) => {
    try {
      const { name, description, expertiseAreas = [], visibility = 'public', members = [] } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({ error: "Team name and description are required" });
      }

      // Create team
      const team = await storage.createTeam({
        name,
        description,
        specialties: expertiseAreas,
        createdBy: req.user.id.toString()
      });

      // Add members to team if provided
      if (members && Array.isArray(members) && members.length > 0) {
        for (const employeeId of members) {
          try {
            // Add team member directly with explicit values for admin
            await db
              .insert(teamMembers)
              .values({
                teamId: team.id,
                employeeId: employeeId,
                role: "member",
                isActive: true
              });
          } catch (memberError) {
            console.error(`Error adding member ${employeeId} to team:`, memberError);
            // Continue adding other members even if one fails
          }
        }
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.id,
        action: "team_created",
        targetType: "team",
        targetId: team.id.toString(),
        changes: { name, description, expertiseAreas, visibility, memberCount: members.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Team Service Categories
  
  // Get team service categories
  app.get("/api/teams/:id/service-categories", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const categories = await storage.getTeamServiceCategories(teamId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching team service categories:", error);
      res.status(500).json({ error: "Failed to fetch team service categories" });
    }
  });

  // Create team service category (Team Leader or Admin)
  app.post("/api/teams/:id/service-categories", authMiddleware, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const user = await storage.getUser(req.user.id);
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Check if user is admin or team leader
      let hasPermission = user?.role === 'admin';
      if (!hasPermission) {
        const teamMembers = await storage.getTeamMembers(teamId);
        const userMembership = teamMembers.find(m => m.employeeId === employee.id);
        hasPermission = userMembership?.role === 'leader';
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Admin or team leader access required" });
      }

      const validatedData = insertTeamServiceCategorySchema.parse({
        ...req.body,
        teamId
      });
      
      const category = await storage.createTeamServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating team service category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create team service category" });
      }
    }
  });

  // Get team services
  app.get("/api/teams/:id/services", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const services = await storage.getProfessionalServicesByTeam(teamId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching team services:", error);
      res.status(500).json({ error: "Failed to fetch team services" });
    }
  });

  // Team management endpoints for team managers
  app.get("/api/team-manager/my-teams", requireTeamManagerOrAdmin, async (req, res) => {
    try {
      const teams = await storage.getUserTeams(req.user.id.toString());
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/team-manager/team/:teamId/members", requireTeamManagerOrAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      // Check if user is manager of this team or admin
      if (req.user.role !== "admin") {
        const isManager = await storage.isTeamManager(req.user.id.toString(), teamId);
        if (!isManager) {
          return res.status(403).json({ error: "Not authorized to manage this team" });
        }
      }

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.put("/api/team-manager/team/:teamId/member/:employeeId/role", requireTeamManagerOrAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      const { role } = req.body;

      if (!["member", "leader"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'member' or 'leader'" });
      }

      // Check if user is manager of this team or admin
      if (req.user.role !== "admin") {
        const isManager = await storage.isTeamManager(req.user.id.toString(), teamId);
        if (!isManager) {
          return res.status(403).json({ error: "Not authorized to manage this team" });
        }
      }

      const success = await storage.updateTeamMemberRole(teamId, employeeId, role);
      if (success) {
        
        // Log admin action
        await storage.createAuditLog({
          userId: req.user.id.toString(),
          action: "UPDATE_TEAM_MEMBER_ROLE",
          resource: `team:${teamId}:member:${employeeId}`,
          details: { newRole: role },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "unknown"
        });

        res.json({ message: "Team member role updated successfully" });
      } else {
        res.status(500).json({ error: "Failed to update team member role" });
      }
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ error: "Failed to update team member role" });
    }
  });

  app.delete("/api/team-manager/team/:teamId/member/:employeeId", requireTeamManagerOrAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);

      // Check if user is manager of this team or admin
      if (req.user.role !== "admin") {
        const isManager = await storage.isTeamManager(req.user.id.toString(), teamId);
        if (!isManager) {
          return res.status(403).json({ error: "Not authorized to manage this team" });
        }
      }

      const success = await storage.removeTeamMember(teamId, employeeId);
      if (success) {
        
        // Log admin action
        await storage.createAuditLog({
          userId: req.user.id.toString(),
          action: "REMOVE_TEAM_MEMBER",
          resource: `team:${teamId}:member:${employeeId}`,
          details: {},
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "unknown"
        });

        res.json({ message: "Team member removed successfully" });
      } else {
        res.status(500).json({ error: "Failed to remove team member" });
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // User team management endpoints
  app.get("/api/users/my-teams", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }
      
      const teams = await storage.getEmployeeTeams(employee.id);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/:teamId/join", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      // Add team member directly with explicit values
      const [newMember] = await db
        .insert(teamMembers)
        .values({
          teamId: teamId,
          employeeId: employee.id,
          role: 'member',
          isActive: true
        })
        .returning();
      
      if (newMember) {
        res.json({ message: "Successfully joined team" });
      } else {
        res.status(500).json({ error: "Failed to join team" });
      }
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.delete("/api/teams/:teamId/leave", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee profile not found" });
      }

      const success = await storage.removeTeamMember(teamId, employee.id);
      if (success) {
        res.json({ message: "Successfully left team" });
      } else {
        res.status(500).json({ error: "Failed to leave team" });
      }
    } catch (error) {
      console.error("Error leaving team:", error);
      res.status(500).json({ error: "Failed to leave team" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
