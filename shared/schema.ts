import { pgTable, text, serial, integer, boolean, json, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // admin, user, team-manager
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  title: text("title").notNull(),
  address: text("address"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  yearsExperience: integer("years_experience").notNull(),
  experienceLevel: text("experience_level").notNull().default("Mid-level"),
  skills: text("skills").array().notNull(),
  expertiseAreas: text("expertise_areas").array().default([]),
  availabilityStatus: text("availability_status").default("available"), // available, busy, unavailable
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, slack, teams, phone
  maxMentees: integer("max_mentees").default(0),
  isExpertDirectoryVisible: boolean("is_expert_directory_visible").default(true),
});

export const employeesRelations = pgTable("employees_relations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  relatedEmployeeId: integer("related_employee_id").notNull(),
  type: text("type").notNull(), // colleague, mentor, mentee, collaborator
});

export const skillEndorsements = pgTable("skill_endorsements", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  endorserId: integer("endorser_id").notNull(),
  skill: text("skill").notNull(),
  createdAt: text("created_at").notNull(),
});

export const skillSearches = pgTable("skill_searches", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  searchedAt: text("searched_at").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull().references(() => employees.id),
  status: text("status", { enum: ["planning", "active", "paused", "completed", "closed"] }).default("planning").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  deadline: timestamp("deadline"),
  requiredSkills: text("required_skills").array().default([]).notNull(),
  estimatedDuration: text("estimated_duration"),
  budget: text("budget"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectApplications = pgTable("project_applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  applicantId: integer("applicant_id").notNull().references(() => employees.id),
  message: text("message"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Site settings table for admin panel
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default("general"), // general, security, features, notifications
  isPublic: boolean("is_public").notNull().default(false),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin audit log table
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // user_created, user_updated, user_deactivated, setting_changed, etc.
  targetType: varchar("target_type").notNull(), // user, employee, project, setting
  targetId: varchar("target_id"),
  changes: jsonb("changes"), // JSON of what changed
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User permissions table
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  permission: varchar("permission").notNull(), // manage_users, manage_settings, view_analytics, etc.
  grantedBy: varchar("granted_by").notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  profileImage: text("profile_image"),
  website: text("website"),
  specialties: text("specialties").array().default([]),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  role: text("role").default("member"), // manager, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  approvedBy: integer("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
});

// Team service categories
export const teamServiceCategories = pgTable("team_service_categories", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const expertiseRequests = pgTable("expertise_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => employees.id),
  expertId: integer("expert_id").notNull().references(() => employees.id),
  skill: text("skill").notNull(),
  message: text("message"),
  status: text("status").default("pending"), // pending, accepted, declined, completed
  urgency: text("urgency").default("medium"), // low, medium, high
  estimatedDuration: text("estimated_duration"), // "30 minutes", "1 hour", "half day", etc.
  scheduledDate: timestamp("scheduled_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual skill experience levels for granular tracking
export const employeeSkills = pgTable("employee_skills", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  skillName: text("skill_name").notNull(),
  experienceLevel: text("experience_level").notNull().default("beginner"), // "beginner", "intermediate", "advanced", "expert"
  yearsOfExperience: integer("years_of_experience").default(0),
  lastUsed: timestamp("last_used"),
  isEndorsed: boolean("is_endorsed").default(false),
  endorsementCount: integer("endorsement_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillExpertise = pgTable("skill_expertise", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  skill: text("skill").notNull(),
  expertiseLevel: text("expertise_level").notNull(), // beginner, intermediate, advanced, expert
  yearsOfExperience: integer("years_of_experience").default(0),
  certifications: text("certifications").array().default([]),
  isWillingToMentor: boolean("is_willing_to_mentor").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
}).extend({
  address: z.string().optional(),
  expertiseAreas: z.array(z.string()).optional(),
  availabilityStatus: z.enum(["available", "busy", "unavailable"]).optional(),
  preferredContactMethod: z.enum(["email", "slack", "teams", "phone"]).optional(),
  maxMentees: z.number().min(0).optional(),
  isExpertDirectoryVisible: z.boolean().optional(),
});

export const insertExpertiseRequestSchema = createInsertSchema(expertiseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSkillSchema = createInsertSchema(employeeSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillExpertiseSchema = createInsertSchema(skillExpertise).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectApplicationSchema = createInsertSchema(projectApplications).omit({
  id: true,
  appliedAt: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  grantedAt: true,
});



// Saved skill recommendations table
export const savedSkillRecommendations = pgTable("saved_skill_recommendations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  skill: text("skill").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  reason: text("reason").notNull(),
  projectDemand: integer("project_demand").default(0),
  status: text("status").default("saved"), // saved, in_progress, completed, archived
  learningPathGenerated: boolean("learning_path_generated").default(false),
  learningPathData: jsonb("learning_path_data"), // Store the full learning path JSON
  progressPercentage: integer("progress_percentage").default(0),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
});

// Learning path cache table
export const learningPathCache = pgTable("learning_path_cache", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  context: text("context").default("general"), // general, financial, tech, etc.
  currentLevel: text("current_level").default("beginner"),
  targetLevel: text("target_level").default("intermediate"),
  learningPathData: jsonb("learning_path_data").notNull(),
  generatedBy: text("generated_by").default("openai"), // openai, curated, hybrid
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  usageCount: integer("usage_count").default(1),
}, (table) => [
  index("learning_path_cache_skill_idx").on(table.skill),
  index("learning_path_cache_context_idx").on(table.context),
]);

// Learning step completions table for tracking individual step progress
export const learningStepCompletions = pgTable("learning_step_completions", {
  id: serial("id").primaryKey(),
  savedRecommendationId: integer("saved_recommendation_id").references(() => savedSkillRecommendations.id).notNull(),
  stepIndex: integer("step_index").notNull(),
  stepTitle: text("step_title").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  notes: text("notes"), // User notes about their learning
  resourcesCompleted: text("resources_completed").array().default([]), // URLs of completed resources
}, (table) => [
  index("learning_step_completions_recommendation_idx").on(table.savedRecommendationId),
]);

// User authentication schemas - removed duplicate

export const insertSavedSkillRecommendationSchema = createInsertSchema(savedSkillRecommendations).omit({
  id: true,
  savedAt: true,
  lastAccessedAt: true,
  completedAt: true,
});

export const insertLearningStepCompletionSchema = createInsertSchema(learningStepCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertLearningPathCacheSchema = createInsertSchema(learningPathCache).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  usageCount: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SavedSkillRecommendation = typeof savedSkillRecommendations.$inferSelect;
export type InsertSavedSkillRecommendation = z.infer<typeof insertSavedSkillRecommendationSchema>;
export type LearningPathCache = typeof learningPathCache.$inferSelect;
export type InsertLearningPathCache = z.infer<typeof insertLearningPathCacheSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectApplication = z.infer<typeof insertProjectApplicationSchema>;
export type ProjectApplication = typeof projectApplications.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof adminAuditLog.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

export type InsertExpertiseRequest = z.infer<typeof insertExpertiseRequestSchema>;
export type ExpertiseRequest = typeof expertiseRequests.$inferSelect;
export type InsertEmployeeSkill = z.infer<typeof insertEmployeeSkillSchema>;
export type EmployeeSkill = typeof employeeSkills.$inferSelect;
export type InsertSkillExpertise = z.infer<typeof insertSkillExpertiseSchema>;
export type SkillExpertise = typeof skillExpertise.$inferSelect;

// Professional Services Marketplace Tables

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Icon name for UI
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const professionalServices = pgTable("professional_services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => employees.id),
  teamId: integer("team_id").references(() => teams.id), // Optional: service offered by team
  teamCategoryId: integer("team_category_id").references(() => teamServiceCategories.id), // Team-specific categories
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"), // Brief summary for cards
  serviceType: text("service_type").notNull().default("individual"), // individual, team
  
  // Pricing structure
  pricingType: text("pricing_type").notNull().default("hourly"), // hourly, fixed, consultation, package
  hourlyRate: integer("hourly_rate"), // in cents
  fixedPrice: integer("fixed_price"), // in cents
  consultationRate: integer("consultation_rate"), // in cents for initial consultation
  packageDetails: jsonb("package_details"), // {packages: [{name, price, description, duration}]}
  
  // Service details
  duration: integer("duration"), // in minutes for fixed duration services
  minDuration: integer("min_duration"), // minimum booking duration in minutes
  maxDuration: integer("max_duration"), // maximum booking duration in minutes
  deliveryTimeframe: text("delivery_timeframe"), // "24 hours", "3-5 business days", etc.
  
  // Availability and requirements
  isRemote: boolean("is_remote").notNull().default(true),
  isOnsite: boolean("is_onsite").notNull().default(false),
  requiresPrequalification: boolean("requires_prequalification").default(false),
  maxClientsPerMonth: integer("max_clients_per_month"),
  
  // Service status
  isActive: boolean("is_active").notNull().default(true),
  isPaused: boolean("is_paused").notNull().default(false),
  pauseReason: text("pause_reason"),
  
  // Skills and expertise required/offered
  requiredSkills: text("required_skills").array().default([]),
  offeredSkills: text("offered_skills").array().default([]),
  
  // Metadata
  viewCount: integer("view_count").default(0),
  bookingCount: integer("booking_count").default(0),
  averageRating: integer("average_rating"), // 1-5 stars * 100 (for precision)
  totalReviews: integer("total_reviews").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceBookings = pgTable("service_bookings", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => professionalServices.id),
  clientId: integer("client_id").notNull().references(() => employees.id),
  providerId: integer("provider_id").notNull().references(() => employees.id),
  
  // Booking details
  status: text("status").notNull().default("pending"), // pending, confirmed, in_progress, completed, cancelled, rejected
  bookingType: text("booking_type").notNull(), // matches service pricing type
  
  // Scheduling
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  timezone: text("timezone").default("UTC"),
  
  // Pricing and payment
  agreedRate: integer("agreed_rate").notNull(), // in cents
  estimatedHours: integer("estimated_hours"), // for hourly services
  actualHours: integer("actual_hours"),
  totalAmount: integer("total_amount"), // in cents
  currency: text("currency").notNull().default("USD"),
  
  // Communication
  clientMessage: text("client_message"), // Initial request message
  providerResponse: text("provider_response"), // Provider's response
  requirements: text("requirements"), // Detailed requirements
  deliverables: text("deliverables"), // Expected deliverables
  
  // Meeting details
  meetingLocation: text("meeting_location"), // For onsite services
  meetingLink: text("meeting_link"), // For remote services
  meetingNotes: text("meeting_notes"),
  
  // Completion and feedback
  isCompleted: boolean("is_completed").default(false),
  completionNotes: text("completion_notes"),
  clientRating: integer("client_rating"), // 1-5 stars
  clientReview: text("client_review"),
  providerRating: integer("provider_rating"), // Provider rates client
  providerReview: text("provider_review"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceReviews = pgTable("service_reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => professionalServices.id),
  bookingId: integer("booking_id").references(() => serviceBookings.id),
  reviewerId: integer("reviewer_id").notNull().references(() => employees.id),
  providerId: integer("provider_id").notNull().references(() => employees.id),
  
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  review: text("review").notNull(),
  pros: text("pros").array().default([]),
  cons: text("cons").array().default([]),
  wouldRecommend: boolean("would_recommend").default(true),
  
  isVerified: boolean("is_verified").default(false), // Verified as actual client
  isHelpful: integer("is_helpful").default(0), // Helpful votes count
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const servicePortfolios = pgTable("service_portfolios", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => professionalServices.id),
  providerId: integer("provider_id").notNull().references(() => employees.id),
  
  title: text("title").notNull(),
  description: text("description").notNull(),
  projectType: text("project_type"), // "case_study", "sample_work", "certification", "testimonial"
  
  // Media and files
  imageUrl: text("image_url"),
  fileUrl: text("file_url"),
  linkUrl: text("link_url"),
  
  // Project details
  clientIndustry: text("client_industry"),
  projectDuration: text("project_duration"),
  technologiesUsed: text("technologies_used").array().default([]),
  outcomes: text("outcomes").array().default([]),
  
  isPublic: boolean("is_public").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema validation
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalServiceSchema = createInsertSchema(professionalServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  bookingCount: true,
  averageRating: true,
  totalReviews: true,
});

export const insertServiceBookingSchema = createInsertSchema(serviceBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceReviewSchema = createInsertSchema(serviceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isHelpful: true,
});

export const insertServicePortfolioSchema = createInsertSchema(servicePortfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Team schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
  approvedAt: true,
});

export const insertTeamServiceCategorySchema = createInsertSchema(teamServiceCategories).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertProfessionalService = z.infer<typeof insertProfessionalServiceSchema>;
export type ProfessionalService = typeof professionalServices.$inferSelect;
export type InsertServiceBooking = z.infer<typeof insertServiceBookingSchema>;
export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type InsertServiceReview = z.infer<typeof insertServiceReviewSchema>;
export type ServiceReview = typeof serviceReviews.$inferSelect;
export type InsertServicePortfolio = z.infer<typeof insertServicePortfolioSchema>;
export type ServicePortfolio = typeof servicePortfolios.$inferSelect;

// Team types
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamServiceCategory = z.infer<typeof insertTeamServiceCategorySchema>;
export type TeamServiceCategory = typeof teamServiceCategories.$inferSelect;

// Development logout state table for proper persistence
export const devLogoutState = pgTable("dev_logout_state", {
  id: varchar("id").primaryKey().default("singleton"),
  isLoggedOut: boolean("is_logged_out").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DevLogoutState = typeof devLogoutState.$inferSelect;

// User authentication schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
