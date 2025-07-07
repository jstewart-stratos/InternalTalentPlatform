import { db } from "./db";
import { users, employees } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedAdminUser() {
  try {
    console.log("Seeding admin user...");
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "jstewart@stratoswp.com"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists, skipping...");
      return existingAdmin[0];
    }

    // Create admin user
    const hashedPassword = await hashPassword("admin123"); // Default password for demo
    
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "jstewart@stratoswp.com",
        password: hashedPassword,
        firstName: "Jacob",
        lastName: "Stewart",
        role: "admin",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created admin user with ID: ${adminUser.id}`);

    // Create corresponding employee profile
    const [adminEmployee] = await db
      .insert(employees)
      .values({
        userId: adminUser.id,
        name: "Jacob Stewart",
        email: "jstewart@stratoswp.com",
        title: "System Administrator",
        bio: "Platform administrator responsible for system management and user oversight.",
        yearsExperience: 10,
        experienceLevel: "Expert",
        skills: ["leadership", "system-administration", "project-management"],
        expertiseAreas: ["Administration", "Leadership", "Technology"],
        availabilityStatus: "available",
        preferredContactMethod: "email",
        isExpertDirectoryVisible: true,
        maxMentees: 5,
      })
      .returning();

    console.log(`Created admin employee profile with ID: ${adminEmployee.id}`);
    
    return { user: adminUser, employee: adminEmployee };
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log("Admin user seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Admin user seeding failed:", error);
      process.exit(1);
    });
}