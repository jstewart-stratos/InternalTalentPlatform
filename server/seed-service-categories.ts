import { storage } from "./storage";

export async function seedServiceCategories() {
  console.log("Seeding service categories...");

  const categories = [
    {
      name: "Financial Analysis & Consulting",
      description: "Expert financial analysis, modeling, and strategic consulting services",
      icon: "TrendingUp",
      sortOrder: 1
    },
    {
      name: "Risk Management",
      description: "Risk assessment, mitigation strategies, and compliance consulting",
      icon: "Shield",
      sortOrder: 2
    },
    {
      name: "Investment Advisory",
      description: "Portfolio management, investment strategy, and wealth planning",
      icon: "PieChart",
      sortOrder: 3
    },
    {
      name: "Regulatory Compliance",
      description: "Regulatory guidance, compliance audits, and policy development",
      icon: "FileCheck",
      sortOrder: 4
    },
    {
      name: "Business Intelligence",
      description: "Data analytics, reporting, and business intelligence solutions",
      icon: "BarChart3",
      sortOrder: 5
    },
    {
      name: "Process Optimization",
      description: "Workflow improvement, automation, and operational efficiency",
      icon: "Settings",
      sortOrder: 6
    },
    {
      name: "Technology Integration",
      description: "FinTech solutions, system integration, and digital transformation",
      icon: "Laptop",
      sortOrder: 7
    },
    {
      name: "Training & Development",
      description: "Professional training, skill development, and knowledge transfer",
      icon: "GraduationCap",
      sortOrder: 8
    },
    {
      name: "Audit & Assurance",
      description: "Internal audits, quality assurance, and process validation",
      icon: "Search",
      sortOrder: 9
    },
    {
      name: "Strategic Planning",
      description: "Business strategy, market analysis, and growth planning",
      icon: "Target",
      sortOrder: 10
    }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const categoryData of categories) {
    try {
      // Check if category already exists
      const existingCategories = await storage.getAllServiceCategories();
      const exists = existingCategories.some(cat => cat.name === categoryData.name);
      
      if (!exists) {
        await storage.createServiceCategory(categoryData);
        createdCount++;
        console.log(`✓ Created category: ${categoryData.name}`);
      } else {
        skippedCount++;
        console.log(`- Skipped existing category: ${categoryData.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to create category ${categoryData.name}:`, error);
    }
  }

  console.log(`Service categories seeding completed:`);
  console.log(`- Created: ${createdCount} categories`);
  console.log(`- Skipped: ${skippedCount} existing categories`);
  
  return {
    created: createdCount,
    skipped: skippedCount,
    total: categories.length
  };
}

// Run if this file is executed directly
if (require.main === module) {
  seedServiceCategories()
    .then((result) => {
      console.log("Seeding completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}