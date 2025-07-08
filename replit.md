# Stratos Skill Swap - Employee Skill Matching Platform

## Overview

Stratos Skill Swap is a full-stack internal employee skill matching platform built for financial services organizations. The application enables employees to showcase their skills, discover colleagues with complementary expertise, collaborate on projects, and offer professional services within the organization. It features AI-powered recommendations, skills gap analysis, and a marketplace for internal consulting services.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite build system
- **Backend**: Node.js with Express and TypeScript 
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session management
- **UI Framework**: Tailwind CSS with shadcn/ui components (New York style)
- **State Management**: TanStack Query for server state and caching
- **Email**: SendGrid for transactional emails
- **AI Integration**: OpenAI GPT-4o for skill recommendations and project matching

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client-Server Architecture**: React SPA frontend communicating with REST API backend
- **Shared Schema**: TypeScript schemas and types shared between frontend and backend
- **Database-First Design**: Drizzle ORM with PostgreSQL for robust data management

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components for consistent design system
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for API state, React Context for user management
- **Styling**: Tailwind CSS with CSS variables for theming support

### Backend Architecture
- **API Routes**: RESTful API with Express middleware
- **Database Layer**: Drizzle ORM with type-safe queries and migrations
- **Authentication**: Session-based auth with PostgreSQL session store
- **File Structure**: Organized by feature with shared utilities

### Database Schema
- **Users & Employees**: Separate user authentication and employee profile tables
- **Skills Management**: Individual skill records with experience levels and endorsements
- **Projects**: Project management with skill requirements and team collaboration
- **Professional Services**: Internal marketplace for consulting services
- **Audit & Analytics**: Comprehensive logging and skill trend tracking

### Key Features
1. **Employee Directory**: Searchable directory with skill-based filtering
2. **Project Management**: Create and manage projects with skill requirements
3. **Skill Endorsements**: Peer-to-peer skill validation system
4. **AI Recommendations**: OpenAI-powered project and skill recommendations
5. **Professional Services**: Internal marketplace for consulting services
6. **Skills Gap Analysis**: AI-driven learning path recommendations
7. **Admin Dashboard**: User management and system configuration

## Data Flow

### Authentication Flow
1. Users authenticate via custom email/password authentication system
2. Session data stored in PostgreSQL sessions table with secure password hashing
3. User profiles linked to employee records for role-based access
4. Role-based access control with admin and user roles

### Skill Management Flow
1. Employees create profiles with individual skill records and experience levels
2. Skills are validated and categorized for consistent taxonomy
3. Peer endorsements provide skill validation and credibility scores
4. AI analyzes skill gaps and generates personalized learning recommendations

### Project Collaboration Flow
1. Project owners define requirements including required skills
2. AI recommends suitable team members based on skill compatibility
3. Employees can apply to projects or be invited by project owners
4. Real-time collaboration features enable team coordination

### Marketplace Flow
1. Employees offer professional services with detailed skill requirements
2. Service categorization and pricing management
3. Booking system with client communication features
4. Service delivery tracking and feedback collection

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Replit environments
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Accessible UI component primitives
- **openai**: GPT-4o integration for AI recommendations
- **@sendgrid/mail**: Transactional email service

### Development Dependencies
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and optimized production builds
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript/TypeScript bundling

### API Integrations
- **OpenAI API**: Skill gap analysis and intelligent project matching
- **SendGrid API**: Email notifications and communications
- **LinkedIn API**: Optional skill import (configured but not implemented)

## Deployment Strategy

### Replit Deployment
- **Target**: Autoscale deployment on Replit infrastructure
- **Build Process**: Vite builds client assets, ESBuild bundles server
- **Port Configuration**: Server runs on port 5000, external port 80
- **Environment**: Node.js 20, PostgreSQL 16, web modules enabled

### Build Configuration
- **Development**: `npm run dev` - concurrent client/server development
- **Production Build**: `npm run build` - optimized client and server bundles
- **Production Start**: `npm run start` - serves bundled application

### Database Management
- **Migrations**: Drizzle Kit for schema migrations (`npm run db:push`)
- **Connection**: PostgreSQL connection via DATABASE_URL environment variable
- **Session Storage**: PostgreSQL-based session management for scalability

## Changelog

Changelog:
- June 18, 2025. Initial setup
- June 18, 2025. Department removal completed - all department references eliminated from system
- June 18, 2025. Admin panel authentication completely fixed - proper middleware implementation
- June 18, 2025. Analytics page rebuilt without department dependencies
- June 18, 2025. Service category creation functionality implemented and verified working
- June 18, 2025. Service categories analytics section added to analytics dashboard
- June 18, 2025. Department references completely eliminated from skills gap analysis/career growth page
- June 18, 2025. Profile editing skills requirement removed - skills now optional during profile updates
- June 18, 2025. Comprehensive security and performance optimization completed - production-ready codebase with enterprise-grade security measures
- June 18, 2025. Azure deployment configuration completed - Infrastructure as Code templates, CI/CD pipeline, and comprehensive deployment documentation prepared
- June 18, 2025. LinkedIn skills import functionality completely removed - Eliminated all LinkedIn integration due to API restrictions, simplified skills entry to manual input only
- January 8, 2025. Sample data completely removed - System cleaned to contain only jstewart administrator account, ready for production use
- January 8, 2025. Custom authentication system implemented - Replaced Replit authentication with secure email/password system, password hashing with salt, session-based authentication, role-based access control
- January 8, 2025. Admin portal user and team creation functionality completed - Fixed ES module compatibility issues, implemented proper password hashing, added convenient action buttons to card headers, verified working user creation through admin interface
- January 8, 2025. Team manager role implementation completed - Added team-manager role to user schema, implemented role-based middleware functions, created team management API endpoints for managing team members and services, updated admin interface to support three-tier role system (admin/team-manager/user)
- January 8, 2025. Admin panel modal dialog system completed - Fixed API parameter order issues preventing user creation, resolved authentication problems with admin-created users, implemented working modal dialogs for all CRUD operations with orange accent buttons
- January 8, 2025. Team management system completed - Fixed API route conflicts (teams/available vs teams/:id), resolved database insertion issues with team member creation, implemented complete user team management (join/leave teams), fixed admin team member addition functionality, all team operations now working correctly with proper isActive status management
- January 8, 2025. Admin team member display issue resolved - Fixed frontend display logic to show actual current team members from database instead of empty selection state, corrected employeeId vs userId mapping, implemented proper member information display with role badges and remove functionality
- January 8, 2025. Enhanced team management interface completed - Implemented visual expertise area management with individual badge display and removal, added dedicated input fields for adding new expertise areas, enhanced description editing with textarea, character counter, and current description display for both team creation and editing workflows
- January 8, 2025. Profile creation data capture issues resolved - Fixed critical bugs where full names and skills were not being properly saved during profile creation/editing, implemented proper auto-population of user names from authentication data, enhanced PUT endpoint to handle detailed skills with experience levels, added missing deleteEmployeeSkills storage method, verified both basic skills array and detailed employee_skills table records are created correctly
- January 8, 2025. Team manager self-administration functionality completed - Implemented comprehensive team manager permissions system with role-based middleware (requireTeamManagerAccess), created dedicated API endpoints for team managers to manage their own teams (/api/team-manager/*), built complete team management interface allowing team managers to edit team details, manage members, update roles, add/remove team members, and administer expertise areas, added proper navigation for team managers with "Manage Teams" link, verified Tyler Morris can access and manage Stratos Private Wealth team with full administrative capabilities
- January 8, 2025. Team services management functionality completed - Fixed API parameter order issues in team service creation, resolved categoryId validation errors with default category handling, successfully implemented team service creation and editing capabilities, added comprehensive edit service dialog with skills editing, short description, duration, and pricing fields, team managers can now create and manage services for their teams similar to individual "My Services" functionality
- January 8, 2025. Team details page implementation completed - Created comprehensive team details page accessible via "View Details" button on teams listing, implemented three-tab interface (Members, Services, Skills), added team overview with statistics, join team functionality for non-members, proper API endpoints for team data retrieval including /api/teams/:id/members, enhanced routing to support /teams/:id paths, team details page displays complete team information including member roles, team services with pricing, and collective team skills
- January 8, 2025. Required service category selection completed - Implemented mandatory category selection for both individual and team service creation, added "Request New Category" functionality with orange accent buttons, enhanced form validation to prevent service creation without category selection, improved dialog state management with proper reset functionality for category input dialogs
- January 8, 2025. Team member addition functionality completely fixed - Resolved critical issues preventing team member addition: removed employee profile requirement from search filters allowing all users to be found, fixed API parameter structure mismatch between routes and storage methods, enhanced auto-creation of employee profiles for users without profiles (including required yearsExperience field), corrected database isActive flag issue, Dawn DiMaio successfully added to Twenty Four Wealth team with manager role
- January 8, 2025. Team member database storage bug resolved - Fixed critical issue where team members were being saved with is_active=false instead of true due to duplicate employee profile creation attempts, implemented proper user ID to employee ID mapping in admin interface, added validation to prevent duplicate employee profile creation for existing users, all team member additions now correctly save with active status and display proper member counts
- January 8, 2025. Admin interface optimization completed - Removed description column from teams management table to improve admin experience and reduce visual clutter, streamlined table layout to focus on essential team information (name, members, visibility, created date, actions), enhanced table readability and usability for administrative tasks
- January 8, 2025. Team service provider display and skills functionality completed - Fixed team services to display team name instead of individual provider by correcting service_type field in database, implemented team data fetching in service details page with proper conditional display logic, added missing skills input fields to service creation form (Skills Offered and Prerequisites), populated existing services with relevant skills data, verified complete skills and expertise display in marketplace service details
- January 8, 2025. Enhanced talent search with comprehensive skill matching completed - Implemented advanced searchEmployeesWithAllSkills method that searches across multiple skill sources: individual employee skills, team specialties from teams they belong to, and service skills from professional services they offer, enabling talent discovery through team expertise and service capabilities beyond just personal skills
- January 8, 2025. Team search integration in Discover Talent completed - Fixed critical issue where teams were not appearing in talent search results, modified home page Discover Talent tab to use combined /api/experts endpoint instead of /api/employees, implemented separate Teams and Individual Experts sections in search results, teams now properly appear when searching for their specialties (e.g., "tax prep" finds "Twenty-Four Wealth" team), enhanced result counter to show both expert and team counts
- January 8, 2025. Team service booking buttons added - Implemented "Book This Service" buttons on team service cards in team details pages, added orange accent button styling consistent with platform branding, button navigation to service details page for booking functionality, enhanced team services display with proper spacing and call-to-action buttons
- January 8, 2025. Team membership self-service removed - Eliminated "Join Team" button from teams listing page as team membership will be managed exclusively by platform admins and team managers, cleaned up related mutation code and unused imports for streamlined admin-controlled team management
- January 8, 2025. Onboarding tour implementation completed - Created comprehensive guided tour system with OnboardingProvider and OnboardingTour components, reworked tour content to emphasize profile creation requirement and admin-managed team membership, added "Platform Tour" button to navigation dropdown for easy access, tour automatically shows for new users and can be restarted anytime through help menu
- January 8, 2025. Team member addition issues resolved - Fixed cache invalidation bug in admin interface preventing immediate UI refresh after adding team members, clarified that users can be added to teams without existing employee profiles (profiles auto-created by system), added helpful messaging to admin interface explaining automatic profile creation
- January 8, 2025. Team member UI consistency completely fixed - Resolved issue where team members were occasionally being created with inactive status instead of active, enhanced cache invalidation with aggressive refresh strategies including immediate refetch and delayed invalidation, implemented comprehensive debugging for both add and remove operations, verified member count calculations work correctly with proper active member filtering
- January 8, 2025. Team member database storage bug completely resolved - Fixed critical duplicate member issue by implementing duplicate prevention logic in addTeamMember method, improved removeTeamMember to handle all records for member, enhanced getTeamMembers with GROUP BY query to prevent duplicate display, cleaned up all duplicate Tyler Morris records, verified team member add/remove functionality works correctly with immediate UI updates
- January 8, 2025. Team member count display issue completely resolved - Fixed backend member count calculation using COUNT(DISTINCT employeeId) to prevent duplicate counting, enhanced getAllTeamsWithMemberCount query with proper GROUP BY clause, implemented aggressive cache invalidation with backup page refresh functionality, verified member count updates immediately in UI when adding/removing team members
- January 8, 2025. Team manager member addition functionality completed - Fixed critical duplicate isTeamManager method that was checking for 'leader' role instead of 'manager', corrected API call parameter order (endpoint, method, data) in team management mutations, implemented comprehensive add member dialog with user search and role selection, verified team managers can successfully add and remove members from their teams through Team Management page
- January 8, 2025. Skills network team expertise integration completed - Enhanced skills network to include team specialties alongside individual employee skills, created new /api/skills/network endpoint with comprehensive team data, updated skills display cards to show breakdown of individuals vs teams for each skill, fixed critical SQL injection vulnerability in project search functionality with proper Drizzle parameterization, skills network now properly displays team expertise counts and enables discovery of both individual and collective organizational capabilities
- January 8, 2025. Trending skills team integration completed - Enhanced trending skills component to include team expertise alongside individual employee skills, updated getTrendingSkills API method to process team specialties, added teamCount field to trending skills data structure, implemented visual distinction with Building2 icon for teams vs Users icon for individuals, trending calculation now considers both individual employees and teams when determining skill popularity, providing comprehensive view of organizational capability trends

## User Preferences

Preferred communication style: Simple, everyday language.