import { storage } from "./storage";

export async function seedUsers() {
  console.log("Seeding users from employees...");

  try {
    // Get all employees
    const employees = await storage.getAllEmployees();
    
    if (employees.length === 0) {
      console.log("No employees found to create users for.");
      return;
    }

    // Get existing users
    const existingUsers = await storage.getAllUsers();
    const existingEmails = new Set(existingUsers.map(user => user.email));

    let createdCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      if (!employee.email) {
        console.log(`Skipping employee ${employee.name} - no email address`);
        skippedCount++;
        continue;
      }

      if (existingEmails.has(employee.email)) {
        console.log(`Skipping ${employee.email} - user already exists`);
        skippedCount++;
        continue;
      }

      // Create user account for employee
      try {
        await storage.upsertUser({
          id: `emp_${employee.id}`, // Temporary ID for employee-based users
          email: employee.email,
          firstName: employee.name.split(' ')[0],
          lastName: employee.name.split(' ').slice(1).join(' ') || '',
          profileImageUrl: employee.profileImage || null,
          role: determineUserRole(employee),
          isActive: true
        });

        console.log(`Created user account for ${employee.name} (${employee.email})`);
        createdCount++;
      } catch (error) {
        console.error(`Failed to create user for ${employee.name}:`, error);
      }
    }

    console.log(`User seeding completed: ${createdCount} created, ${skippedCount} skipped`);
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

function determineUserRole(employee: any): string {
  // All users get the default "user" role
  // Admin roles must be manually assigned
  return 'user';
}