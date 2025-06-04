import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, DollarSign, Users, AlertCircle, CheckCircle, Pause, Play, ArrowLeft, Mail, User } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import EmployeeRecommendations from "@/components/employee-recommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { Project, InsertProject } from "@shared/schema";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  ownerId: z.number().default(1), // For demo, use current user ID
  status: z.enum(["planning", "active", "paused", "completed"]).default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  deadline: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  estimatedDuration: z.string().optional(),
  budget: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const statusColors = {
  planning: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusIcons = {
  planning: AlertCircle,
  active: Play,
  paused: Pause,
  completed: CheckCircle,
};

export default function Projects() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json() as Promise<Project[]>;
    },
  });

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      ownerId: 1,
      status: "planning",
      priority: "medium",
      requiredSkills: [],
      estimatedDuration: "",
      budget: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    const projectData: InsertProject = {
      ...data,
      ownerId: currentUser?.id || 40, // Use current user as owner
      deadline: data.deadline ? new Date(data.deadline) : null,
    };
    createProjectMutation.mutate(projectData);
  };

  const addSkill = () => {
    if (skillInput.trim() && !form.getValues("requiredSkills").includes(skillInput.trim())) {
      const currentSkills = form.getValues("requiredSkills");
      form.setValue("requiredSkills", [...currentSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("requiredSkills");
    form.setValue("requiredSkills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "No deadline";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show detailed project view if a project is selected
  if (selectedProject) {
    const StatusIcon = statusIcons[selectedProject.status];
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setSelectedProject(null)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          {/* Project Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold mb-2">
                    {selectedProject.title}
                  </CardTitle>
                  <div className="flex gap-3 mb-4">
                    <Badge className={statusColors[selectedProject.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {selectedProject.status}
                    </Badge>
                    <Badge className={priorityColors[selectedProject.priority]}>
                      {selectedProject.priority} priority
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Project Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deadline</p>
                    <p className="text-sm font-semibold">{formatDate(selectedProject.deadline)}</p>
                  </div>
                </div>
                
                {selectedProject.estimatedDuration && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-sm font-semibold">{selectedProject.estimatedDuration}</p>
                    </div>
                  </div>
                )}
                
                {selectedProject.budget && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Budget</p>
                      <p className="text-sm font-semibold">{selectedProject.budget}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project Owner</p>
                    <p className="text-sm font-semibold">Sarah Chen</p>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {selectedProject.requiredSkills && selectedProject.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Apply to Join This Project</h3>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <p className="text-gray-700 mb-4">
                        Interested in contributing to this project? Send a message to the project owner
                        to express your interest and share your relevant experience.
                      </p>
                      <div className="flex gap-3">
                        <Button className="bg-accent hover:bg-accent/90">
                          <Mail className="h-4 w-4 mr-2" />
                          Contact Project Owner
                        </Button>
                        <Button variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          View Team Members
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Employee Recommendations */}
          <EmployeeRecommendations 
            project={selectedProject}
            onEmployeeSelect={(employee) => {
              // Handle employee selection - could open contact dialog
              console.log("Selected employee:", employee);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Hub</h1>
            <p className="text-lg text-gray-600 mt-2">
              Discover projects and share your expertise with colleagues
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Post Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your project and what you're looking to achieve"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2 weeks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $5,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Required Skills</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add a skill"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("requiredSkills").map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending}
                      className="bg-accent hover:bg-accent/90"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const StatusIcon = statusIcons[project.status];
              return (
                <Card 
                  key={project.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {project.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className={statusColors[project.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {project.status}
                        </Badge>
                        <Badge className={priorityColors[project.priority]}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {project.description}
                    </p>

                    {project.requiredSkills && project.requiredSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.requiredSkills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.requiredSkills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(project.deadline)}
                      </div>
                      {project.estimatedDuration && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {project.estimatedDuration}
                        </div>
                      )}
                    </div>

                    {project.budget && (
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {project.budget}
                      </div>
                    )}

                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Apply to Join
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">
                Be the first to post a project and start collaborating with your colleagues.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-accent hover:bg-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post Your First Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}