import { db } from "./db";
import { projects, employees } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedSampleProjects() {
  console.log("Starting to seed sample projects...");

  // Get all employees to assign as project owners
  const allEmployees = await db.select().from(employees);
  
  if (allEmployees.length === 0) {
    console.log("No employees found. Cannot seed projects.");
    return;
  }

  const sampleProjects = [
    {
      title: "Digital Banking Platform Modernization",
      description: "Upgrade legacy core banking systems to modern cloud-based architecture with enhanced security, real-time processing, and improved customer experience. Implementation includes API development, microservices architecture, and integration with third-party fintech solutions.",
      status: "active" as const,
      priority: "high" as const,
      requiredSkills: ["Cloud Architecture", "API Development", "Microservices", "Cybersecurity", "Java", "Python", "AWS", "Database Design"],
      estimatedDuration: "18 months",
      budget: "$2.5M",
      deadline: new Date("2025-12-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "AI-Powered Fraud Detection System",
      description: "Develop machine learning models to detect fraudulent transactions in real-time. System will analyze patterns, behavioral anomalies, and risk factors to prevent financial crimes while minimizing false positives.",
      status: "planning" as const,
      priority: "critical" as const,
      requiredSkills: ["Machine Learning", "Python", "Data Science", "AI/ML", "Statistical Analysis", "Real-time Processing", "Fraud Prevention", "TensorFlow"],
      estimatedDuration: "12 months",
      budget: "$1.8M",
      deadline: new Date("2025-10-30"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Customer Onboarding Digital Transformation",
      description: "Streamline customer acquisition process through digital identity verification, automated KYC/AML checks, and paperless account opening. Integration with regulatory compliance systems and enhanced user experience design.",
      status: "active" as const,
      priority: "medium" as const,
      requiredSkills: ["Digital Identity", "KYC/AML Compliance", "Process Automation", "UX/UI Design", "Regulatory Compliance", "Document Management", "React", "Node.js"],
      estimatedDuration: "8 months",
      budget: "$950K",
      deadline: new Date("2025-08-20"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Insurance Claims Automation Platform",
      description: "Build intelligent claims processing system using OCR, natural language processing, and automated decision engines. Reduce processing time from weeks to hours while maintaining accuracy and compliance.",
      status: "planning" as const,
      priority: "high" as const,
      requiredSkills: ["Process Automation", "OCR Technology", "Natural Language Processing", "Insurance Operations", "Claims Processing", "Document Analysis", "Python", "Machine Learning"],
      estimatedDuration: "14 months",
      budget: "$2.1M",
      deadline: new Date("2026-01-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Regulatory Reporting Compliance System",
      description: "Implement automated regulatory reporting for BASEL III, Solvency II, and local financial regulations. Real-time data collection, validation, and submission to regulatory authorities with audit trails.",
      status: "active" as const,
      priority: "critical" as const,
      requiredSkills: ["Regulatory Compliance", "Financial Reporting", "Data Governance", "Audit Trails", "BASEL III", "Solvency II", "SQL", "ETL Processes"],
      estimatedDuration: "10 months",
      budget: "$1.4M",
      deadline: new Date("2025-09-30"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Open Banking API Gateway",
      description: "Develop secure API gateway for open banking initiatives, enabling third-party access to customer data with consent management, rate limiting, and comprehensive security controls.",
      status: "planning" as const,
      priority: "medium" as const,
      requiredSkills: ["Open Banking", "API Gateway", "OAuth 2.0", "API Security", "Consent Management", "Rate Limiting", "Java", "Spring Boot"],
      estimatedDuration: "6 months",
      budget: "$750K",
      deadline: new Date("2025-07-31"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Robo-Advisor Investment Platform",
      description: "Create AI-driven investment advisory platform with portfolio optimization, risk assessment, and automated rebalancing. Integration with market data feeds and regulatory compliance for investment advice.",
      status: "active" as const,
      priority: "medium" as const,
      requiredSkills: ["Investment Management", "Portfolio Optimization", "Risk Assessment", "Market Data", "Financial Modeling", "Python", "React", "Financial Planning"],
      estimatedDuration: "16 months",
      budget: "$2.8M",
      deadline: new Date("2026-03-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Blockchain Trade Finance Platform",
      description: "Implement blockchain-based trade finance solution for letter of credits, supply chain financing, and international trade documentation. Smart contracts for automated execution and settlement.",
      status: "planning" as const,
      priority: "medium" as const,
      requiredSkills: ["Blockchain Technology", "Smart Contracts", "Trade Finance", "Supply Chain Finance", "Ethereum", "Solidity", "Cryptography", "International Trade"],
      estimatedDuration: "20 months",
      budget: "$3.2M",
      deadline: new Date("2026-06-30"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Real-Time Risk Management Dashboard",
      description: "Develop comprehensive risk monitoring dashboard with real-time market risk, credit risk, and operational risk metrics. Advanced analytics and early warning systems for risk mitigation.",
      status: "active" as const,
      priority: "high" as const,
      requiredSkills: ["Risk Management", "Real-time Analytics", "Market Risk", "Credit Risk", "Data Visualization", "Dashboard Development", "React", "Python"],
      estimatedDuration: "9 months",
      budget: "$1.2M",
      deadline: new Date("2025-11-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Mobile Banking Security Enhancement",
      description: "Upgrade mobile banking app security with biometric authentication, behavioral analytics, device fingerprinting, and advanced encryption. Enhanced user experience while maintaining security.",
      status: "planning" as const,
      priority: "critical" as const,
      requiredSkills: ["Mobile Security", "Biometric Authentication", "Behavioral Analytics", "iOS Development", "Android Development", "Encryption", "Device Fingerprinting", "UX/UI Design"],
      estimatedDuration: "7 months",
      budget: "$890K",
      deadline: new Date("2025-08-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "ESG Investment Analytics Platform",
      description: "Build environmental, social, and governance (ESG) investment analysis platform with sustainability scoring, impact measurement, and regulatory ESG reporting capabilities.",
      status: "planning" as const,
      priority: "medium" as const,
      requiredSkills: ["ESG Analysis", "Sustainability Metrics", "Investment Analytics", "Data Science", "ESG Reporting", "Python", "Tableau", "Financial Modeling"],
      estimatedDuration: "11 months",
      budget: "$1.6M",
      deadline: new Date("2026-01-31"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Digital Insurance Marketplace",
      description: "Create online marketplace for insurance products with comparison tools, instant quotes, digital policy issuance, and integrated payment processing. Multi-carrier platform with white-label options.",
      status: "active" as const,
      priority: "medium" as const,
      requiredSkills: ["Insurance Products", "E-commerce Platform", "Payment Processing", "Policy Management", "React", "Node.js", "Insurance Underwriting", "API Integration"],
      estimatedDuration: "13 months",
      budget: "$2.2M",
      deadline: new Date("2026-02-28"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Cryptocurrency Trading Infrastructure",
      description: "Develop institutional-grade cryptocurrency trading platform with custody solutions, regulatory compliance, risk management, and integration with traditional banking systems.",
      status: "planning" as const,
      priority: "high" as const,
      requiredSkills: ["Cryptocurrency", "Trading Systems", "Custody Solutions", "Blockchain Technology", "Risk Management", "Regulatory Compliance", "Java", "Python"],
      estimatedDuration: "15 months",
      budget: "$2.9M",
      deadline: new Date("2026-04-30"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Mortgage Origination System Upgrade",
      description: "Modernize mortgage loan origination with automated underwriting, income verification, credit decisioning, and regulatory compliance. Integration with credit bureaus and property valuation services.",
      status: "active" as const,
      priority: "medium" as const,
      requiredSkills: ["Mortgage Lending", "Automated Underwriting", "Credit Analysis", "Income Verification", "Regulatory Compliance", "API Integration", "Java", "SQL"],
      estimatedDuration: "12 months",
      budget: "$1.7M",
      deadline: new Date("2025-12-31"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Parametric Insurance Products Platform",
      description: "Build platform for parametric insurance products using satellite data, weather APIs, and IoT sensors for automatic claim triggers. Real-time monitoring and instant payouts based on predefined parameters.",
      status: "planning" as const,
      priority: "medium" as const,
      requiredSkills: ["Parametric Insurance", "IoT Integration", "Satellite Data", "Weather APIs", "Automated Claims", "Real-time Monitoring", "Python", "Machine Learning"],
      estimatedDuration: "14 months",
      budget: "$2.4M",
      deadline: new Date("2026-05-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Central Bank Digital Currency (CBDC) Pilot",
      description: "Participate in central bank digital currency pilot program with wallet development, transaction processing, privacy controls, and integration with existing payment systems.",
      status: "planning" as const,
      priority: "critical" as const,
      requiredSkills: ["Central Bank Digital Currency", "Digital Wallets", "Privacy Controls", "Payment Systems", "Blockchain Technology", "Cryptography", "Regulatory Compliance", "Security"],
      estimatedDuration: "18 months",
      budget: "$3.5M",
      deadline: new Date("2026-08-31"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "AI Customer Service Chatbot",
      description: "Deploy advanced AI chatbot for customer service with natural language understanding, sentiment analysis, and seamless handoff to human agents. Multi-channel support including web, mobile, and social media.",
      status: "active" as const,
      priority: "medium" as const,
      requiredSkills: ["Artificial Intelligence", "Natural Language Processing", "Chatbot Development", "Customer Service", "Sentiment Analysis", "Python", "Machine Learning", "API Integration"],
      estimatedDuration: "8 months",
      budget: "$920K",
      deadline: new Date("2025-09-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Financial Crime Prevention Analytics",
      description: "Implement advanced analytics platform for anti-money laundering (AML), sanctions screening, and financial crime detection. Graph analytics for relationship mapping and suspicious activity detection.",
      status: "active" as const,
      priority: "critical" as const,
      requiredSkills: ["AML Compliance", "Financial Crime Prevention", "Graph Analytics", "Sanctions Screening", "Data Analytics", "Machine Learning", "Python", "Network Analysis"],
      estimatedDuration: "10 months",
      budget: "$1.5M",
      deadline: new Date("2025-10-31"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Climate Risk Assessment Framework",
      description: "Develop climate risk assessment framework for loan portfolios and investment decisions. Integration of climate data, scenario analysis, and stress testing for climate-related financial risks.",
      status: "planning" as const,
      priority: "medium" as const,
      requiredSkills: ["Climate Risk", "Risk Assessment", "Environmental Data", "Scenario Analysis", "Stress Testing", "Financial Modeling", "Python", "Data Science"],
      estimatedDuration: "11 months",
      budget: "$1.3M",
      deadline: new Date("2026-01-15"),
      ownerId: getRandomEmployee(allEmployees).id
    },
    {
      title: "Quantum-Safe Cryptography Implementation",
      description: "Prepare for quantum computing threats by implementing post-quantum cryptography across all systems. Security assessment, algorithm migration, and future-proofing of cryptographic infrastructure.",
      status: "planning" as const,
      priority: "high" as const,
      requiredSkills: ["Quantum Computing", "Post-Quantum Cryptography", "Security Architecture", "Cryptography", "Risk Assessment", "Security Implementation", "Java", "C++"],
      estimatedDuration: "24 months",
      budget: "$4.1M",
      deadline: new Date("2026-12-31"),
      ownerId: getRandomEmployee(allEmployees).id
    }
  ];

  // Insert projects in batches
  const batchSize = 5;
  for (let i = 0; i < sampleProjects.length; i += batchSize) {
    const batch = sampleProjects.slice(i, i + batchSize);
    try {
      await db.insert(projects).values(batch);
      console.log(`Inserted projects batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sampleProjects.length / batchSize)}`);
    } catch (error) {
      console.error(`Error inserting projects batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }

  console.log(`Successfully seeded ${sampleProjects.length} sample projects`);
}

function getRandomEmployee(employees: any[]) {
  return employees[Math.floor(Math.random() * employees.length)];
}