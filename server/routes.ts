import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertSkillEndorsementSchema, insertProjectSchema, insertSiteSettingSchema, insertAuditLogSchema, insertUserPermissionSchema, insertDepartmentSchema } from "@shared/schema";
import { sendEmail } from "./sendgrid";
import { getProjectRecommendationsForEmployee, getEmployeeRecommendationsForProject, getSkillGapAnalysis } from "./ai-recommendations";
import { getProjectRecommendationsForEmployee as getSkillBasedProjectRecs, getEmployeeRecommendationsForProject as getSkillBasedEmployeeRecs } from "./skill-matching";
import { seedEmployeeSkills, getSkillLevelSummary } from "./seed-employee-skills";
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

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Employee creation request body:", req.body);
      const validatedData = insertEmployeeSchema.parse(req.body);
      console.log("Validated employee data:", validatedData);
      
      // Add userId from authenticated user
      const employeeData = {
        ...validatedData,
        userId: req.user.claims.sub
      };
      
      // Check if employee already exists for this user
      const existingEmployee = await storage.getEmployeeByUserId(req.user.claims.sub);
      
      if (existingEmployee) {
        // Update existing employee
        const updatedEmployee = await storage.updateEmployee(existingEmployee.id, employeeData);
        res.json(updatedEmployee);
      } else {
        // Create new employee
        const employee = await storage.createEmployee(employeeData);
        res.status(201).json(employee);
      }
    } catch (error) {
      console.error("Employee creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
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

  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Add userId from authenticated user
      const employeeData = {
        ...validatedData,
        userId: req.user.claims.sub
      };
      
      const employee = await storage.updateEmployee(id, employeeData);
      
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
      
      const allSkills = employees.flatMap(e => e.skills);
      const uniqueSkills = Array.from(new Set(allSkills));
      
      const stats = {
        activeUsers: employees.length,
        skillsRegistered: uniqueSkills.length,
        successfulMatches: Math.floor(employees.length * 0.7), // Simulated
        projectsCompleted: Math.floor(employees.length * 0.2) // Simulated
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
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

  app.post("/api/employees/:id/skills", isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      // Verify user can only add skills to their own profile
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      const currentEmployee = await storage.getEmployeeByUserId(userId);
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return res.status(403).json({ error: "Cannot add skills to another user's profile" });
      }

      if (!req.body.skillName || !req.body.skillName.trim()) {
        return res.status(400).json({ error: "Skill name is required" });
      }

      const skillData = {
        employeeId,
        skillName: req.body.skillName.trim(),
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

  app.put("/api/employees/:id/skills/:skillId", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/employees/:id/skills/:skillId", isAuthenticated, async (req: any, res) => {
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

  // Department management routes
  app.get('/api/admin/departments', isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post('/api/admin/departments', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      const department = await storage.createDepartment(departmentData);

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: 'department_created',
        targetType: 'department',
        targetId: department.id.toString(),
        changes: { name: department.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  app.put('/api/admin/departments/:id', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { id } = req.params;
      const departmentData = insertDepartmentSchema.partial().parse(req.body);

      const department = await storage.updateDepartment(parseInt(id), departmentData);

      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: 'department_updated',
        targetType: 'department',
        targetId: id,
        changes: departmentData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  app.delete('/api/admin/departments/:id', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDepartment(parseInt(id));

      if (!success) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: 'department_deleted',
        targetType: 'department',
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  app.patch('/api/admin/departments/:id/toggle-status', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      let success = false;
      if (isActive) {
        success = await storage.activateDepartment(parseInt(id));
      } else {
        success = await storage.deactivateDepartment(parseInt(id));
      }

      if (!success) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        userId: req.user.claims.sub,
        action: isActive ? 'department_activated' : 'department_deactivated',
        targetType: 'department',
        targetId: id,
        changes: { isActive },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating department status:", error);
      res.status(500).json({ error: "Failed to update department status" });
    }
  });

  // Seeding endpoint for departments (development only)
  app.post('/api/seed-departments', async (req, res) => {
    try {
      const existingDepartments = [
        "Engineering",
        "Analytics", 
        "Design",
        "Marketing",
        "Sales",
        "HR",
        "Finance",
        "Operations",
        "Product",
        "Legal",
        "Wealth Management",
        "Tax Services",
        "Investment Management",
        "Financial Planning",
        "Retirement Services",
        "Administration",
        "Client Services",
        "Human Resources"
      ];

      const departmentData = [
        { name: "Engineering", description: "Software development, DevOps, and technical infrastructure" },
        { name: "Analytics", description: "Data analysis, business intelligence, and reporting" },
        { name: "Design", description: "UI/UX design, graphic design, and creative services" },
        { name: "Marketing", description: "Digital marketing, content creation, and brand management" },
        { name: "Sales", description: "Business development, client relations, and revenue generation" },
        { name: "HR", description: "Human resources, talent acquisition, and employee relations" },
        { name: "Finance", description: "Financial planning, accounting, and budget management" },
        { name: "Operations", description: "Business operations, process improvement, and logistics" },
        { name: "Product", description: "Product management, strategy, and roadmap planning" },
        { name: "Legal", description: "Legal counsel, compliance, and contract management" },
        { name: "Wealth Management", description: "Financial advisory and wealth planning services" },
        { name: "Tax Services", description: "Tax planning and preparation services" },
        { name: "Investment Management", description: "Portfolio management and investment advisory" },
        { name: "Financial Planning", description: "Comprehensive financial planning services" },
        { name: "Retirement Services", description: "Retirement planning and benefit services" },
        { name: "Administration", description: "Administrative support and office management" },
        { name: "Client Services", description: "Customer service and client relationship management" },
        { name: "Human Resources", description: "HR administration and employee services" }
      ];

      // Check if departments already exist
      const currentDepartments = await storage.getAllDepartments();
      
      if (currentDepartments.length > 0) {
        return res.json({ message: `${currentDepartments.length} departments already exist`, departments: currentDepartments });
      }

      // Create departments
      const createdDepartments = [];
      for (const dept of departmentData) {
        const department = await storage.createDepartment({
          name: dept.name,
          description: dept.description,
          createdBy: "system"
        });
        createdDepartments.push(department);
      }

      res.json({ 
        message: "Departments seeded successfully", 
        count: createdDepartments.length,
        departments: createdDepartments 
      });
    } catch (error) {
      console.error("Error seeding departments:", error);
      res.status(500).json({ error: "Failed to seed departments" });
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
        } else if (title.includes('specialist') || 
                   title.includes('coordinator') || 
                   employee.experienceLevel === 'Senior') {
          role = 'manager';
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

  // LinkedIn OAuth Authentication
  app.get('/api/linkedin/auth', isAuthenticated, (req, res) => {
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      return res.status(400).json({ 
        message: 'LinkedIn credentials not configured. Please provide LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.' 
      });
    }

    const state = Math.random().toString(36).substring(7);
    req.session.linkedinState = state;
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=r_liteprofile%20r_emailaddress`;
    
    res.json({ authUrl });
  });

  // LinkedIn OAuth Callback
  app.get('/api/linkedin/callback', isAuthenticated, async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || state !== req.session.linkedinState) {
        return res.status(400).json({ message: 'Invalid OAuth response' });
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${req.protocol}://${req.get('host')}/api/linkedin/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Get LinkedIn profile data
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,headline)', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json();

      // Store access token in session for skills import
      req.session.linkedinAccessToken = tokenData.access_token;
      req.session.linkedinProfile = profileData;

      // Redirect to frontend with success
      res.redirect('/?linkedin=success');
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      res.redirect('/?linkedin=error');
    }
  });

  // LinkedIn OAuth Authentication
  app.get('/api/linkedin/auth', isAuthenticated, async (req, res) => {
    try {
      const { LinkedInAuthService } = await import('./linkedin-auth');
      const linkedinAuth = new LinkedInAuthService();
      
      const state = Math.random().toString(36).substring(7);
      (req.session as any).linkedinState = state;
      
      const authUrl = linkedinAuth.getAuthUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      res.status(500).json({ message: 'Failed to initiate LinkedIn authentication' });
    }
  });

  // LinkedIn OAuth Callback
  app.get('/api/linkedin/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req.session as any).linkedinState;
      
      if (!code || !state || state !== sessionState) {
        return res.redirect('/?linkedin=error');
      }

      const { LinkedInAuthService } = await import('./linkedin-auth');
      const linkedinAuth = new LinkedInAuthService();
      
      const accessToken = await linkedinAuth.exchangeCodeForToken(code as string, state as string);
      const profile = await linkedinAuth.getProfile(accessToken);
      
      (req.session as any).linkedinAccessToken = accessToken;
      (req.session as any).linkedinProfile = profile;
      
      res.redirect('/?linkedin=success');
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.redirect('/?linkedin=error');
    }
  });

  // Professional Skills Import System
  app.post('/api/linkedin/import-skills', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if LinkedIn credentials are configured
      if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        // Use professional skills system based on user profile
        const professionalSkills = await generateProfessionalSkills(user, employee);
        return res.json(professionalSkills);
      }

      const accessToken = (req.session as any).linkedinAccessToken;
      
      if (!accessToken) {
        // Need LinkedIn authentication first
        const { LinkedInAuthService } = await import('./linkedin-auth');
        const linkedinAuth = new LinkedInAuthService();
        
        const state = Math.random().toString(36).substring(7);
        (req.session as any).linkedinState = state;
        
        const authUrl = linkedinAuth.getAuthUrl(state);
        return res.status(401).json({ authRequired: true, authUrl });
      }

      // Use LinkedIn API for authentic skills data
      const { LinkedInAuthService } = await import('./linkedin-auth');
      const linkedinAuth = new LinkedInAuthService();
      
      const skills = await linkedinAuth.getSkills(accessToken);
      res.json(skills);
    } catch (error) {
      console.error('Error importing professional skills:', error);
      
      // Fallback to professional skills system
      try {
        const userId = (req.user as any)?.claims?.sub;
        const user = await storage.getUser(userId);
        const employee = await storage.getEmployeeByUserId(userId);
        const professionalSkills = await generateProfessionalSkills(user, employee);
        res.json(professionalSkills);
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to import professional skills' });
      }
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

  app.post("/api/experts/request", isAuthenticated, async (req, res) => {
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

  app.get("/api/experts/requests", isAuthenticated, async (req, res) => {
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
  app.post("/api/admin/seed-skill-levels", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.claims.sub);
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

  // Get skill level summary
  app.get("/api/admin/skill-levels-summary", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.claims.sub);
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

  const httpServer = createServer(app);
  return httpServer;
}
