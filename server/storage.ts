import { employees, messages, type Employee, type InsertEmployee, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  searchEmployees(query: string, department?: string, experienceLevel?: string): Promise<Employee[]>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForEmployee(employeeId: number): Promise<Message[]>;
  getConversation(employee1Id: number, employee2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
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

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        createdAt: new Date().toISOString()
      })
      .returning();
    return message;
  }

  async getMessagesForEmployee(employeeId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.toEmployeeId, employeeId),
          eq(messages.fromEmployeeId, employeeId)
        )
      );
  }

  async getConversation(employee1Id: number, employee2Id: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.fromEmployeeId, employee1Id),
            eq(messages.toEmployeeId, employee2Id)
          ),
          and(
            eq(messages.fromEmployeeId, employee2Id),
            eq(messages.toEmployeeId, employee1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }
}

export const storage = new DatabaseStorage();
