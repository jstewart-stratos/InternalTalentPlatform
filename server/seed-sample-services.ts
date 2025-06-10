import { storage } from "./storage";

export async function seedSampleServices() {
  console.log("Seeding sample professional services...");

  // Get all employees and service categories
  const employees = await storage.getAllEmployees();
  const categories = await storage.getAllServiceCategories();

  if (employees.length === 0) {
    console.log("No employees found. Please seed employees first.");
    return { created: 0, skipped: 0, total: 0 };
  }

  if (categories.length === 0) {
    console.log("No service categories found. Please seed categories first.");
    return { created: 0, skipped: 0, total: 0 };
  }

  // Get category IDs by name for easier reference
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.name] = cat.id;
    return map;
  }, {} as Record<string, number>);

  const sampleServices = [
    {
      providerId: employees[0]?.id,
      categoryId: categoryMap["Financial Analysis & Consulting"],
      title: "Comprehensive Financial Risk Assessment",
      shortDescription: "Deep-dive analysis of your organization's financial risk profile with actionable mitigation strategies.",
      description: "I provide thorough financial risk assessments covering market risk, credit risk, operational risk, and liquidity risk. My analysis includes stress testing, scenario planning, and detailed recommendations for risk mitigation. With 8+ years in risk management at top-tier financial institutions, I help organizations identify vulnerabilities and implement robust risk frameworks.",
      pricingType: "fixed",
      fixedPrice: 285000, // $2,850
      deliveryTimeframe: "2-3 weeks",
      isRemote: true,
      isOnsite: false,
      maxClientsPerMonth: 3,
      offeredSkills: ["Risk Assessment", "Financial Analysis", "Stress Testing"],
      requiredSkills: ["Financial Statements", "Risk Management"]
    },
    {
      providerId: employees[1]?.id,
      categoryId: categoryMap["Investment Advisory"],
      title: "Portfolio Optimization & Strategy Development",
      shortDescription: "Expert portfolio analysis and optimization using modern portfolio theory and quantitative methods.",
      description: "Leverage my expertise in quantitative finance to optimize your investment portfolio. I provide comprehensive portfolio analysis, asset allocation strategies, and risk-adjusted return optimization. My approach combines fundamental analysis with quantitative models to deliver superior risk-adjusted returns. Perfect for institutional investors and high-net-worth individuals.",
      pricingType: "hourly",
      hourlyRate: 22500, // $225/hour
      deliveryTimeframe: "1-2 weeks per analysis",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 5,
      offeredSkills: ["Portfolio Management", "Quantitative Analysis", "Asset Allocation"],
      requiredSkills: ["Investment Strategy", "Financial Modeling"]
    },
    {
      providerId: employees[2]?.id,
      categoryId: categoryMap["Regulatory Compliance"],
      title: "AML/KYC Compliance Program Development",
      shortDescription: "Design and implement comprehensive Anti-Money Laundering and Know Your Customer compliance programs.",
      description: "I specialize in developing robust AML/KYC compliance programs that meet regulatory requirements while optimizing operational efficiency. My services include policy development, procedure documentation, staff training, and ongoing monitoring systems. With extensive experience in financial crimes prevention, I ensure your organization stays compliant with evolving regulations.",
      pricingType: "fixed",
      fixedPrice: 450000, // $4,500
      deliveryTimeframe: "4-6 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["AML Compliance", "KYC Procedures", "Regulatory Reporting"],
      requiredSkills: ["Compliance", "Risk Management"]
    },
    {
      providerId: employees[3]?.id,
      categoryId: categoryMap["Business Intelligence"],
      title: "Financial Data Analytics & Dashboard Creation",
      shortDescription: "Transform your financial data into actionable insights with custom analytics solutions and interactive dashboards.",
      description: "I create sophisticated financial analytics solutions that turn complex data into clear, actionable insights. My services include data pipeline development, custom dashboard creation, automated reporting, and predictive analytics models. Using tools like Tableau, Power BI, and Python, I help organizations make data-driven financial decisions.",
      pricingType: "hourly",
      hourlyRate: 18500, // $185/hour
      deliveryTimeframe: "2-4 weeks",
      isRemote: true,
      isOnsite: false,
      maxClientsPerMonth: 4,
      offeredSkills: ["Data Analytics", "Dashboard Development", "Financial Reporting"],
      requiredSkills: ["Business Intelligence", "Data Analysis"]
    },
    {
      providerId: employees[4]?.id,
      categoryId: categoryMap["Process Optimization"],
      title: "Treasury Operations Optimization",
      shortDescription: "Streamline treasury operations through process automation and workflow optimization.",
      description: "Optimize your treasury operations with my expertise in process improvement and automation. I analyze current workflows, identify inefficiencies, and implement solutions that reduce manual work while improving accuracy. My approach includes cash flow forecasting automation, payment processing optimization, and risk management integration.",
      pricingType: "consultation",
      consultationRate: 35000, // $350/consultation
      deliveryTimeframe: "Initial consultation: 2 hours, Implementation: 3-5 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 8,
      offeredSkills: ["Process Improvement", "Treasury Management", "Automation"],
      requiredSkills: ["Operations", "Financial Systems"]
    },
    {
      providerId: employees[5]?.id,
      categoryId: categoryMap["Technology Integration"],
      title: "FinTech Integration & Digital Transformation",
      shortDescription: "Navigate digital transformation with expert guidance on FinTech solutions and system integration.",
      description: "Lead your organization's digital transformation with my expertise in FinTech integration. I provide strategic guidance on technology selection, implementation planning, and change management. My services cover API integration, blockchain solutions, digital payment systems, and regulatory technology adoption.",
      pricingType: "hourly",
      hourlyRate: 27500, // $275/hour
      deliveryTimeframe: "Project-dependent, typically 6-12 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 3,
      offeredSkills: ["Digital Transformation", "API Integration", "FinTech Strategy"],
      requiredSkills: ["Technology", "Project Management"]
    },
    {
      providerId: employees[6]?.id,
      categoryId: categoryMap["Training & Development"],
      title: "Financial Risk Management Training Program",
      shortDescription: "Comprehensive training programs for financial professionals on modern risk management practices.",
      description: "Elevate your team's risk management capabilities with my comprehensive training programs. I design customized curricula covering market risk, credit risk, operational risk, and regulatory compliance. Training includes case studies, practical exercises, and certification preparation. Available for groups of 5-25 participants.",
      pricingType: "fixed",
      fixedPrice: 125000, // $1,250 per participant
      deliveryTimeframe: "2-day intensive or 6-week extended program",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["Training Development", "Risk Management", "Professional Education"],
      requiredSkills: ["Risk Management", "Training"]
    },
    {
      providerId: employees[7]?.id,
      categoryId: categoryMap["Audit & Assurance"],
      title: "Internal Controls Assessment & SOX Compliance",
      shortDescription: "Comprehensive internal controls evaluation and Sarbanes-Oxley compliance assessment.",
      description: "Ensure robust internal controls and SOX compliance with my specialized audit services. I conduct thorough assessments of your control environment, identify gaps, and provide detailed remediation plans. My approach includes risk-based testing, documentation review, and management reporting that meets regulatory standards.",
      pricingType: "fixed",
      fixedPrice: 380000, // $3,800
      deliveryTimeframe: "4-6 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["Internal Audit", "SOX Compliance", "Controls Testing"],
      requiredSkills: ["Audit", "Compliance"]
    },
    {
      providerId: employees[8]?.id,
      categoryId: categoryMap["Strategic Planning"],
      title: "Financial Strategy & Business Plan Development",
      shortDescription: "Strategic financial planning and comprehensive business plan development for growth-oriented organizations.",
      description: "Drive your organization's growth with strategic financial planning and business plan development. I provide comprehensive financial modeling, market analysis, competitive positioning, and growth strategy development. My deliverables include detailed financial projections, funding strategies, and implementation roadmaps.",
      pricingType: "fixed",
      fixedPrice: 520000, // $5,200
      deliveryTimeframe: "6-8 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["Strategic Planning", "Financial Modeling", "Business Development"],
      requiredSkills: ["Strategy", "Financial Planning"]
    },
    {
      providerId: employees[0]?.id,
      categoryId: categoryMap["Investment Advisory"],
      title: "ESG Investment Strategy Consulting",
      shortDescription: "Develop sustainable investment strategies aligned with ESG principles and regulatory requirements.",
      description: "Navigate the growing ESG investment landscape with expert guidance on sustainable investing strategies. I help institutions develop ESG frameworks, assess portfolio alignment, and implement sustainable investment policies. My approach balances financial returns with environmental and social impact.",
      pricingType: "hourly",
      hourlyRate: 32500, // $325/hour
      deliveryTimeframe: "2-4 weeks per engagement",
      isRemote: true,
      isOnsite: false,
      maxClientsPerMonth: 4,
      offeredSkills: ["ESG Analysis", "Sustainable Investing", "Impact Measurement"],
      requiredSkills: ["Investment Strategy", "ESG"]
    },
    {
      providerId: employees[1]?.id,
      categoryId: categoryMap["Financial Analysis & Consulting"],
      title: "Merger & Acquisition Financial Due Diligence",
      shortDescription: "Comprehensive financial due diligence services for M&A transactions and strategic investments.",
      description: "Mitigate deal risk with thorough financial due diligence. I provide comprehensive analysis of target companies including financial statement review, working capital analysis, debt structure assessment, and quality of earnings studies. My reports help buyers make informed decisions and structure optimal deals.",
      pricingType: "fixed",
      fixedPrice: 680000, // $6,800
      deliveryTimeframe: "3-4 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["Due Diligence", "M&A Analysis", "Valuation"],
      requiredSkills: ["Financial Analysis", "M&A"]
    },
    {
      providerId: employees[2]?.id,
      categoryId: categoryMap["Regulatory Compliance"],
      title: "GDPR & Data Privacy Compliance for Financial Services",
      shortDescription: "Comprehensive GDPR compliance program development specifically tailored for financial institutions.",
      description: "Ensure GDPR compliance with my specialized expertise in financial services data privacy. I provide comprehensive privacy impact assessments, policy development, staff training, and ongoing compliance monitoring. My approach addresses the unique challenges financial institutions face with customer data protection.",
      pricingType: "fixed",
      fixedPrice: 295000, // $2,950
      deliveryTimeframe: "3-5 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 3,
      offeredSkills: ["GDPR Compliance", "Data Privacy", "Policy Development"],
      requiredSkills: ["Compliance", "Data Privacy"]
    },
    {
      providerId: employees[3]?.id,
      categoryId: categoryMap["Business Intelligence"],
      title: "Regulatory Reporting Automation",
      shortDescription: "Automate complex regulatory reporting processes to improve accuracy and reduce manual effort.",
      description: "Transform your regulatory reporting with automation solutions that ensure accuracy and timeliness. I design and implement automated reporting systems for capital adequacy, liquidity ratios, stress testing, and other regulatory requirements. My solutions integrate with existing systems and provide audit trails.",
      pricingType: "hourly",
      hourlyRate: 24500, // $245/hour
      deliveryTimeframe: "4-8 weeks implementation",
      isRemote: true,
      isOnsite: false,
      maxClientsPerMonth: 3,
      offeredSkills: ["Reporting Automation", "Regulatory Technology", "Data Integration"],
      requiredSkills: ["Regulatory Reporting", "Automation"]
    },
    {
      providerId: employees[4]?.id,
      categoryId: categoryMap["Technology Integration"],
      title: "Blockchain & Cryptocurrency Strategy",
      shortDescription: "Strategic guidance on blockchain adoption and cryptocurrency integration for traditional financial institutions.",
      description: "Navigate the blockchain and cryptocurrency landscape with expert strategic guidance. I help traditional financial institutions evaluate blockchain opportunities, develop digital asset strategies, and implement distributed ledger solutions. My approach balances innovation with risk management and regulatory compliance.",
      pricingType: "consultation",
      consultationRate: 45000, // $450/consultation
      deliveryTimeframe: "Initial strategy: 2-3 weeks, Implementation: varies",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 6,
      offeredSkills: ["Blockchain Strategy", "Cryptocurrency", "Digital Assets"],
      requiredSkills: ["Blockchain", "Digital Finance"]
    },
    {
      providerId: employees[5]?.id,
      categoryId: categoryMap["Audit & Assurance"],
      title: "Cybersecurity Risk Assessment for Financial Services",
      shortDescription: "Comprehensive cybersecurity risk assessment and remediation planning for financial institutions.",
      description: "Protect your organization with comprehensive cybersecurity risk assessments tailored for financial services. I evaluate your security posture, identify vulnerabilities, and provide detailed remediation plans. My assessments cover network security, data protection, incident response, and regulatory compliance requirements.",
      pricingType: "fixed",
      fixedPrice: 420000, // $4,200
      deliveryTimeframe: "4-5 weeks",
      isRemote: true,
      isOnsite: true,
      maxClientsPerMonth: 2,
      offeredSkills: ["Cybersecurity", "Risk Assessment", "Security Controls"],
      requiredSkills: ["Cybersecurity", "Risk Management"]
    }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const serviceData of sampleServices) {
    try {
      // Skip if providerId is undefined (not enough employees)
      if (!serviceData.providerId) {
        skippedCount++;
        console.log(`- Skipped service (no provider): ${serviceData.title}`);
        continue;
      }

      await storage.createProfessionalService(serviceData);
      createdCount++;
      console.log(`✓ Created service: ${serviceData.title}`);
    } catch (error) {
      console.error(`✗ Failed to create service ${serviceData.title}:`, error);
      skippedCount++;
    }
  }

  console.log(`Sample services seeding completed:`);
  console.log(`- Created: ${createdCount} services`);
  console.log(`- Skipped: ${skippedCount} services`);
  
  return {
    created: createdCount,
    skipped: skippedCount,
    total: sampleServices.length
  };
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSampleServices()
    .then((result) => {
      console.log("Seeding completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}