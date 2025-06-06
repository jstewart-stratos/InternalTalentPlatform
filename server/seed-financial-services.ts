import { db } from './db';
import { employees, departments } from '@shared/schema';

export async function seedFinancialServicesEmployees() {
  console.log('Creating financial services departments...');
  
  const financialDepartments = [
    { name: 'Investment Banking', description: 'Corporate finance, mergers & acquisitions, capital markets' },
    { name: 'Risk Management', description: 'Credit risk, market risk, operational risk assessment' },
    { name: 'Wealth Management', description: 'Private banking, portfolio management, financial planning' },
    { name: 'Insurance Underwriting', description: 'Policy evaluation, risk assessment, claims processing' },
    { name: 'Compliance & Regulatory', description: 'Regulatory compliance, audit, legal affairs' },
    { name: 'Actuarial Services', description: 'Statistical analysis, insurance mathematics, forecasting' },
    { name: 'Corporate Banking', description: 'Commercial lending, treasury services, cash management' },
    { name: 'Financial Technology', description: 'Fintech solutions, digital banking, payment systems' }
  ];

  for (const dept of financialDepartments) {
    await db.insert(departments).values(dept).onConflictDoNothing();
  }

  console.log('Creating 30 financial services employees...');

  const financialEmployees = [
    // Investment Banking
    {
      name: 'Michael Chen',
      email: 'mchen@stratosfinancial.com',
      title: 'Managing Director - Investment Banking',
      department: 'Investment Banking',
      experienceLevel: 'senior',
      bio: 'Leading M&A transactions and capital markets with 15+ years experience in investment banking.',
      skills: ['Mergers & Acquisitions', 'Capital Markets', 'Financial Modeling', 'Due Diligence', 'Equity Research', 'Debt Financing', 'IPO Management', 'Valuation Analysis', 'Corporate Finance', 'Investment Strategy'],
      location: 'New York, NY',
      userId: null
    },
    {
      name: 'Sarah Goldman',
      email: 'sgoldman@stratosfinancial.com',
      title: 'Vice President - Equity Capital Markets',
      department: 'Investment Banking',
      experienceLevel: 'senior',
      bio: 'Specialist in equity offerings and public market transactions with expertise in tech and healthcare sectors.',
      skills: ['Equity Capital Markets', 'IPO Execution', 'Secondary Offerings', 'SPAC Transactions', 'Financial Analysis', 'Client Relations', 'Market Research', 'Regulatory Compliance', 'Pitch Development', 'Deal Structuring'],
      location: 'New York, NY',
      userId: null
    },
    {
      name: 'David Rodriguez',
      email: 'drodriguez@stratosfinancial.com',
      title: 'Director - Leveraged Finance',
      department: 'Investment Banking',
      experienceLevel: 'senior',
      bio: 'Expert in leveraged buyouts and high-yield debt transactions for private equity clients.',
      skills: ['Leveraged Buyouts', 'High Yield Debt', 'Credit Analysis', 'Syndicated Loans', 'Private Equity', 'Financial Modeling', 'Risk Assessment', 'Covenant Analysis', 'Term Sheet Negotiation', 'Portfolio Management'],
      location: 'Chicago, IL',
      userId: null
    },
    {
      name: 'Emily Wang',
      email: 'ewang@stratosfinancial.com',
      title: 'Associate - M&A Advisory',
      department: 'Investment Banking',
      experienceLevel: 'mid',
      bio: 'M&A specialist focusing on middle-market transactions across various industries.',
      skills: ['M&A Advisory', 'Financial Due Diligence', 'Valuation Models', 'Comparable Analysis', 'Management Presentations', 'Data Room Management', 'Industry Research', 'Excel Modeling', 'PowerPoint', 'Client Communication'],
      location: 'San Francisco, CA',
      userId: null
    },

    // Risk Management
    {
      name: 'Robert Kim',
      email: 'rkim@stratosfinancial.com',
      title: 'Chief Risk Officer',
      department: 'Risk Management',
      experienceLevel: 'senior',
      bio: 'Leading enterprise risk management with focus on credit, market, and operational risk frameworks.',
      skills: ['Enterprise Risk Management', 'Credit Risk Modeling', 'Market Risk Analysis', 'Operational Risk', 'Basel III Compliance', 'Stress Testing', 'VaR Models', 'Risk Reporting', 'Regulatory Capital', 'CCAR'],
      location: 'New York, NY',
      userId: null
    },
    {
      name: 'Lisa Thompson',
      email: 'lthompson@stratosfinancial.com',
      title: 'Senior Risk Analyst - Credit Risk',
      department: 'Risk Management',
      experienceLevel: 'senior',
      bio: 'Quantitative analyst specializing in credit risk models and portfolio management.',
      skills: ['Credit Risk Modeling', 'Probability of Default', 'Loss Given Default', 'Portfolio Analysis', 'Python Programming', 'R Statistical Analysis', 'Monte Carlo Simulation', 'Credit Scoring', 'IFRS 9', 'Model Validation'],
      location: 'Charlotte, NC',
      userId: null
    },
    {
      name: 'James Wilson',
      email: 'jwilson@stratosfinancial.com',
      title: 'Market Risk Manager',
      department: 'Risk Management',
      experienceLevel: 'mid',
      bio: 'Managing market risk for trading portfolios and implementing risk measurement frameworks.',
      skills: ['Market Risk Management', 'Value at Risk', 'Scenario Analysis', 'Derivatives Pricing', 'Interest Rate Risk', 'FX Risk Management', 'Options Greeks', 'Risk Metrics', 'Bloomberg Terminal', 'Fixed Income Analytics'],
      location: 'London, UK',
      userId: null
    },
    {
      name: 'Anna Petrov',
      email: 'apetrov@stratosfinancial.com',
      title: 'Operational Risk Specialist',
      department: 'Risk Management',
      experienceLevel: 'mid',
      bio: 'Identifying and mitigating operational risks across business processes and technology systems.',
      skills: ['Operational Risk Assessment', 'Process Improvement', 'Risk Controls', 'Incident Management', 'Key Risk Indicators', 'Loss Data Analysis', 'Risk Reporting', 'Internal Controls', 'Fraud Prevention', 'Business Continuity'],
      location: 'Toronto, Canada',
      userId: null
    },

    // Wealth Management
    {
      name: 'Alexandra Foster',
      email: 'afoster@stratosfinancial.com',
      title: 'Senior Wealth Advisor',
      department: 'Wealth Management',
      experienceLevel: 'senior',
      bio: 'Managing high-net-worth client portfolios with expertise in alternative investments and estate planning.',
      skills: ['Portfolio Management', 'Estate Planning', 'Tax Strategy', 'Alternative Investments', 'Client Relations', 'Asset Allocation', 'Financial Planning', 'Trust Services', 'Private Equity', 'Hedge Funds'],
      location: 'Beverly Hills, CA',
      userId: null
    },
    {
      name: 'Thomas Burke',
      email: 'tburke@stratosfinancial.com',
      title: 'Portfolio Manager - Fixed Income',
      department: 'Wealth Management',
      experienceLevel: 'senior',
      bio: 'Fixed income specialist managing bond portfolios for institutional and private clients.',
      skills: ['Fixed Income Analysis', 'Bond Portfolio Management', 'Duration Management', 'Credit Analysis', 'Yield Curve Analysis', 'Municipal Bonds', 'Corporate Bonds', 'Treasury Securities', 'Interest Rate Strategy', 'Bloomberg Terminal'],
      location: 'Boston, MA',
      userId: null
    },
    {
      name: 'Maria Santos',
      email: 'msantos@stratosfinancial.com',
      title: 'Private Banker',
      department: 'Wealth Management',
      experienceLevel: 'mid',
      bio: 'Providing comprehensive banking and investment services to ultra-high-net-worth individuals.',
      skills: ['Private Banking', 'Relationship Management', 'Investment Advisory', 'Credit Facilities', 'International Banking', 'Family Office Services', 'Wealth Transfer', 'Philanthropic Advisory', 'Art Finance', 'Real Estate Finance'],
      location: 'Miami, FL',
      userId: null
    },
    {
      name: 'Kevin Lee',
      email: 'klee@stratosfinancial.com',
      title: 'Financial Planner',
      department: 'Wealth Management',
      experienceLevel: 'mid',
      bio: 'Comprehensive financial planning for high-net-worth families and business owners.',
      skills: ['Financial Planning', 'Retirement Planning', 'Insurance Planning', 'Investment Strategy', 'Tax Planning', 'Education Funding', 'Business Succession', 'Risk Management', 'Estate Planning', 'Goal-Based Planning'],
      location: 'Dallas, TX',
      userId: null
    },

    // Insurance Underwriting
    {
      name: 'Jennifer Adams',
      email: 'jadams@stratosfinancial.com',
      title: 'Chief Underwriting Officer',
      department: 'Insurance Underwriting',
      experienceLevel: 'senior',
      bio: 'Leading underwriting operations with expertise in commercial and specialty insurance lines.',
      skills: ['Insurance Underwriting', 'Risk Assessment', 'Policy Pricing', 'Claims Analysis', 'Reinsurance', 'Commercial Lines', 'Specialty Insurance', 'Catastrophe Modeling', 'Underwriting Guidelines', 'Portfolio Management'],
      location: 'Hartford, CT',
      userId: null
    },
    {
      name: 'Mark Davis',
      email: 'mdavis@stratosfinancial.com',
      title: 'Senior Underwriter - Property & Casualty',
      department: 'Insurance Underwriting',
      experienceLevel: 'senior',
      bio: 'Expert in property and casualty insurance underwriting with focus on commercial accounts.',
      skills: ['Property Insurance', 'Casualty Insurance', 'Commercial Underwriting', 'Risk Evaluation', 'Loss Control', 'Policy Terms', 'Coverage Analysis', 'Premium Calculation', 'Market Analysis', 'Broker Relations'],
      location: 'Atlanta, GA',
      userId: null
    },
    {
      name: 'Rachel Green',
      email: 'rgreen@stratosfinancial.com',
      title: 'Life Insurance Underwriter',
      department: 'Insurance Underwriting',
      experienceLevel: 'mid',
      bio: 'Specialized in life and disability insurance underwriting with medical background.',
      skills: ['Life Insurance', 'Disability Insurance', 'Medical Underwriting', 'Mortality Risk', 'Policy Issuance', 'Medical Records Review', 'Actuarial Analysis', 'Risk Classification', 'Insurance Regulations', 'Underwriting Software'],
      location: 'Phoenix, AZ',
      userId: null
    },

    // Compliance & Regulatory
    {
      name: 'Daniel Murphy',
      email: 'dmurphy@stratosfinancial.com',
      title: 'Chief Compliance Officer',
      department: 'Compliance & Regulatory',
      experienceLevel: 'senior',
      bio: 'Ensuring regulatory compliance across all business lines with expertise in financial regulations.',
      skills: ['Regulatory Compliance', 'AML Compliance', 'KYC Procedures', 'FINRA Regulations', 'SEC Compliance', 'BSA Compliance', 'Risk Assessment', 'Policy Development', 'Training Programs', 'Regulatory Reporting'],
      location: 'Washington, DC',
      userId: null
    },
    {
      name: 'Nicole Taylor',
      email: 'ntaylor@stratosfinancial.com',
      title: 'AML Compliance Manager',
      department: 'Compliance & Regulatory',
      experienceLevel: 'senior',
      bio: 'Anti-money laundering specialist with expertise in transaction monitoring and investigations.',
      skills: ['Anti-Money Laundering', 'Transaction Monitoring', 'Suspicious Activity Reports', 'Customer Due Diligence', 'Sanctions Compliance', 'Financial Crimes Investigation', 'RegTech Solutions', 'Risk Rating', 'OFAC Compliance', 'CTR Filing'],
      location: 'New York, NY',
      userId: null
    },
    {
      name: 'Brian Johnson',
      email: 'bjohnson@stratosfinancial.com',
      title: 'Regulatory Affairs Specialist',
      department: 'Compliance & Regulatory',
      experienceLevel: 'mid',
      bio: 'Managing regulatory relationships and ensuring compliance with evolving financial regulations.',
      skills: ['Regulatory Affairs', 'Dodd-Frank Compliance', 'MiFID II', 'GDPR Compliance', 'Regulatory Reporting', 'Examination Management', 'Policy Implementation', 'Regulatory Change Management', 'Documentation', 'Training Coordination'],
      location: 'Chicago, IL',
      userId: null
    },

    // Actuarial Services
    {
      name: 'Catherine Wong',
      email: 'cwong@stratosfinancial.com',
      title: 'Chief Actuary',
      department: 'Actuarial Services',
      experienceLevel: 'senior',
      bio: 'Leading actuarial function with expertise in life insurance and pension mathematics.',
      skills: ['Actuarial Science', 'Life Insurance Mathematics', 'Pension Actuarial', 'Mortality Modeling', 'Reserving', 'Capital Modeling', 'Solvency II', 'IFRS 17', 'Risk Management', 'Statistical Modeling'],
      location: 'Des Moines, IA',
      userId: null
    },
    {
      name: 'Steven Clark',
      email: 'sclark@stratosfinancial.com',
      title: 'Property & Casualty Actuary',
      department: 'Actuarial Services',
      experienceLevel: 'senior',
      bio: 'P&C actuary specializing in pricing, reserving, and catastrophe modeling.',
      skills: ['P&C Actuarial', 'Insurance Pricing', 'Loss Reserving', 'Catastrophe Modeling', 'Reinsurance Analysis', 'Predictive Modeling', 'GLM Modeling', 'Rate Filing', 'Capital Allocation', 'Profitability Analysis'],
      location: 'Milwaukee, WI',
      userId: null
    },
    {
      name: 'Amy Rodriguez',
      email: 'arodriguez@stratosfinancial.com',
      title: 'Pension Actuary',
      department: 'Actuarial Services',
      experienceLevel: 'mid',
      bio: 'Retirement benefits actuary focusing on defined benefit and defined contribution plans.',
      skills: ['Pension Actuarial', 'Retirement Benefits', 'ERISA Compliance', 'Plan Design', 'Actuarial Valuations', 'Liability Measurement', 'Investment Consulting', 'Benefit Administration', 'Regulatory Reporting', 'Plan Terminations'],
      location: 'Minneapolis, MN',
      userId: null
    },

    // Corporate Banking
    {
      name: 'Richard Brown',
      email: 'rbrown@stratosfinancial.com',
      title: 'Managing Director - Corporate Banking',
      department: 'Corporate Banking',
      experienceLevel: 'senior',
      bio: 'Leading corporate banking relationships with Fortune 500 companies and mid-market clients.',
      skills: ['Corporate Banking', 'Commercial Lending', 'Credit Analysis', 'Cash Management', 'Trade Finance', 'Treasury Services', 'Relationship Management', 'Risk Assessment', 'Loan Structuring', 'Credit Facilities'],
      location: 'New York, NY',
      userId: null
    },
    {
      name: 'Laura Martinez',
      email: 'lmartinez@stratosfinancial.com',
      title: 'Senior Credit Officer',
      department: 'Corporate Banking',
      experienceLevel: 'senior',
      bio: 'Commercial credit expert with focus on middle-market lending and credit risk management.',
      skills: ['Commercial Credit', 'Credit Underwriting', 'Financial Statement Analysis', 'Industry Analysis', 'Loan Documentation', 'Credit Risk Assessment', 'Portfolio Management', 'Workout & Restructuring', 'Covenant Monitoring', 'Credit Approval'],
      location: 'Houston, TX',
      userId: null
    },
    {
      name: 'Christopher Lee',
      email: 'clee@stratosfinancial.com',
      title: 'Treasury Services Manager',
      department: 'Corporate Banking',
      experienceLevel: 'mid',
      bio: 'Corporate treasury specialist providing cash management and payment solutions to business clients.',
      skills: ['Treasury Services', 'Cash Management', 'Payment Systems', 'Liquidity Management', 'Foreign Exchange', 'Interest Rate Products', 'Working Capital Solutions', 'ACH Processing', 'Wire Transfers', 'Account Analysis'],
      location: 'Charlotte, NC',
      userId: null
    },

    // Financial Technology
    {
      name: 'Samantha Park',
      email: 'spark@stratosfinancial.com',
      title: 'Head of Digital Innovation',
      department: 'Financial Technology',
      experienceLevel: 'senior',
      bio: 'Leading digital transformation initiatives and fintech partnerships across the organization.',
      skills: ['Digital Innovation', 'Fintech Strategy', 'API Development', 'Blockchain Technology', 'Digital Banking', 'Payment Processing', 'Cybersecurity', 'Data Analytics', 'Machine Learning', 'Cloud Computing'],
      location: 'San Francisco, CA',
      userId: null
    },
    {
      name: 'Andrew Chen',
      email: 'achen@stratosfinancial.com',
      title: 'Senior Software Engineer - Payments',
      department: 'Financial Technology',
      experienceLevel: 'senior',
      bio: 'Full-stack developer specializing in payment systems and financial technology solutions.',
      skills: ['Software Engineering', 'Payment Systems', 'Java Programming', 'Python Development', 'REST APIs', 'Microservices', 'Database Design', 'Security Protocols', 'DevOps', 'System Integration'],
      location: 'Austin, TX',
      userId: null
    },
    {
      name: 'Michelle Zhang',
      email: 'mzhang@stratosfinancial.com',
      title: 'Data Scientist - Risk Analytics',
      department: 'Financial Technology',
      experienceLevel: 'mid',
      bio: 'Data scientist developing machine learning models for risk assessment and fraud detection.',
      skills: ['Data Science', 'Machine Learning', 'Risk Analytics', 'Python Programming', 'R Statistical Analysis', 'SQL Databases', 'Fraud Detection', 'Predictive Modeling', 'Data Visualization', 'Statistical Analysis'],
      location: 'Seattle, WA',
      userId: null
    },
    {
      name: 'Jonathan White',
      email: 'jwhite@stratosfinancial.com',
      title: 'Cybersecurity Analyst',
      department: 'Financial Technology',
      experienceLevel: 'mid',
      bio: 'Information security specialist focusing on financial services cybersecurity and compliance.',
      skills: ['Cybersecurity', 'Information Security', 'Risk Assessment', 'Incident Response', 'Penetration Testing', 'Network Security', 'SIEM Tools', 'Compliance Monitoring', 'Threat Intelligence', 'Security Auditing'],
      location: 'Tampa, FL',
      userId: null
    },
    {
      name: 'Melissa Garcia',
      email: 'mgarcia@stratosfinancial.com',
      title: 'Product Manager - Digital Banking',
      department: 'Financial Technology',
      experienceLevel: 'mid',
      bio: 'Product manager driving digital banking initiatives and customer experience improvements.',
      skills: ['Product Management', 'Digital Banking', 'User Experience Design', 'Agile Development', 'Customer Analytics', 'Mobile Applications', 'API Strategy', 'Market Research', 'Stakeholder Management', 'Product Strategy'],
      location: 'Denver, CO',
      userId: null
    },
    {
      name: 'Paul Anderson',
      email: 'panderson@stratosfinancial.com',
      title: 'Quantitative Analyst',
      department: 'Risk Management',
      experienceLevel: 'mid',
      bio: 'Quantitative analyst developing mathematical models for trading and risk management.',
      skills: ['Quantitative Analysis', 'Mathematical Modeling', 'Derivatives Pricing', 'Monte Carlo Methods', 'Time Series Analysis', 'C++ Programming', 'MATLAB', 'Options Trading', 'Fixed Income Models', 'Volatility Modeling'],
      location: 'New York, NY',
      userId: null
    }
  ];

  for (const employee of financialEmployees) {
    await db.insert(employees).values(employee);
  }

  console.log('Successfully created 30 financial services employees');
}