import { employees, messages, type Employee, type InsertEmployee, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  searchEmployees(query: string, department?: string, experienceLevel?: string): Promise<Employee[]>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForEmployee(employeeId: number): Promise<Message[]>;
  getConversation(employee1Id: number, employee2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private messages: Map<number, Message>;
  private currentEmployeeId: number;
  private currentMessageId: number;

  constructor() {
    this.employees = new Map();
    this.messages = new Map();
    this.currentEmployeeId = 1;
    this.currentMessageId = 1;
    this.seedData();
  }

  private seedData() {
    // Create sample employees
    const sampleEmployees: InsertEmployee[] = [
      {
        name: "Sarah Chen",
        email: "sarah.chen@company.com",
        title: "Senior Frontend Developer",
        department: "Engineering",
        bio: "Specialized in building scalable web applications with modern frameworks. Available for consulting on frontend architecture and performance optimization.",
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b515?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 5,
        skills: ["React", "TypeScript", "Node.js", "GraphQL", "Jest", "Webpack"],
        availability: "available",
        availabilityMessage: "Available now"
      },
      {
        name: "Michael Rodriguez",
        email: "michael.rodriguez@company.com",
        title: "Data Science Manager",
        department: "Analytics",
        bio: "Expert in predictive analytics and business intelligence. Can help with data strategy, model development, and team mentoring.",
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 8,
        skills: ["Python", "Machine Learning", "SQL", "TensorFlow", "R", "Tableau"],
        availability: "busy",
        availabilityMessage: "Available in 2 weeks"
      },
      {
        name: "Emily Johnson",
        email: "emily.johnson@company.com",
        title: "UX Design Lead",
        department: "Design",
        bio: "Passionate about creating user-centered designs. Can assist with user research, interaction design, and design system development.",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 6,
        skills: ["User Research", "Figma", "Prototyping", "Design Systems", "Usability Testing", "Adobe Creative Suite"],
        availability: "available",
        availabilityMessage: "Available now"
      },
      {
        name: "David Kim",
        email: "david.kim@company.com",
        title: "Product Marketing Manager",
        department: "Marketing",
        bio: "Experienced in product launches and growth marketing. Available for strategic consulting and campaign development.",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 4,
        skills: ["Go-to-Market", "Content Strategy", "Analytics", "SEO", "Social Media", "Email Marketing", "A/B Testing", "Product Positioning"],
        availability: "available",
        availabilityMessage: "Available now"
      },
      {
        name: "Lisa Park",
        email: "lisa.park@company.com",
        title: "DevOps Engineer",
        department: "Infrastructure",
        bio: "Cloud infrastructure specialist with expertise in CI/CD pipelines. Can help with system architecture and deployment automation.",
        profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 7,
        skills: ["AWS", "Kubernetes", "Docker", "Jenkins", "Terraform", "Monitoring", "Security", "Microservices"],
        availability: "busy",
        availabilityMessage: "Available in 1 week"
      },
      {
        name: "Alex Thompson",
        email: "alex.thompson@company.com",
        title: "Agile Project Manager",
        department: "Operations",
        bio: "Certified Scrum Master with experience managing cross-functional teams. Available for project planning and agile coaching.",
        profileImage: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        yearsExperience: 9,
        skills: ["Scrum Master", "Team Leadership", "Process Optimization", "Agile Coaching", "Risk Management", "Stakeholder Management", "Budgeting"],
        availability: "available",
        availabilityMessage: "Available now"
      }
    ];

    sampleEmployees.forEach(employee => {
      this.createEmployee(employee);
    });
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.email === email,
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const employee: Employee = { ...insertEmployee, id };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, insertEmployee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: Employee = { ...existing, ...insertEmployee };
    this.employees.set(id, updated);
    return updated;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async searchEmployees(query: string, department?: string, experienceLevel?: string): Promise<Employee[]> {
    let results = Array.from(this.employees.values());

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(employee => 
        employee.name.toLowerCase().includes(lowerQuery) ||
        employee.title.toLowerCase().includes(lowerQuery) ||
        employee.skills.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
        employee.bio?.toLowerCase().includes(lowerQuery)
      );
    }

    if (department && department !== "All Departments") {
      results = results.filter(employee => employee.department === department);
    }

    if (experienceLevel && experienceLevel !== "Any Level") {
      results = results.filter(employee => {
        switch (experienceLevel) {
          case "Entry Level (0-2 years)":
            return employee.yearsExperience <= 2;
          case "Mid Level (3-5 years)":
            return employee.yearsExperience >= 3 && employee.yearsExperience <= 5;
          case "Senior Level (6+ years)":
            return employee.yearsExperience >= 6;
          default:
            return true;
        }
      });
    }

    return results;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date().toISOString()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesForEmployee(employeeId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.toEmployeeId === employeeId || message.fromEmployeeId === employeeId
    );
  }

  async getConversation(employee1Id: number, employee2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.fromEmployeeId === employee1Id && message.toEmployeeId === employee2Id) ||
        (message.fromEmployeeId === employee2Id && message.toEmployeeId === employee1Id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, isRead: true });
    }
  }
}

export const storage = new MemStorage();
