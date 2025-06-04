import { db } from "./db";
import { projects } from "@shared/schema";

const sampleProjects = [
  {
    title: "Customer Analytics Dashboard",
    description: "Build a comprehensive analytics dashboard to visualize customer behavior patterns, track key metrics, and generate actionable insights for the sales team. The dashboard should include real-time data visualization, custom reporting capabilities, and automated alerts.",
    ownerId: 40, // Sarah Chen
    status: "planning" as const,
    priority: "high" as const,
    deadline: new Date("2025-02-15"),
    requiredSkills: ["React", "Data Visualization", "SQL", "Python", "Tableau"],
    estimatedDuration: "6 weeks",
    budget: "$15,000"
  },
  {
    title: "Mobile App UI/UX Redesign",
    description: "Complete redesign of our mobile application interface to improve user experience and increase engagement. This includes user research, wireframing, prototyping, and creating a modern design system that aligns with our brand guidelines.",
    ownerId: 41, // Michael Rodriguez
    status: "active" as const,
    priority: "medium" as const,
    deadline: new Date("2025-01-30"),
    requiredSkills: ["UI/UX Design", "Figma", "User Research", "Prototyping", "Mobile Design"],
    estimatedDuration: "4 weeks",
    budget: "$8,000"
  },
  {
    title: "AI-Powered Content Recommendation Engine",
    description: "Develop a machine learning system that analyzes user behavior and preferences to recommend personalized content. The system should use collaborative filtering and natural language processing to improve recommendation accuracy over time.",
    ownerId: 42, // Emily Johnson
    status: "planning" as const,
    priority: "critical" as const,
    deadline: new Date("2025-03-20"),
    requiredSkills: ["Machine Learning", "Python", "TensorFlow", "Data Science", "API Development"],
    estimatedDuration: "10 weeks",
    budget: "$25,000"
  },
  {
    title: "Automated Testing Framework",
    description: "Create a comprehensive automated testing framework for our web applications. This includes unit tests, integration tests, and end-to-end testing with continuous integration pipeline integration and detailed reporting capabilities.",
    ownerId: 43, // David Park
    status: "active" as const,
    priority: "medium" as const,
    deadline: new Date("2025-02-28"),
    requiredSkills: ["Test Automation", "Selenium", "Jest", "CI/CD", "JavaScript"],
    estimatedDuration: "5 weeks",
    budget: "$12,000"
  },
  {
    title: "Customer Support Chatbot",
    description: "Build an intelligent chatbot to handle common customer inquiries and support requests. The bot should integrate with our existing CRM system, provide natural language responses, and escalate complex issues to human agents.",
    ownerId: 44, // Lisa Wang
    status: "planning" as const,
    priority: "medium" as const,
    deadline: new Date("2025-02-10"),
    requiredSkills: ["Natural Language Processing", "Chatbot Development", "Node.js", "API Integration"],
    estimatedDuration: "7 weeks",
    budget: "$18,000"
  },
  {
    title: "Data Migration to Cloud",
    description: "Migrate our on-premises database systems to cloud infrastructure with minimal downtime. This includes data validation, security implementation, performance optimization, and comprehensive backup strategies.",
    ownerId: 45, // James Thompson
    status: "paused" as const,
    priority: "high" as const,
    deadline: new Date("2025-04-15"),
    requiredSkills: ["Cloud Computing", "AWS", "Database Migration", "DevOps", "Security"],
    estimatedDuration: "12 weeks",
    budget: "$30,000"
  },
  {
    title: "Real-time Collaboration Platform",
    description: "Develop a real-time collaboration platform for remote teams with features like video conferencing, screen sharing, document collaboration, and project management tools. The platform should support multiple concurrent users.",
    ownerId: 46, // Maria Garcia
    status: "active" as const,
    priority: "high" as const,
    deadline: new Date("2025-05-01"),
    requiredSkills: ["WebRTC", "Real-time Communication", "React", "Node.js", "Socket.io"],
    estimatedDuration: "14 weeks",
    budget: "$40,000"
  },
  {
    title: "Inventory Management System",
    description: "Create a comprehensive inventory management system with barcode scanning, automated reordering, supplier integration, and detailed reporting. The system should handle multiple warehouses and real-time stock tracking.",
    ownerId: 47, // Robert Kim
    status: "planning" as const,
    priority: "medium" as const,
    deadline: new Date("2025-03-15"),
    requiredSkills: ["Inventory Management", "Barcode Integration", "Supply Chain", "Database Design"],
    estimatedDuration: "8 weeks",
    budget: "$22,000"
  },
  {
    title: "Security Audit and Penetration Testing",
    description: "Conduct a comprehensive security audit of our web applications and infrastructure. This includes vulnerability assessments, penetration testing, security policy reviews, and recommendations for security improvements.",
    ownerId: 48, // Amanda Foster
    status: "completed" as const,
    priority: "critical" as const,
    deadline: new Date("2024-12-15"),
    requiredSkills: ["Cybersecurity", "Penetration Testing", "Security Audit", "Vulnerability Assessment"],
    estimatedDuration: "3 weeks",
    budget: "$10,000"
  },
  {
    title: "Marketing Campaign Analytics",
    description: "Develop analytics tools to track and measure the effectiveness of digital marketing campaigns across multiple channels. Include ROI calculations, attribution modeling, and automated reporting for stakeholders.",
    ownerId: 49, // Brian Chen
    status: "planning" as const,
    priority: "low" as const,
    deadline: new Date("2025-04-30"),
    requiredSkills: ["Marketing Analytics", "Google Analytics", "Data Visualization", "ROI Analysis"],
    estimatedDuration: "6 weeks",
    budget: "$14,000"
  }
];

export async function seedProjects() {
  try {
    console.log("Seeding sample projects...");
    
    // Clear existing projects
    await db.delete(projects);
    
    // Insert sample projects
    await db.insert(projects).values(sampleProjects);
    
    console.log(`Successfully seeded ${sampleProjects.length} sample projects`);
  } catch (error) {
    console.error("Error seeding projects:", error);
    throw error;
  }
}

// Run if called directly
seedProjects()
  .then(() => {
    console.log("Project seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Project seeding failed:", error);
    process.exit(1);
  });