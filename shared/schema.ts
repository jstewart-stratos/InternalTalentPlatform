import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({
  id: true,
  createdAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
