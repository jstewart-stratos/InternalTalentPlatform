import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Users, Plus, Edit, Trash2, UserCheck, UserX, Briefcase, DollarSign, Clock, Star } from "lucide-react";
import ImageUpload from "@/components/image-upload";
import ProfileAvatar from "@/components/profile-avatar";

export default function TeamManagement() {
  console.log("=== TeamManagement page loaded ===");
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamExpertiseAreas, setEditTeamExpertiseAreas] = useState("");
  const [editTeamLogo, setEditTeamLogo] = useState("");
  const [newExpertiseArea, setNewExpertiseArea] = useState("");

  // Services state
  const [createServiceDialogOpen, setCreateServiceDialogOpen] = useState(false);
  const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Member management state
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<any>(null);
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");

  // Service form
  const serviceForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      pricingType: "hourly",
      hourlyRate: "",
      fixedPrice: "",
      consultationRate: "",
      duration: "",
      skills: "",
      categoryId: "",
      isActive: true
    }
  });

  // Fetch service categories
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  // Fetch all users for team member selection
  const { data: allUsers = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ["/api/team-manager/all-users-for-teams"],
  });

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await apiRequest("/api/service-categories", "POST", {
        name: categoryName,
        description: `${categoryName} services`
      });
      return response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      serviceForm.setValue("categoryId", newCategory.id.toString());
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      toast({
        title: "Success",
        description: "New category created and selected",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive"
      });
    }
  });

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  // Fetch teams managed by current user  
  const { data: managedTeams, isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ["/api/team-manager/my-teams"],
  });
  
  // Debug: Log the team data structure
  console.log("=== Managed Teams Data ===", managedTeams);

  // Fetch team members for selected team
  const { data: teamMembers, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"],
    queryFn: async () => {
      if (!selectedTeam) return null;
      console.log(`=== Making API call to /api/team-manager/teams/${selectedTeam.id}/members ===`);
      const response = await fetch(`/api/team-manager/teams/${selectedTeam.id}/members`, {
        credentials: 'include', // Include session cookies
      });
      console.log(`=== API Response status: ${response.status} ===`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`=== API Error: ${errorText} ===`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log(`=== API Success data: ===`, data);
      return data;
    },
    enabled: !!selectedTeam,
  });
  
  // Debug: Log the team members data and selected team
  console.log("=== Selected Team ===", selectedTeam);
  console.log("=== Team Members Data ===", teamMembers);
  console.log("=== Members Loading ===", membersLoading);
  console.log("=== Members Error ===", membersError);
  
  // Debug: Log when query should be enabled
  if (selectedTeam) {
    console.log(`=== Query enabled for team ${selectedTeam.id} ===`);
  }

  // Fetch team services
  const { data: teamServices, isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/professional-services?teamId=${selectedTeam?.id}`],
    enabled: !!selectedTeam,
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, teamData }: any) => {
      const response = await apiRequest(`/api/team-manager/teams/${teamId}`, "PUT", teamData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      setEditTeamDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/my-teams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ teamId, employeeId, role }: any) => {
      console.log(`=== Updating member role: Team ${teamId}, Employee ${employeeId}, Role ${role} ===`);
      const response = await apiRequest(`/api/team-manager/teams/${teamId}/members/${employeeId}/role`, "PUT", { role });
      return response.json();
    },
    onSuccess: (data: any, variables: any) => {
      console.log(`=== Role update successful ===`, data);
      const action = variables.role === 'manager' ? 'promoted to Team Manager' : 'demoted to Member';
      toast({
        title: "Success",
        description: `Team member ${action} successfully`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/my-teams"] });
    },
    onError: (error: Error) => {
      console.error(`=== Role update failed ===`, error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId, role }: any) => {
      console.log(`=== Adding team member: Team ${teamId}, Employee ${employeeId}, Role ${role} ===`);
      const response = await apiRequest(`/api/team-manager/teams/${teamId}/members`, "POST", { employeeId, role });
      return response.json();
    },
    onSuccess: (data: any, variables: any) => {
      console.log(`=== Member addition successful ===`, data);
      toast({
        title: "Success",
        description: "Team member added successfully",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/my-teams"] });
      setAddMemberDialogOpen(false);
      setMemberSearchQuery("");
      setSelectedMemberToAdd(null);
      setSelectedMemberRole("member");
    },
    onError: (error: Error) => {
      console.error(`=== Member addition failed ===`, error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId }: any) => {
      const response = await apiRequest(`/api/team-manager/teams/${teamId}/members/${employeeId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description);
    setEditTeamExpertiseAreas(team.expertiseAreas?.join(", ") || "");
    setEditTeamLogo(team.profileImage || "");
    setEditTeamDialogOpen(true);
  };

  const handleUpdateTeam = () => {
    if (!editTeamName || !editTeamDescription) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    
    const expertiseAreas = editTeamExpertiseAreas.split(',').map(area => area.trim()).filter(area => area);
    updateTeamMutation.mutate({
      teamId: selectedTeam.id,
      teamData: {
        name: editTeamName,
        description: editTeamDescription,
        expertiseAreas,
        profileImage: editTeamLogo,
        visibility: selectedTeam.visibility || 'public'
      }
    });
  };

  // Service management functions
  const handleEditService = (service: any) => {
    setEditingService(service);
    setEditServiceDialogOpen(true);
  };

  const handleDeleteService = async (service: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the service "${service.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/api/professional-services/${service.id}`, "DELETE");
      queryClient.invalidateQueries({ queryKey: [`/api/professional-services?teamId=${selectedTeam?.id}`] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive"
      });
    }
  };

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await apiRequest("/api/professional-services", "POST", {
        ...serviceData,
        teamId: selectedTeam?.id,
        providerId: null, // Team services don't have individual providers
        hourlyRate: serviceData.hourlyRate ? Math.round(parseFloat(serviceData.hourlyRate) * 100) : null,
        fixedPrice: serviceData.fixedPrice ? Math.round(parseFloat(serviceData.fixedPrice) * 100) : null,
        consultationRate: serviceData.consultationRate ? Math.round(parseFloat(serviceData.consultationRate) * 100) : null,
        duration: serviceData.duration ? parseInt(serviceData.duration) : null,
        skills: serviceData.skills ? serviceData.skills.split(',').map((s: string) => s.trim()) : [],
        categoryId: serviceData.categoryId ? parseInt(serviceData.categoryId) : undefined
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/professional-services?teamId=${selectedTeam?.id}`] });
      setCreateServiceDialogOpen(false);
      serviceForm.reset();
      toast({
        title: "Success",
        description: "Service created successfully",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive"
      });
    }
  });

  const handleCreateService = (data: any) => {
    // Validate required fields including category
    if (!data.categoryId) {
      toast({
        title: "Error",
        description: "Please select a service category",
        variant: "destructive"
      });
      return;
    }
    
    console.log("=== Creating Team Service ===", data);
    createServiceMutation.mutate(data);
  };

  const handleRoleToggle = async (member: any) => {
    const newRole = member.role === 'manager' ? 'member' : 'manager';
    
    if (updateMemberRoleMutation.isPending) return;
    
    // Confirm promotion to manager
    if (newRole === 'manager') {
      const confirmed = window.confirm(
        `Are you sure you want to promote ${member.employeeName} to Team Manager? They will have full management access to this team.`
      );
      if (!confirmed) return;
    }
    
    updateMemberRoleMutation.mutate({
      teamId: selectedTeam?.id,
      employeeId: member.employeeId,
      role: newRole
    });
  };

  const handleRemoveMember = (member: any) => {
    if (confirm(`Are you sure you want to remove ${member.employeeName} from the team?`)) {
      removeMemberMutation.mutate({
        teamId: selectedTeam.id,
        employeeId: member.employeeId
      });
    }
  };

  const handleAddMember = () => {
    if (!selectedMemberToAdd) {
      toast({
        title: "Error",
        description: "Please select a member to add",
        variant: "destructive"
      });
      return;
    }

    addMemberMutation.mutate({
      teamId: selectedTeam.id,
      employeeId: selectedMemberToAdd.id,
      role: selectedMemberRole
    });
  };

  // Filter users for search
  const filteredUsers = allUsers.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
    
    // Exclude users who are already team members
    const currentMemberIds = teamMembers?.map(m => m.employeeId) || [];
    const isNotCurrentMember = !currentMemberIds.includes(user.id);
    
    return matchesSearch && isNotCurrentMember;
  });

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Manage your teams, members, and settings</p>
      </div>

      {!managedTeams || managedTeams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teams to Manage</h3>
            <p className="text-muted-foreground">You are not currently managing any teams.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Teams ({managedTeams.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {managedTeams.map((team: any) => (
                  <div
                    key={team.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTeam?.id === team.id ? 'border-[rgb(248,153,59)] bg-[rgb(248,153,59)]/5' : ''
                    }`}
                    onClick={() => {
                      console.log(`=== Selecting team ${team.id}: ${team.name} ===`);
                      setSelectedTeam(team);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <ProfileAvatar
                          src={team.profileImage}
                          name={team.name}
                          size="md"
                        />
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">{team.memberCount} members</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTeam(team);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {!selectedTeam ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Team</h3>
                  <p className="text-muted-foreground">Choose a team from the list to view and manage its details.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <ProfileAvatar
                            src={selectedTeam.profileImage}
                            name={selectedTeam.name}
                            size="lg"
                          />
                          <div>
                            <CardTitle>{selectedTeam.name}</CardTitle>
                            <p className="text-muted-foreground mt-1">{selectedTeam.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditTeam(selectedTeam)}
                          className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Team
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Expertise Areas</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTeam.expertiseAreas?.length > 0 ? (
                            selectedTeam.expertiseAreas.map((area: string, index: number) => (
                              <Badge key={index} variant="secondary">{area}</Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-sm">No expertise areas defined</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Visibility</Label>
                          <p className="text-sm capitalize">{selectedTeam.visibility || 'Public'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Created</Label>
                          <p className="text-sm">{new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Team Members</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {teamMembers?.length || 0} members
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => setAddMemberDialogOpen(true)}
                            className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!teamMembers || teamMembers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No members in this team</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teamMembers.map((member: any) => (
                            <div key={member.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium">{member.employeeName}</h4>
                                  <p className="text-sm text-muted-foreground">{member.employeeEmail}</p>
                                </div>
                                <Badge 
                                  variant={member.role === 'manager' ? 'default' : 'outline'} 
                                  className={`${member.role === 'manager' ? 'bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white' : ''}`}
                                >
                                  {member.role === 'manager' ? 'Team Manager' : 'Member'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRoleToggle(member)}
                                  disabled={updateMemberRoleMutation.isPending}
                                  title={member.role === 'manager' ? 'Demote to Member' : 'Promote to Team Manager'}
                                  className={member.role === 'member' ? 'text-[rgb(248,153,59)] hover:text-[rgb(228,133,39)] border-[rgb(248,153,59)] hover:border-[rgb(228,133,39)]' : ''}
                                >
                                  {member.role === 'manager' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveMember(member)}
                                  disabled={removeMemberMutation.isPending}
                                  className="text-destructive hover:text-destructive"
                                  title="Remove from team"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Services</CardTitle>
                          <p className="text-muted-foreground">Manage professional services offered by this team</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setCreateServiceDialogOpen(true)}
                          className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!teamServices || teamServices.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No services created yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Add your first team service to start offering professional services</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {teamServices.map((service: any) => (
                            <div key={service.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{service.title}</h4>
                                    <Badge 
                                      variant={service.isActive ? "default" : "secondary"}
                                      className={service.isActive ? "bg-green-100 text-green-800" : ""}
                                    >
                                      {service.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{service.shortDescription || service.description}</p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-4 w-4" />
                                      {service.pricingType === 'hourly' && service.hourlyRate && (
                                        <span>${(service.hourlyRate / 100).toFixed(0)}/hr</span>
                                      )}
                                      {service.pricingType === 'fixed' && service.fixedPrice && (
                                        <span>${(service.fixedPrice / 100).toFixed(0)} fixed</span>
                                      )}
                                      {service.pricingType === 'consultation' && service.consultationRate && (
                                        <span>${(service.consultationRate / 100).toFixed(0)} consultation</span>
                                      )}
                                    </div>
                                    {service.duration && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{service.duration} min</span>
                                      </div>
                                    )}
                                    {service.averageRating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4" />
                                        <span>{service.averageRating.toFixed(1)} ({service.reviewCount || 0})</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditService(service)}
                                    title="Edit service"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteService(service)}
                                    className="text-destructive hover:text-destructive"
                                    title="Delete service"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTeamName">Team Name</Label>
              <Input
                id="editTeamName"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="editTeamDescription">Description</Label>
              <textarea
                id="editTeamDescription"
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
                placeholder="Enter team description"
                className="min-h-[80px] w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                rows={3}
              />
            </div>
            <div>
              <Label>Team Logo</Label>
              <ImageUpload
                value={editTeamLogo}
                onChange={setEditTeamLogo}
                name={editTeamName || "Team"}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Expertise Areas</Label>
              <div className="space-y-2">
                {/* Current expertise areas */}
                {editTeamExpertiseAreas && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background">
                    {editTeamExpertiseAreas.split(',').map((area, index) => {
                      const trimmedArea = area.trim();
                      if (!trimmedArea) return null;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {trimmedArea}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const areas = editTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                              const newAreas = areas.filter((_, i) => i !== index);
                              setEditTeamExpertiseAreas(newAreas.join(', '));
                            }}
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {/* Add new expertise area */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add expertise area"
                    value={newExpertiseArea}
                    onChange={(e) => setNewExpertiseArea(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newExpertiseArea.trim()) {
                        const currentAreas = editTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                        const newArea = newExpertiseArea.trim();
                        if (!currentAreas.includes(newArea)) {
                          const updatedAreas = [...currentAreas, newArea];
                          setEditTeamExpertiseAreas(updatedAreas.join(', '));
                          setNewExpertiseArea('');
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newExpertiseArea.trim()) {
                        const currentAreas = editTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                        const newArea = newExpertiseArea.trim();
                        if (!currentAreas.includes(newArea)) {
                          const updatedAreas = [...currentAreas, newArea];
                          setEditTeamExpertiseAreas(updatedAreas.join(', '));
                          setNewExpertiseArea('');
                        }
                      }
                    }}
                    className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setEditTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTeam}
                disabled={updateTeamMutation.isPending}
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Service Dialog */}
      <Dialog open={createServiceDialogOpen} onOpenChange={setCreateServiceDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Team Service</DialogTitle>
            <DialogDescription>
              Add a new professional service offered by {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(handleCreateService)} className="space-y-4">
              <FormField
                control={serviceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Portfolio Analysis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description for listings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category *</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceCategories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                        className="whitespace-nowrap"
                      >
                        {showNewCategoryInput ? "Cancel" : "Request New"}
                      </Button>
                    </div>
                    {showNewCategoryInput && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter new category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleCreateNewCategory}
                          disabled={createCategoryMutation.isPending}
                          className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                        >
                          {createCategoryMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of your service"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="pricingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pricing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serviceForm.watch("pricingType") === "hourly" && (
                  <FormField
                    control={serviceForm.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="150"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {serviceForm.watch("pricingType") === "fixed" && (
                  <FormField
                    control={serviceForm.control}
                    name="fixedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixed Price ($) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {serviceForm.watch("pricingType") === "consultation" && (
                  <FormField
                    control={serviceForm.control}
                    name="consultationRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation Rate ($) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={serviceForm.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Financial Analysis, Risk Management"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateServiceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createServiceMutation.isPending}
                  className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                >
                  {createServiceMutation.isPending ? "Creating..." : "Create Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      {editingService && (
        <Dialog open={editServiceDialogOpen} onOpenChange={setEditServiceDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update service details for {editingService.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Service Title</Label>
                <Input
                  id="editTitle"
                  defaultValue={editingService.title}
                  placeholder="Service title"
                />
              </div>
              <div>
                <Label htmlFor="editShortDescription">Short Description</Label>
                <Input
                  id="editShortDescription"
                  defaultValue={editingService.shortDescription}
                  placeholder="Brief description for listings"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Full Description</Label>
                <Textarea
                  id="editDescription"
                  defaultValue={editingService.description}
                  placeholder="Detailed service description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPricingType">Pricing Type</Label>
                  <Select defaultValue={editingService.pricingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingService.pricingType === "hourly" && (
                  <div>
                    <Label htmlFor="editHourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="editHourlyRate"
                      type="number"
                      defaultValue={editingService.hourlyRate ? (editingService.hourlyRate / 100).toString() : ""}
                      placeholder="150"
                    />
                  </div>
                )}
                {editingService.pricingType === "fixed" && (
                  <div>
                    <Label htmlFor="editFixedPrice">Fixed Price ($)</Label>
                    <Input
                      id="editFixedPrice"
                      type="number"
                      defaultValue={editingService.fixedPrice ? (editingService.fixedPrice / 100).toString() : ""}
                      placeholder="500"
                    />
                  </div>
                )}
                {editingService.pricingType === "consultation" && (
                  <div>
                    <Label htmlFor="editConsultationRate">Consultation Rate ($)</Label>
                    <Input
                      id="editConsultationRate"
                      type="number"
                      defaultValue={editingService.consultationRate ? (editingService.consultationRate / 100).toString() : ""}
                      placeholder="200"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDuration">Duration (minutes)</Label>
                  <Input
                    id="editDuration"
                    type="number"
                    defaultValue={editingService.duration ? editingService.duration.toString() : ""}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="editSkills">Required Skills</Label>
                  <Input
                    id="editSkills"
                    defaultValue={Array.isArray(editingService.skills) ? editingService.skills.join(', ') : editingService.skills || ""}
                    placeholder="e.g., Financial Analysis, Risk Management"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Separate multiple skills with commas
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditServiceDialogOpen(false);
                    setEditingService(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // For now, just show a success message
                    toast({
                      title: "Success",
                      description: "Service updates will be implemented in next iteration",
                      className: "bg-green-50 border-green-200 text-green-800"
                    });
                    setEditServiceDialogOpen(false);
                    setEditingService(null);
                  }}
                  className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search and select a user to add to your team. Employee profiles will be created automatically if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <Label htmlFor="memberSearch">Search Users</Label>
              <Input
                id="memberSearch"
                placeholder="Search by name or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>

            {/* User Search Results */}
            {memberSearchQuery && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Search Results</Label>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {allUsersLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {memberSearchQuery ? "No users found matching your search" : "Start typing to search for users"}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredUsers.slice(0, 10).map((user: any) => (
                        <div
                          key={user.id}
                          className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                            selectedMemberToAdd?.id === user.id ? 'bg-[rgb(248,153,59)]/10 border border-[rgb(248,153,59)]' : ''
                          }`}
                          onClick={() => setSelectedMemberToAdd(user)}
                        >
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {!user.hasEmployeeProfile && (
                            <div className="text-xs text-blue-600 mt-1">Profile will be created automatically</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Member */}
            {selectedMemberToAdd && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Selected Member</Label>
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="font-medium">{selectedMemberToAdd.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMemberToAdd.email}</div>
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="memberRole">Role</Label>
                  <Select value={selectedMemberRole} onValueChange={setSelectedMemberRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Team Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAddMemberDialogOpen(false);
                  setMemberSearchQuery("");
                  setSelectedMemberToAdd(null);
                  setSelectedMemberRole("member");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedMemberToAdd || addMemberMutation.isPending}
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}