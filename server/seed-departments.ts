import { storage } from "./storage";

export async function seedDepartments() {
  console.log("Seeding departments...");

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
    "Legal"
  ];

  try {
    // Check if departments already exist
    const currentDepartments = await storage.getAllDepartments();
    
    if (currentDepartments.length > 0) {
      console.log(`${currentDepartments.length} departments already exist, skipping seed.`);
      return;
    }

    // Create departments with descriptions
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
      { name: "Legal", description: "Legal counsel, compliance, and contract management" }
    ];

    for (const dept of departmentData) {
      await storage.createDepartment({
        name: dept.name,
        description: dept.description,
        createdBy: "system"
      });
      console.log(`Created department: ${dept.name}`);
    }

    console.log("Department seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding departments:", error);
  }
}