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
  role: varchar("role").notNull().default("user"), // admin, manager, user
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
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

// Site settings table for admin panel
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default("general"), // general, security, features, notifications
  isPublic: boolean("is_public").notNull().default(false),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin audit log table
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // user_created, user_updated, user_deactivated, setting_changed, etc.
  targetType: varchar("target_type").notNull(), // user, employee, project, setting
  targetId: varchar("target_id"),
  changes: jsonb("changes"), // JSON of what changed
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User permissions table
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  permission: varchar("permission").notNull(), // manage_users, manage_settings, view_analytics, etc.
  grantedBy: varchar("granted_by").notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
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

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  grantedAt: true,
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
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof adminAuditLog.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;
