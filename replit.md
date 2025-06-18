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
1. Users authenticate via Replit Auth OIDC integration
2. Session data stored in PostgreSQL sessions table
3. User profiles linked to employee records for role-based access

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

## User Preferences

Preferred communication style: Simple, everyday language.