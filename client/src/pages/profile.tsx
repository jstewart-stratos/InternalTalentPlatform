import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Mail, MapPin, Calendar, Award, Edit, ThumbsUp, Users, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileAvatar from "@/components/profile-avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import ContactDialog from "@/components/contact-dialog";
import LinkedInSkillsImport from "@/components/linkedin-skills-import";
import SkillTaggingSystem from "@/components/skill-tagging-system";
import type { Employee, SkillEndorsement } from "@shared/schema";

export default function Profile() {
  const [, params] = useRoute("/profile/:id?");
  const [, setLocation] = useLocation();
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  
  // Get current employee data to determine the actual employee ID
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees/current"],
    queryFn: async () => {
      const response = await fetch("/api/employees/current");
      if (!response.ok) throw new Error("Failed to fetch current employee");
      return response.json();
    },
  });
  
  // Use the actual employee ID from current user or fallback to params
  const employeeId = params?.id ? parseInt(params.id) : (currentEmployee?.id || 1);
  const isOwnProfile = !params?.id || (currentEmployee && parseInt(params.id) === currentEmployee.id);

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employees", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch employee");
      return response.json() as Promise<Employee>;
    },
  });

  const { data: endorsements = [], isLoading: endorsementsLoading } = useQuery({
    queryKey: ["/api/skill-endorsements", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/skill-endorsements/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch endorsements");
      return response.json() as Promise<SkillEndorsement[]>;
    },
  });



  const endorseMutation = useMutation({
    mutationFn: async ({ skill }: { skill: string }) => {
      const response = await fetch("/api/skill-endorsements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          endorserId: currentUser?.id || 1,
          skill,
        }),
      });
      if (!response.ok) throw new Error("Failed to endorse skill");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-endorsements", employeeId] });
      toast({
        title: "Skill endorsed",
        description: "Your endorsement has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add endorsement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeEndorsementMutation = useMutation({
    mutationFn: async ({ skill }: { skill: string }) => {
      const response = await fetch(`/api/skill-endorsements/${employeeId}/${currentUser?.id || 1}/${encodeURIComponent(skill)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove endorsement");
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-endorsements", employeeId] });
      toast({
        title: "Endorsement removed",
        description: "Your endorsement has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove endorsement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSkillsMutation = useMutation({
    mutationFn: async (skills: string[]) => {
      await apiRequest(`/api/employees/${employeeId}`, "PATCH", { skills });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/skill-endorsements", employeeId] });
      toast({
        title: "Skills updated",
        description: "Your skills have been updated successfully.",
      });
      setIsEditingSkills(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update skills. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSkillsUpdate = (newSkills: string[]) => {
    updateSkillsMutation.mutate(newSkills);
  };

  const handleLinkedInSkillsSelected = (selectedSkills: string[]) => {
    const currentSkills = employee?.skills || [];
    const updatedSkills = [...currentSkills, ...selectedSkills];
    updateSkillsMutation.mutate(updatedSkills);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
              <p className="text-gray-600">The employee profile you're looking for doesn't exist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSkillColor = (skill: string) => {
    const colors = {
      React: "bg-blue-100 text-blue-800",
      TypeScript: "bg-blue-100 text-blue-800",
      "Node.js": "bg-blue-100 text-blue-800",
      Python: "bg-green-100 text-green-800",
      "Machine Learning": "bg-green-100 text-green-800",
      SQL: "bg-green-100 text-green-800",
      "User Research": "bg-purple-100 text-purple-800",
      Figma: "bg-purple-100 text-purple-800",
      Prototyping: "bg-purple-100 text-purple-800",
      "Go-to-Market": "bg-orange-100 text-orange-800",
      "Content Strategy": "bg-orange-100 text-orange-800",
      Analytics: "bg-orange-100 text-orange-800",
      AWS: "bg-red-100 text-red-800",
      Kubernetes: "bg-red-100 text-red-800",
      Docker: "bg-red-100 text-red-800",
      "Scrum Master": "bg-indigo-100 text-indigo-800",
      "Team Leadership": "bg-indigo-100 text-indigo-800",
      "Process Optimization": "bg-indigo-100 text-indigo-800",
    };
    return colors[skill as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };



  const getEndorsementCount = (skill: string) => {
    return endorsements.filter(e => e.skill === skill).length;
  };

  const hasUserEndorsed = (skill: string) => {
    return endorsements.some(e => e.skill === skill && e.endorserId === (currentUser?.id || 1));
  };

  const handleEndorseSkill = (skill: string) => {
    if (hasUserEndorsed(skill)) {
      removeEndorsementMutation.mutate({ skill });
    } else {
      endorseMutation.mutate({ skill });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="mb-8">
        <CardContent className="pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6 mb-8">
            <ProfileAvatar
              src={employee.profileImage}
              name={employee.name}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</h1>
                  <p className="text-xl text-gray-600 mb-2">{employee.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      DBA
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {employee.yearsExperience} years experience
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                  <ContactDialog employee={employee} />
                  {isOwnProfile && (
                    <>
                      <Button 
                        onClick={() => setLocation("/projects")}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setLocation("/profile/create")}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          <Separator className="mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Skills & Expertise
                </h2>
                <div className="flex items-center space-x-2">
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingSkills(!isEditingSkills)}
                      className="flex items-center space-x-1"
                    >
                      <Settings className="h-3 w-3" />
                      <span>{isEditingSkills ? "Cancel" : "Manage Skills"}</span>
                    </Button>
                  )}
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {employee.skills.length} skills
                  </Badge>
                </div>
              </div>

              {isEditingSkills && isOwnProfile && (
                <div className="space-y-6 mb-6">
                  {/* LinkedIn Skills Import */}
                  <LinkedInSkillsImport
                    onSkillsSelected={handleLinkedInSkillsSelected}
                    currentSkills={employee.skills}
                    className="mb-4"
                  />

                  {/* Manual Skills Editor */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Edit Skills Manually</h3>
                    <SkillTaggingSystem
                      selectedSkills={employee.skills}
                      onSkillsChange={handleSkillsUpdate}
                      placeholder="Add or remove skills..."
                      maxSkills={30}
                      showAISuggestions={true}
                      context="profile"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {employee.skills.map((skill) => {
                  const endorsementCount = getEndorsementCount(skill);
                  const userHasEndorsed = hasUserEndorsed(skill);
                  const isViewingOwnProfile = employeeId === (currentUser?.id || 1);
                  
                  return (
                    <div key={skill} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={`text-sm ${getSkillColor(skill)}`}
                          variant="secondary"
                        >
                          {skill}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{endorsementCount} endorsement{endorsementCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {!isViewingOwnProfile && (
                        <Button
                          size="sm"
                          variant={userHasEndorsed ? "default" : "outline"}
                          onClick={() => handleEndorseSkill(skill)}
                          disabled={endorseMutation.isPending || removeEndorsementMutation.isPending}
                          className="flex items-center space-x-1"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{userHasEndorsed ? "Endorsed" : "Endorse"}</span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{employee.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{employee.department} Department</span>
                </div>
              </div>
            </div>
          </div>



          {employee.bio && (
            <>
              <Separator className="my-8" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{employee.bio}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity to display.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
