import { pgTable, text, serial, integer, boolean, json, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  yearsExperience: integer("years_experience").notNull(),
  experienceLevel: text("experience_level").notNull().default("Mid-level"),
  skills: text("skills").array().notNull(),
  availability: text("availability").notNull().default("available"), // available, busy, unavailable
  availabilityMessage: text("availability_message"),
});

export const employeesRelations = pgTable("employees_relations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  relatedEmployeeId: integer("related_employee_id").notNull(),
  type: text("type").notNull(), // colleague, mentor, mentee, collaborator
});

export const skillEndorsements = pgTable("skill_endorsements", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  endorserId: integer("endorser_id").notNull(),
  skill: text("skill").notNull(),
  createdAt: text("created_at").notNull(),
});

export const skillSearches = pgTable("skill_searches", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  searchedAt: text("searched_at").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull().references(() => employees.id),
  status: text("status", { enum: ["planning", "active", "paused", "completed"] }).default("planning").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  deadline: timestamp("deadline"),
  requiredSkills: text("required_skills").array().default([]).notNull(),
  estimatedDuration: text("estimated_duration"),
  budget: text("budget"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectApplications = pgTable("project_applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  applicantId: integer("applicant_id").notNull().references(() => employees.id),
  message: text("message"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectApplicationSchema = createInsertSchema(projectApplications).omit({
  id: true,
  appliedAt: true,
});

// User authentication schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectApplication = z.infer<typeof insertProjectApplicationSchema>;
export type ProjectApplication = typeof projectApplications.$inferSelect;
