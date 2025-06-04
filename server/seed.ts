import { db } from "./db";
import { employees, skillEndorsements, type InsertEmployee, type InsertSkillEndorsement } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if employees already exist
  const existingEmployees = await db.select().from(employees);
  if (existingEmployees.length > 0) {
    console.log("Database already contains data, clearing and reseeding...");
    await db.delete(skillEndorsements);
    await db.delete(employees);
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
    },
    {
      name: "Jessica Martinez",
      email: "jessica.martinez@stratoswealth.com",
      title: "Senior Financial Advisor",
      department: "Wealth Management",
      bio: "Certified Financial Planner with expertise in retirement planning and estate management. Specializes in helping high-net-worth clients achieve their financial goals.",
      profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 12,
      experienceLevel: "Senior",
      skills: ["Retirement Planning", "Estate Planning", "Tax Strategy", "Investment Management", "Risk Assessment", "Portfolio Optimization", "CFP Certification", "Fiduciary Planning"],
      availability: "available",
      availabilityMessage: "Available for consultations"
    },
    {
      name: "Robert Wilson",
      email: "robert.wilson@stratoswealth.com",
      title: "Wealth Management Director",
      department: "Wealth Management",
      bio: "Former hedge fund manager turned wealth advisor. Expertise in alternative investments and institutional-level financial strategies for ultra-high-net-worth clients.",
      profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 18,
      experienceLevel: "Lead",
      skills: ["Alternative Investments", "Hedge Fund Strategies", "Private Equity", "Family Office Services", "Trust Management", "International Tax Planning", "Wealth Transfer", "Due Diligence"],
      availability: "busy",
      availabilityMessage: "Available in 3 weeks"
    },
    {
      name: "Amanda Foster",
      email: "amanda.foster@stratoswealth.com",
      title: "Insurance & Risk Specialist",
      department: "Wealth Management",
      bio: "Chartered Life Underwriter specializing in life insurance, disability coverage, and comprehensive risk management for affluent families.",
      profileImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 8,
      experienceLevel: "Senior",
      skills: ["Life Insurance", "Disability Insurance", "Long-term Care Planning", "Risk Management", "CLU Designation", "Underwriting Analysis", "Business Succession", "Key Person Insurance"],
      availability: "available",
      availabilityMessage: "Available this week"
    },
    {
      name: "Christopher Lee",
      email: "christopher.lee@stratoswealth.com",
      title: "Tax Planning Strategist",
      department: "Tax Services",
      bio: "CPA with advanced expertise in complex tax planning strategies. Helps clients minimize tax liability through sophisticated planning techniques.",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 15,
      experienceLevel: "Lead",
      skills: ["Tax Planning", "CPA Certification", "Estate Tax", "Gift Tax", "Charitable Planning", "Business Tax Strategy", "Multi-state Tax", "International Tax"],
      availability: "available",
      availabilityMessage: "Available for complex cases"
    },
    {
      name: "Michelle Chang",
      email: "michelle.chang@stratoswealth.com",
      title: "Portfolio Manager",
      department: "Investment Management",
      bio: "CFA charterholder specializing in equity research and portfolio construction. Focuses on ESG investing and quantitative analysis.",
      profileImage: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 10,
      experienceLevel: "Senior",
      skills: ["Portfolio Management", "CFA Charter", "ESG Investing", "Equity Research", "Quantitative Analysis", "Asset Allocation", "Risk Modeling", "Performance Attribution"],
      availability: "available",
      availabilityMessage: "Available now"
    },
    {
      name: "Daniel Rodriguez",
      email: "daniel.rodriguez@stratoswealth.com",
      title: "Financial Planning Associate",
      department: "Financial Planning",
      bio: "Recent CFP graduate with expertise in comprehensive financial planning for young professionals and growing families.",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 3,
      experienceLevel: "Junior",
      skills: ["Financial Planning", "Budgeting", "Debt Management", "Education Planning", "First-time Home Buyers", "Young Professional Planning", "Goal Setting", "Cash Flow Analysis"],
      availability: "available",
      availabilityMessage: "Available for new clients"
    },
    {
      name: "Karen Thompson",
      email: "karen.thompson@stratoswealth.com",
      title: "Retirement Planning Specialist",
      department: "Retirement Services",
      bio: "Retirement income specialist with deep expertise in Social Security optimization, Medicare planning, and 401(k) rollovers.",
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      yearsExperience: 14,
      experienceLevel: "Senior",
      skills: ["Social Security Optimization", "Medicare Planning", "401k Rollovers", "Pension Analysis", "Required Minimum Distributions", "Health Savings Accounts", "Longevity Planning", "Income Replacement"],
      availability: "busy",
      availabilityMessage: "Available in 2 weeks"
    }
  ];

  const insertedEmployees = await db.insert(employees).values(sampleEmployees).returning();
  
  // Add sample skill endorsements  
  const endorsementData = [
    // Sarah Chen's skills endorsed by others
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[1].id, skill: "React" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[2].id, skill: "React" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[3].id, skill: "TypeScript" },
    { employeeId: insertedEmployees[0].id, endorserId: insertedEmployees[4].id, skill: "Node.js" },
    
    // Financial advisor skill endorsements
    { employeeId: insertedEmployees[6].id, endorserId: insertedEmployees[7].id, skill: "Retirement Planning" },
    { employeeId: insertedEmployees[6].id, endorserId: insertedEmployees[8].id, skill: "Estate Planning" },
    { employeeId: insertedEmployees[6].id, endorserId: insertedEmployees[9].id, skill: "CFP Certification" },
    
    { employeeId: insertedEmployees[7].id, endorserId: insertedEmployees[6].id, skill: "Alternative Investments" },
    { employeeId: insertedEmployees[7].id, endorserId: insertedEmployees[10].id, skill: "Private Equity" },
    { employeeId: insertedEmployees[7].id, endorserId: insertedEmployees[8].id, skill: "Wealth Transfer" },
    
    { employeeId: insertedEmployees[8].id, endorserId: insertedEmployees[6].id, skill: "Life Insurance" },
    { employeeId: insertedEmployees[8].id, endorserId: insertedEmployees[7].id, skill: "Risk Management" },
    { employeeId: insertedEmployees[8].id, endorserId: insertedEmployees[12].id, skill: "CLU Designation" },
    
    { employeeId: insertedEmployees[9].id, endorserId: insertedEmployees[6].id, skill: "Tax Planning" },
    { employeeId: insertedEmployees[9].id, endorserId: insertedEmployees[7].id, skill: "Estate Tax" },
    { employeeId: insertedEmployees[9].id, endorserId: insertedEmployees[10].id, skill: "CPA Certification" },
    
    { employeeId: insertedEmployees[10].id, endorserId: insertedEmployees[7].id, skill: "Portfolio Management" },
    { employeeId: insertedEmployees[10].id, endorserId: insertedEmployees[9].id, skill: "CFA Charter" },
    { employeeId: insertedEmployees[10].id, endorserId: insertedEmployees[6].id, skill: "ESG Investing" },
    
    { employeeId: insertedEmployees[11].id, endorserId: insertedEmployees[6].id, skill: "Financial Planning" },
    { employeeId: insertedEmployees[11].id, endorserId: insertedEmployees[10].id, skill: "Budgeting" },
    { employeeId: insertedEmployees[11].id, endorserId: insertedEmployees[12].id, skill: "Young Professional Planning" },
    
    { employeeId: insertedEmployees[12].id, endorserId: insertedEmployees[6].id, skill: "Social Security Optimization" },
    { employeeId: insertedEmployees[12].id, endorserId: insertedEmployees[7].id, skill: "Medicare Planning" },
    { employeeId: insertedEmployees[12].id, endorserId: insertedEmployees[8].id, skill: "401k Rollovers" },
  ];

  // Insert endorsements with current timestamp
  for (const endorsement of endorsementData) {
    await db.insert(skillEndorsements).values({
      ...endorsement,
      createdAt: new Date().toISOString()
    });
  }
  
  console.log(`Seeded ${sampleEmployees.length} employees and ${endorsementData.length} skill endorsements`);
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