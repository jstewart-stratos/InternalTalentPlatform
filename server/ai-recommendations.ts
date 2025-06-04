import OpenAI from "openai";
import { Employee, Project } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProjectRecommendation {
  project: Project;
  compatibilityScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  reasoning: string;
  recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
}

interface EmployeeRecommendation {
  employee: Employee;
  compatibilityScore: number;
  matchingSkills: string[];
  additionalValue: string[];
  reasoning: string;
  recommendationLevel: 'perfect' | 'good' | 'partial' | 'stretch';
}

export async function getProjectRecommendationsForEmployee(
  employee: Employee, 
  availableProjects: Project[]
): Promise<ProjectRecommendation[]> {
  try {
    const prompt = `You are an expert career advisor and project matching specialist. Analyze the following employee profile and available projects to provide intelligent project recommendations.

Employee Profile:
- Name: ${employee.name}
- Title: ${employee.title}
- Department: ${employee.department}
- Experience Level: ${employee.experienceLevel}
- Skills: ${employee.skills.join(", ")}
- Bio: ${employee.bio || "No bio provided"}

Available Projects:
${availableProjects.map(project => `
Project: ${project.title}
Description: ${project.description}
Required Skills: ${project.requiredSkills?.join(", ") || "None specified"}
Priority: ${project.priority}
Status: ${project.status}
Estimated Duration: ${project.estimatedDuration || "Not specified"}
`).join("\n")}

For each project, provide a compatibility analysis in JSON format with the following structure:
{
  "recommendations": [
    {
      "projectId": number,
      "compatibilityScore": number (0-100),
      "matchingSkills": string[],
      "missingSkills": string[],
      "reasoning": "detailed explanation of why this project is/isn't a good match",
      "recommendationLevel": "perfect" | "good" | "partial" | "stretch"
    }
  ]
}

Scoring criteria:
- Perfect (90-100): Employee has all required skills plus relevant experience
- Good (70-89): Employee has most required skills and can learn missing ones
- Partial (50-69): Employee has some required skills but significant gaps exist
- Stretch (30-49): Employee has transferable skills but would need substantial learning

Consider:
1. Direct skill matches
2. Transferable skills from their background
3. Learning potential based on experience level
4. Department synergies
5. Project complexity vs employee experience
6. Career growth opportunities

Only recommend projects with scores above 30. Rank by compatibility score descending.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Map AI results to our recommendation objects
    const recommendations: ProjectRecommendation[] = result.recommendations
      ?.map((rec: any) => {
        const project = availableProjects.find(p => p.id === rec.projectId);
        if (!project) return null;
        
        return {
          project,
          compatibilityScore: rec.compatibilityScore,
          matchingSkills: rec.matchingSkills || [],
          missingSkills: rec.missingSkills || [],
          reasoning: rec.reasoning,
          recommendationLevel: rec.recommendationLevel
        };
      })
      .filter(Boolean) || [];

    return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
  } catch (error) {
    console.error("Error getting project recommendations:", error);
    throw new Error("Failed to generate project recommendations");
  }
}

export async function getEmployeeRecommendationsForProject(
  project: Project, 
  availableEmployees: Employee[]
): Promise<EmployeeRecommendation[]> {
  try {
    const prompt = `You are an expert technical recruiter and team building specialist. Analyze the following project requirements and available employees to recommend the best candidates.

Project Details:
- Title: ${project.title}
- Description: ${project.description}
- Required Skills: ${project.requiredSkills?.join(", ") || "None specified"}
- Priority: ${project.priority}
- Status: ${project.status}
- Estimated Duration: ${project.estimatedDuration || "Not specified"}
- Budget: ${project.budget || "Not specified"}

Available Employees:
${availableEmployees.map(emp => `
Employee: ${emp.name}
Title: ${emp.title}
Department: ${emp.department}
Experience Level: ${emp.experienceLevel}
Skills: ${emp.skills.join(", ")}
Bio: ${emp.bio || "No bio provided"}
`).join("\n")}

For each employee, provide a compatibility analysis in JSON format:
{
  "recommendations": [
    {
      "employeeId": number,
      "compatibilityScore": number (0-100),
      "matchingSkills": string[],
      "additionalValue": string[],
      "reasoning": "detailed explanation of employee's value to the project",
      "recommendationLevel": "perfect" | "good" | "partial" | "stretch"
    }
  ]
}

Scoring criteria:
- Perfect (90-100): Has all required skills plus exceptional relevant experience
- Good (70-89): Has most required skills and strong relevant background
- Partial (50-69): Has some required skills with learning potential
- Stretch (30-49): Has transferable skills but would need guidance

Consider:
1. Direct skill alignment with project requirements
2. Experience level appropriateness for project complexity
3. Department knowledge relevance
4. Leadership potential for project management
5. Learning agility and growth mindset
6. Unique skills that could add unexpected value
7. Collaboration history and team dynamics

Only recommend employees with scores above 30. Rank by compatibility score descending.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Map AI results to our recommendation objects
    const recommendations: EmployeeRecommendation[] = result.recommendations
      ?.map((rec: any) => {
        const employee = availableEmployees.find(emp => emp.id === rec.employeeId);
        if (!employee) return null;
        
        return {
          employee,
          compatibilityScore: rec.compatibilityScore,
          matchingSkills: rec.matchingSkills || [],
          additionalValue: rec.additionalValue || [],
          reasoning: rec.reasoning,
          recommendationLevel: rec.recommendationLevel
        };
      })
      .filter(Boolean) || [];

    return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
  } catch (error) {
    console.error("Error getting employee recommendations:", error);
    throw new Error("Failed to generate employee recommendations");
  }
}

export async function getSkillGapAnalysis(
  employee: Employee, 
  targetProject: Project
): Promise<{
  currentSkills: string[];
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  learningPath: string[];
  timeEstimate: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'advanced';
}> {
  try {
    const prompt = `As an expert learning and development advisor, analyze the skill gap between an employee and a target project to create a personalized learning path.

Employee Profile:
- Name: ${employee.name}
- Current Skills: ${employee.skills.join(", ")}
- Experience Level: ${employee.experienceLevel}
- Title: ${employee.title}
- Department: ${employee.department}

Target Project:
- Title: ${targetProject.title}
- Required Skills: ${targetProject.requiredSkills?.join(", ") || "None specified"}
- Description: ${targetProject.description}

Provide a detailed skill gap analysis in JSON format:
{
  "currentSkills": string[],
  "requiredSkills": string[],
  "matchingSkills": string[],
  "missingSkills": string[],
  "learningPath": string[],
  "timeEstimate": "realistic time needed to acquire missing skills",
  "difficulty": "easy" | "moderate" | "challenging" | "advanced"
}

Learning path should be ordered from foundational to advanced skills, considering the employee's current experience level.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
    
  } catch (error) {
    console.error("Error generating skill gap analysis:", error);
    throw new Error("Failed to generate skill gap analysis");
  }
}