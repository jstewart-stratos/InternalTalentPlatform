import { db } from "./db";
import { employees, skillEndorsements, type InsertEmployee, type InsertSkillEndorsement } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if employees already exist
  const existingEmployees = await db.select().from(employees);
  if (existingEmployees.length > 0) {
    console.log("Database already seeded");
    return;
  }

  const sampleEmployees: InsertEmployee[] = [
    {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      title: "Senior Frontend Developer",
      department: "Engineering",
      bio: "Specialized in building scalable web applications with modern frameworks. Available for consulting on frontend architecture and performance optimization.",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b515?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 5,
      experienceLevel: "Senior",
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
      experienceLevel: "Lead",
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
      experienceLevel: "Senior",
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
      experienceLevel: "Mid-level",
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
      experienceLevel: "Senior",
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
      experienceLevel: "Lead",
      skills: ["Scrum Master", "Team Leadership", "Process Optimization", "Agile Coaching", "Risk Management", "Stakeholder Management", "Budgeting"],
      availability: "available",
      availabilityMessage: "Available now"
    }
  ];

  const insertedEmployees = await db.insert(employees).values(sampleEmployees).returning();
  
  // Add sample skill endorsements
  const sampleEndorsements: InsertSkillEndorsement[] = [
    // Sarah Chen's skills endorsed by others
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[1].id, skill: "React" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[2].id, skill: "React" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[3].id, skill: "TypeScript" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[4].id, skill: "Node.js" },
    
    // Michael Rodriguez's skills endorsed by others
    { employeeId: insertedEmployees[1].id, endorserId: insertedEmployees[0].id, skill: "Python" },
    { employeeId: insertedEmployees[1].id, endorserId: insertedEmployees[2].id, skill: "Machine Learning" },
    { employeeId: insertedEmployees[1].id, endorserId: insertedEmployees[5].id, skill: "SQL" },
    
    // Emily Johnson's skills endorsed by others
    { employeeId: insertedEmployees[2].id, endorserId: insertedEmployees[0].id, skill: "User Research" },
    { employeeId: insertedEmployees[2].id, endorserId: insertedEmployees[1].id, skill: "Figma" },
    { employeeId: insertedEmployees[2].id, endorserId: insertedEmployees[3].id, skill: "Prototyping" },
    { employeeId: insertedEmployees[2].id, endorserId: insertedEmployees[5].id, skill: "Design Systems" },
    
    // David Kim's skills endorsed by others
    { employeeId: insertedEmployees[3].id, endorserId: insertedEmployees[1].id, skill: "Go-to-Market" },
    { employeeId: insertedEmployees[3].id, endorserId: insertedEmployees[2].id, skill: "Content Strategy" },
    { employeeId: insertedEmployees[3].id, endorserId: insertedEmployees[5].id, skill: "Analytics" },
    
    // Lisa Park's skills endorsed by others
    { employeeId: insertedEmployees[4].id, endorserId: insertedEmployees[0].id, skill: "AWS" },
    { employeeId: insertedEmployees[4].id, endorserId: insertedEmployees[1].id, skill: "Kubernetes" },
    { employeeId: insertedEmployees[4].id, endorserId: insertedEmployees[5].id, skill: "Docker" },
    
    // Alex Thompson's skills endorsed by others
    { employeeId: insertedEmployees[5].id, endorserId: insertedEmployees[1].id, skill: "Scrum Master" },
    { employeeId: insertedEmployees[5].id, endorserId: insertedEmployees[2].id, skill: "Team Leadership" },
    { employeeId: insertedEmployees[5].id, endorserId: insertedEmployees[3].id, skill: "Process Optimization" },
  ];

  await db.insert(skillEndorsements).values(sampleEndorsements);
  
  console.log(`Seeded ${sampleEmployees.length} employees and ${sampleEndorsements.length} skill endorsements`);
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export { seed };