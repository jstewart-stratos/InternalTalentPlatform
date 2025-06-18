# Azure Deployment Guide for Stratos Skill Swap

## Overview
This guide provides step-by-step instructions for deploying the Stratos Skill Swap application to Microsoft Azure using Azure App Service and Azure Database for PostgreSQL.

## Prerequisites
- Azure subscription
- Azure CLI installed
- Git repository with your application code
- SendGrid account for email functionality
- OpenAI API key for AI features

## Azure Services Required

### 1. Azure App Service
- **SKU**: B1 (Basic) or higher recommended
- **Runtime**: Node.js 20 LTS
- **OS**: Linux
- **Features**: Always On, HTTPS Only

### 2. Azure Database for PostgreSQL (Flexible Server)
- **SKU**: Standard_B1ms (Burstable, 1 vCore, 2GB RAM)
- **Storage**: 32GB minimum
- **Version**: PostgreSQL 14 or 16
- **Backup**: 7-day retention

### 3. Azure Application Insights
- **Type**: Web application monitoring
- **Features**: Performance monitoring, error tracking

## Deployment Methods

### Method 1: Infrastructure as Code (Recommended)

1. **Deploy infrastructure using Bicep template:**
```bash
az group create --name stratos-skill-swap-rg --location "East US"

az deployment group create \
  --resource-group stratos-skill-swap-rg \
  --template-file azure-bicep-template.bicep \
  --parameters appName=your-app-name \
  --parameters postgresAdminPassword=YourSecurePassword123!
```

2. **Configure GitHub Actions deployment:**
   - Copy `azure-deploy.yml` to `.github/workflows/`
   - Set up GitHub secrets in your repository:
     - `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure portal

### Method 2: Manual Azure Portal Setup

1. **Create Resource Group:**
   - Name: `stratos-skill-swap-rg`
   - Region: East US (or your preferred region)

2. **Create PostgreSQL Database:**
   - Server name: `stratos-skill-swap-postgres`
   - Admin username: `stratosSqlAdmin`
   - Password: Create secure password
   - Compute + storage: Burstable, B1ms
   - Enable "Allow access to Azure services"

3. **Create App Service Plan:**
   - Name: `stratos-skill-swap-plan`
   - OS: Linux
   - Runtime: Node.js 20 LTS
   - SKU: B1 Basic

4. **Create Web App:**
   - Name: `stratos-skill-swap` (must be globally unique)
   - Runtime: Node.js 20 LTS
   - OS: Linux

## Environment Variables Configuration

Configure these application settings in Azure App Service:

### Required Settings
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require
SESSION_SECRET=your-generated-secure-session-secret
```

### Optional API Keys
```
SENDGRID_API_KEY=your-sendgrid-api-key
OPENAI_API_KEY=your-openai-api-key
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### Azure-Specific Settings
```
WEBSITE_NODE_DEFAULT_VERSION=20.x
SCM_DO_BUILD_DURING_DEPLOYMENT=true
APPLICATIONINSIGHTS_CONNECTION_STRING=your-app-insights-connection-string
```

## Database Setup

1. **Connect to PostgreSQL:**
```bash
psql "host=your-server.postgres.database.azure.com port=5432 dbname=postgres user=stratosSqlAdmin sslmode=require"
```

2. **Create application database:**
```sql
CREATE DATABASE stratosdb;
```

3. **Run database migrations:**
```bash
npm run db:push
```

## Deployment Steps

### Option A: GitHub Actions (Automated)
1. Push code to your GitHub repository
2. GitHub Actions will automatically build and deploy
3. Monitor deployment in GitHub Actions tab

### Option B: Azure CLI (Manual)
```bash
# Build the application
npm run build

# Deploy to Azure
az webapp deploy \
  --resource-group stratos-skill-swap-rg \
  --name your-app-name \
  --src-path . \
  --type zip
```

### Option C: VS Code Extension
1. Install Azure App Service extension
2. Right-click on your project
3. Select "Deploy to Web App"
4. Follow the wizard

## Post-Deployment Configuration

### 1. Database Seeding
Connect to your deployed app and run initial data seeding:
```bash
# SSH into Azure App Service
az webapp ssh --resource-group stratos-skill-swap-rg --name your-app-name

# Run seeding scripts
npm run seed
```

### 2. SSL Certificate
Azure App Service provides free SSL certificates:
- Go to App Service → TLS/SSL settings
- Enable "HTTPS Only"
- Bind custom domain (if needed)

### 3. Custom Domain (Optional)
```bash
az webapp config hostname add \
  --webapp-name your-app-name \
  --resource-group stratos-skill-swap-rg \
  --hostname yourdomain.com
```

## Security Configuration

### 1. Network Security
- Enable "Access restriction" in App Service
- Configure IP allowlists if needed
- Use Virtual Network integration for enhanced security

### 2. Database Security
- Enable firewall rules for specific IP ranges
- Use managed identity for database connections
- Enable audit logging

### 3. Application Security
The application includes built-in security features:
- Rate limiting
- Input sanitization
- Security headers (HSTS, CSP, X-Frame-Options)
- Session security

## Monitoring and Logging

### 1. Application Insights
Monitor application performance and errors:
- Response times
- Failed requests
- Custom events
- User analytics

### 2. Azure Monitor
Set up alerts for:
- High CPU usage
- Memory consumption
- Database connection issues
- HTTP errors

### 3. Log Streaming
View real-time logs:
```bash
az webapp log tail --resource-group stratos-skill-swap-rg --name your-app-name
```

## Scaling Configuration

### 1. Vertical Scaling
Upgrade App Service Plan:
- B1 → S1 (Standard) for production workloads
- P1V3 (Premium) for high-performance requirements

### 2. Horizontal Scaling
Configure auto-scaling rules:
- CPU percentage thresholds
- Memory usage triggers
- Custom metrics

## Backup and Recovery

### 1. Database Backups
- Automated backups: 7-day retention
- Point-in-time recovery available
- Cross-region backup replication (optional)

### 2. Application Backups
- Configure automated backups in App Service
- Include configuration and files
- Test restore procedures

## Cost Optimization

### 1. Resource Sizing
- **Development**: B1 App Service + B1ms PostgreSQL (~$50/month)
- **Production**: S1 App Service + B2s PostgreSQL (~$150/month)
- **Enterprise**: P1V3 App Service + GP_Gen5_2 PostgreSQL (~$400/month)

### 2. Cost Management
- Set up budget alerts
- Use Azure Cost Management
- Consider Reserved Instances for production

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify connection string format
   - Check firewall rules
   - Ensure SSL mode is required

2. **Build Failures:**
   - Check Node.js version compatibility
   - Verify package.json scripts
   - Review build logs in App Service

3. **Performance Issues:**
   - Enable Application Insights
   - Check database query performance
   - Monitor resource utilization

### Support Resources
- Azure Support Portal
- Stack Overflow (azure-app-service tag)
- Azure documentation: docs.microsoft.com

## Production Checklist

- [ ] SSL certificate configured
- [ ] Custom domain mapped (if applicable)
- [ ] Environment variables set
- [ ] Database migrations completed
- [ ] Initial data seeded
- [ ] Application Insights configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts set up
- [ ] Security hardening completed
- [ ] Load testing performed
- [ ] Disaster recovery plan documented

Your Stratos Skill Swap application is now ready for Azure deployment with enterprise-grade security, monitoring, and scalability features.