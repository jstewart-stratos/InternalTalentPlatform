import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { FolderOpen, Plus, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@shared/schema";

export default function MyProjects() {
  const [, setLocation] = useLocation();

  // Get current employee data to determine the actual employee ID
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees/current"],
    queryFn: async () => {
      const response = await fetch("/api/employees/current");
      if (!response.ok) throw new Error("Failed to fetch current employee");
      return response.json();
    },
  });

  // Fetch user's owned projects
  const { data: ownedProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects/my-projects", currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee?.id) return [];
      const response = await fetch(`/api/projects/owner/${currentEmployee.id}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json() as Promise<Project[]>;
    },
    enabled: !!currentEmployee?.id,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FolderOpen className="h-8 w-8 mr-3 text-orange-500" />
            My Projects
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and track your project collaborations
          </p>
        </div>
        <Button
          onClick={() => setLocation("/projects")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {projectsLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading your projects...</p>
        </div>
      ) : ownedProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">
              Start your first project and begin collaborating with your colleagues.
            </p>
            <Button
              onClick={() => setLocation("/projects")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ownedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    variant={project.status === 'active' ? 'default' : 'secondary'}
                    className={project.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
                
                {project.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.requiredSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {project.requiredSkills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.requiredSkills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setLocation(`/projects?view=${project.id}`)}
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    View Project
                  </Button>
                  <Button
                    onClick={() => setLocation(`/projects?edit=${project.id}`)}
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}