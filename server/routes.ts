import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertSkillEndorsementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
