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

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromEmployeeId: integer("from_employee_id").notNull(),
  toEmployeeId: integer("to_employee_id").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull(),
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

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({
  id: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
