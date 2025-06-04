import { db } from "./db";
import { projects } from "@shared/schema";

const sampleProjects = [
  {
    title: "E-Commerce Frontend Modernization",
    description: "Modernize our e-commerce platform frontend using React and TypeScript. Implement responsive design, improve performance, and integrate with our GraphQL API. Focus on user experience and accessibility standards.",
    ownerId: 40, // Sarah Chen
    status: "planning" as const,
    priority: "high" as const,
    deadline: new Date("2025-02-15"),
    requiredSkills: ["React", "TypeScript", "GraphQL", "CSS", "JavaScript"],
    estimatedDuration: "8 weeks",
    budget: "$22,000"
  },
  {
    title: "Data Analytics Platform Development",
    description: "Build a comprehensive data analytics platform using Python and machine learning algorithms. Implement data visualization dashboards, predictive models, and automated reporting features for business intelligence.",
    ownerId: 41, // Michael Rodriguez
    status: "active" as const,
    priority: "high" as const,
    deadline: new Date("2025-02-28"),
    requiredSkills: ["Python", "Machine Learning", "SQL", "Tableau", "Data Science"],
    estimatedDuration: "10 weeks",
    budget: "$30,000"
  },
  {
    title: "User Experience Research Initiative",
    description: "Conduct comprehensive user research and redesign key product interfaces. Focus on user journey mapping, usability testing, wireframing, and creating a cohesive design system using Figma.",
    ownerId: 42, // Emily Johnson
    status: "planning" as const,
    priority: "medium" as const,
    deadline: new Date("2025-03-15"),
    requiredSkills: ["UX Design", "User Research", "Figma", "Prototyping", "Usability Testing"],
    estimatedDuration: "6 weeks",
    budget: "$18,000"
  },
  {
    title: "Node.js API Infrastructure Upgrade",
    description: "Modernize our backend API infrastructure using Node.js and TypeScript. Implement GraphQL endpoints, improve performance, add comprehensive testing with Jest, and enhance security measures.",
    ownerId: 43, // David Park
    status: "active" as const,
    priority: "high" as const,
    deadline: new Date("2025-02-10"),
    requiredSkills: ["Node.js", "TypeScript", "GraphQL", "Jest", "API Development"],
    estimatedDuration: "8 weeks",
    budget: "$25,000"
  },
  {
    title: "DevOps Pipeline Automation",
    description: "Implement comprehensive CI/CD pipelines and infrastructure automation. Focus on containerization with Docker, deployment automation, monitoring, and cloud infrastructure management using modern DevOps practices.",
    ownerId: 44, // Lisa Wang
    status: "planning" as const,
    priority: "high" as const,
    deadline: new Date("2025-03-01"),
    requiredSkills: ["DevOps", "Docker", "CI/CD", "AWS", "Infrastructure"],
    estimatedDuration: "9 weeks",
    budget: "$28,000"
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