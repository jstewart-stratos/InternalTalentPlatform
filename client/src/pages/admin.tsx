import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Activity, Settings, Shield, Lock, Unlock, UserCheck, Clock, AlertTriangle, Plus, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, SiteSetting, AuditLog, ServiceCategory } from "@shared/schema";

export default function Admin() {
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingDescription, setNewSettingDescription] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [editingValue, setEditingValue] = useState("");
  
  // Service category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryDescription, setEditingCategoryDescription] = useState("");

  // User creation state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");

  // Team creation state
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamExpertiseAreas, setNewTeamExpertiseAreas] = useState("");
  const [newTeamVisibility, setNewTeamVisibility] = useState("public");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  
  // Team editing state
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamExpertiseAreas, setEditTeamExpertiseAreas] = useState("");
  const [editTeamVisibility, setEditTeamVisibility] = useState("public");
  const [currentTeamMembers, setCurrentTeamMembers] = useState<any[]>([]);
  const [editSelectedMembers, setEditSelectedMembers] = useState<number[]>([]);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);

  // User editing state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserFirstName, setEditUserFirstName] = useState("");
  const [editUserLastName, setEditUserLastName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("user");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [resetPassword, setResetPassword] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users']
  });

  const { data: siteSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings']
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs']
  });

  const { data: serviceCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/admin/service-categories']
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/admin/teams']
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees']
  });

  // For team member selection, we should show all users, not just employees with profiles
  const { data: allUsersForTeams = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/admin/users-for-teams']
  });

  // Fetch current team members when editing a team
  const { data: teamDetails, refetch: refetchTeamDetails } = useQuery({
    queryKey: ['/api/teams', editingTeam?.id],
    enabled: !!editingTeam,
    onSuccess: (data: any) => {
      if (data && data.members) {
        setCurrentTeamMembers(data.members);
        setEditSelectedMembers(data.members.map((m: any) => m.employeeId));
      }
    }
  });

  // Admin mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/role`, 'PUT', { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: (error) => {
      console.error("Role update error:", error);
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    }
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}/deactivate`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User deactivated successfully" });
    },
    onError: (error) => {
      console.error("Deactivation error:", error);
      toast({ title: "Error", description: "Failed to deactivate user", variant: "destructive" });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}/activate`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User activated successfully" });
    },
    onError: (error) => {
      console.error("Activation error:", error);
      toast({ title: "Error", description: "Failed to activate user", variant: "destructive" });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; firstName: string; lastName: string; password: string; role: string }) => {
      return await apiRequest('/api/admin/users', 'POST', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserPassword("");
      setNewUserRole("user");
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: (error) => {
      console.error("User creation error:", error);
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: { name: string; description: string; expertiseAreas: string[]; visibility: string; members?: number[] }) => {
      return await apiRequest('/api/admin/teams', 'POST', teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamExpertiseAreas("");
      setNewTeamVisibility("public");
      setSelectedTeamMembers([]);
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: (error) => {
      console.error("Team creation error:", error);
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: { id: number; name: string; description: string; expertiseAreas: string[]; visibility: string; members?: number[] }) => {
      return await apiRequest(`/api/admin/teams/${teamData.id}`, 'PUT', teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams', editingTeam?.id] });
      setEditingTeam(null);
      setEditTeamDialogOpen(false);
      setCurrentTeamMembers([]);
      setEditSelectedMembers([]);
      toast({ title: "Success", description: "Team updated successfully" });
    },
    onError: (error) => {
      console.error("Team update error:", error);
      toast({ title: "Error", description: "Failed to update team", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number; firstName: string; lastName: string; email: string; role: string; password?: string }) => {
      return await apiRequest(`/api/admin/users/${userData.id}`, 'PUT', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      setEditUserDialogOpen(false);
      setEditUserPassword("");
      setResetPassword(false);
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: (error) => {
      console.error("User update error:", error);
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; description: string }) => {
      return await apiRequest('/api/admin/service-categories', 'POST', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-categories'] });
      setNewCategoryName("");
      setNewCategoryDescription("");
      toast({ title: "Success", description: "Service category created successfully" });
    },
    onError: (error) => {
      console.error("Category creation error:", error);
      toast({ title: "Error", description: "Failed to create service category", variant: "destructive" });
    }
  });

  // Helper functions
  const handleRoleChange = async (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleUserToggle = async (userId: string, isActive: boolean) => {
    if (isActive) {
      deactivateUserMutation.mutate(userId);
    } else {
      activateUserMutation.mutate(userId);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }
    
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim()
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, settings, and system configuration
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users & Teams</span>
          </TabsTrigger>
          <TabsTrigger value="service-categories" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Service Categories</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setNewUserEmail("");
                  setNewUserFirstName("");
                  setNewUserLastName("");
                  setNewUserPassword("");
                  setNewUserRole("user");
                  setCreateUserDialogOpen(true);
                }}
                className="ml-auto bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(users as User[]).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="font-semibold">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="team-manager">Team Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditUserFirstName(user.firstName);
                                  setEditUserLastName(user.lastName);
                                  setEditUserEmail(user.email);
                                  setEditUserRole(user.role || 'user');
                                  setEditUserPassword("");
                                  setResetPassword(false);
                                  setEditUserDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={user.isActive ? "destructive" : "default"}
                                onClick={() => handleUserToggle(user.id, user.isActive)}
                                className="whitespace-nowrap"
                              >
                                {user.isActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                <span className="ml-1">{user.isActive ? "Deactivate" : "Activate"}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage teams and their members
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setNewTeamName("");
                  setNewTeamDescription("");
                  setNewTeamExpertiseAreas("");
                  setNewTeamVisibility("public");
                  setSelectedTeamMembers([]);
                  setCreateTeamDialogOpen(true);
                }}
                className="ml-auto bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="text-center py-8">Loading teams...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No teams found. Create a team to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teams.map((team: any) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>{team.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{team.memberCount || 0} members</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={team.visibility === 'public' ? 'default' : 'secondary'}>
                              {team.visibility}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-4" />
                              <span>
                                {new Date(team.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingTeam(team);
                                setEditTeamName(team.name);
                                setEditTeamDescription(team.description);
                                setEditTeamExpertiseAreas(team.specialties?.join(', ') || '');
                                setEditTeamVisibility(team.visibility || 'public');
                                setCurrentTeamMembers([]);
                                setEditSelectedMembers([]);
                                setEditTeamDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newUserEmail">Email Address</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserPassword">Password</Label>
                    <Input
                      id="newUserPassword"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newUserFirstName">First Name</Label>
                    <Input
                      id="newUserFirstName"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserLastName">Last Name</Label>
                    <Input
                      id="newUserLastName"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newUserRole">User Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="team-manager">Team Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
                      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
                      return;
                    }
                    createUserMutation.mutate({
                      email: newUserEmail,
                      password: newUserPassword,
                      firstName: newUserFirstName,
                      lastName: newUserLastName,
                      role: newUserRole
                    });
                  }}
                  disabled={createUserMutation.isPending}
                  className="px-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage teams and their members
                </CardDescription>
              </div>
              <Button onClick={() => setActiveTab('create-team')} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="text-center py-8">Loading teams...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No teams found. Create a team to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teams.map((team: any) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>{team.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{team.memberCount || 0} members</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={team.visibility === 'public' ? 'default' : 'secondary'}>
                              {team.visibility}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(team.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingTeam(team);
                                setEditTeamName(team.name);
                                setEditTeamDescription(team.description);
                                setEditTeamExpertiseAreas(team.specialties?.join(', ') || '');
                                setEditTeamVisibility(team.visibility || 'public');
                                setCurrentTeamMembers([]);
                                setEditSelectedMembers([]);
                                setEditTeamDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Team Tab */}
        <TabsContent value="create-team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
              <CardDescription>
                Set up a new team for collaboration and project management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newTeamName">Team Name</Label>
                    <Input
                      id="newTeamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newTeamDescription">Description</Label>
                    <Input
                      id="newTeamDescription"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      placeholder="Brief description of the team"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newTeamExpertiseAreas">Expertise Areas (comma-separated)</Label>
                    <Input
                      id="newTeamExpertiseAreas"
                      value={newTeamExpertiseAreas}
                      onChange={(e) => setNewTeamExpertiseAreas(e.target.value)}
                      placeholder="Finance, Risk Management, Compliance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newTeamVisibility">Team Visibility</Label>
                    <Select value={newTeamVisibility} onValueChange={setNewTeamVisibility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Team Members Selection */}
              <div className="space-y-4">
                <Label>Team Members (Optional)</Label>
                <p className="text-xs text-muted-foreground">Only users with employee profiles can be added to teams</p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {allUsersLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                  ) : allUsersForTeams.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No users available</div>
                  ) : (
                    <div className="space-y-2">
                      {(allUsersForTeams as any[]).filter(user => user.hasEmployeeProfile).map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`member-${user.id}`}
                            checked={selectedTeamMembers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                              } else {
                                setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label 
                            htmlFor={`member-${user.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <div className="font-medium">
                              {user.name}
                              {!user.hasEmployeeProfile && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">No Profile</span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {user.title} • {user.email}
                              {user.skills?.length > 0 && ` • ${user.skills.slice(0, 3).join(', ')}`}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedTeamMembers.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedTeamMembers.length} member{selectedTeamMembers.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    if (!newTeamName || !newTeamDescription) {
                      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
                      return;
                    }
                    const expertiseAreas = newTeamExpertiseAreas.split(',').map(area => area.trim()).filter(area => area);
                    createTeamMutation.mutate({
                      name: newTeamName,
                      description: newTeamDescription,
                      expertiseAreas,
                      visibility: newTeamVisibility,
                      members: selectedTeamMembers
                    });
                  }}
                  disabled={createTeamMutation.isPending}
                  className="px-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Team Tab */}
        {editingTeam && (
          <TabsContent value="edit-team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Team: {editingTeam.name}</CardTitle>
                <CardDescription>
                  Update team information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Input
                        id="editTeamDescription"
                        value={editTeamDescription}
                        onChange={(e) => setEditTeamDescription(e.target.value)}
                        placeholder="Brief description of the team"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editTeamExpertiseAreas">Expertise Areas (comma-separated)</Label>
                      <Input
                        id="editTeamExpertiseAreas"
                        value={editTeamExpertiseAreas}
                        onChange={(e) => setEditTeamExpertiseAreas(e.target.value)}
                        placeholder="Finance, Risk Management, Compliance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editTeamVisibility">Team Visibility</Label>
                      <Select value={editTeamVisibility} onValueChange={setEditTeamVisibility}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Member Management Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Team Members</Label>
                    <Badge variant="secondary">
                      {editSelectedMembers.length} selected
                    </Badge>
                  </div>
                  
                  {/* Current Members */}
                  {currentTeamMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Current Members</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentTeamMembers.map((member: any) => (
                          <div key={member.employeeId} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{member.employee?.name || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditSelectedMembers(editSelectedMembers.filter(id => id !== member.employeeId));
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Members */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Add New Members</Label>
                    <p className="text-xs text-muted-foreground">Only users with employee profiles can be added to teams</p>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                      {allUsersLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                      ) : allUsersForTeams.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No users available</div>
                      ) : (
                        <div className="space-y-2">
                          {(allUsersForTeams as any[])
                            .filter(user => user.hasEmployeeProfile && !editSelectedMembers.includes(user.id))
                            .map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                              <input
                                type="checkbox"
                                id={`edit-member-${user.id}`}
                                checked={editSelectedMembers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditSelectedMembers([...editSelectedMembers, user.id]);
                                  } else {
                                    setEditSelectedMembers(editSelectedMembers.filter(id => id !== user.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <label 
                                htmlFor={`edit-member-${user.id}`}
                                className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-muted-foreground ml-2">({user.email})</span>
                                </div>
                                <div className="text-xs">
                                  <Badge variant={user.hasEmployeeProfile ? "default" : "secondary"} className="text-xs">
                                    {user.hasEmployeeProfile ? "Employee" : "User"}
                                  </Badge>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingTeam(null);
                      setActiveTab("teams");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!editTeamName || !editTeamDescription) {
                        toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
                        return;
                      }
                      const expertiseAreas = editTeamExpertiseAreas.split(',').map(area => area.trim()).filter(area => area);
                      updateTeamMutation.mutate({
                        id: editingTeam.id,
                        name: editTeamName,
                        description: editTeamDescription,
                        expertiseAreas,
                        visibility: editTeamVisibility,
                        members: editSelectedMembers
                      });
                    }}
                    disabled={updateTeamMutation.isPending}
                    className="px-8"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Service Categories Tab */}
        <TabsContent value="service-categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories Management</CardTitle>
              <CardDescription>
                Manage professional service categories for the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Service Category */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add New Service Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Input
                      id="categoryDescription"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Service Categories List */}
              {categoriesLoading ? (
                <div className="text-center py-8">Loading categories...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(serviceCategories as ServiceCategory[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No service categories found. Create one above to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (serviceCategories as ServiceCategory[]).map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="default">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(category.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Configure application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="text-center py-8">Loading settings...</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Site settings management coming soon.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View system activity and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading audit logs...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(auditLogs as AuditLog[]).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No audit logs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (auditLogs as AuditLog[]).slice(0, 50).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.userId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.targetType}: {log.targetId}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {log.ipAddress || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                View system usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.firstName} {editingUser?.lastName}</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editUserFirstName">First Name</Label>
                <Input
                  id="editUserFirstName"
                  value={editUserFirstName}
                  onChange={(e) => setEditUserFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="editUserLastName">Last Name</Label>
                <Input
                  id="editUserLastName"
                  value={editUserLastName}
                  onChange={(e) => setEditUserLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editUserEmail">Email Address</Label>
              <Input
                id="editUserEmail"
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="editUserRole">Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="team-manager">Team Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Password Reset Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resetPassword"
                  checked={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.checked);
                    if (!e.target.checked) {
                      setEditUserPassword("");
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="resetPassword" className="text-sm font-medium">
                  Reset user password
                </Label>
              </div>
              
              {resetPassword && (
                <div>
                  <Label htmlFor="editUserPassword">New Password</Label>
                  <Input
                    id="editUserPassword"
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a new password for this user
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                  setEditUserPassword("");
                  setResetPassword(false);
                  setEditUserDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!editUserFirstName || !editUserLastName || !editUserEmail) {
                    toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
                    return;
                  }
                  if (resetPassword && !editUserPassword) {
                    toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
                    return;
                  }
                  const updateData: any = {
                    id: editingUser.id,
                    firstName: editUserFirstName,
                    lastName: editUserLastName,
                    email: editUserEmail,
                    role: editUserRole
                  };
                  if (resetPassword && editUserPassword) {
                    updateData.password = editUserPassword;
                  }
                  updateUserMutation.mutate(updateData);
                }}
                disabled={updateUserMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team: {editingTeam?.name}</DialogTitle>
            <DialogDescription>
              Update team information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="editTeamVisibility">Team Visibility</Label>
                <Select value={editTeamVisibility} onValueChange={setEditTeamVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editTeamDescription">Description</Label>
              <Input
                id="editTeamDescription"
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
                placeholder="Brief description of the team"
              />
            </div>
            <div>
              <Label htmlFor="editTeamExpertiseAreas">Expertise Areas (comma-separated)</Label>
              <Input
                id="editTeamExpertiseAreas"
                value={editTeamExpertiseAreas}
                onChange={(e) => setEditTeamExpertiseAreas(e.target.value)}
                placeholder="Finance, Risk Management, Compliance"
              />
            </div>

            {/* Team Member Management */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Team Members</Label>
                <Badge variant="secondary">
                  {editSelectedMembers.length} selected
                </Badge>
              </div>
              
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                {allUsersLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                ) : allUsersForTeams.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No users available</div>
                ) : (
                  <div className="space-y-2">
                    {(allUsersForTeams as any[])
                      .filter(user => user.hasEmployeeProfile)
                      .map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                        <input
                          type="checkbox"
                          id={`edit-member-${user.id}`}
                          checked={editSelectedMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSelectedMembers([...editSelectedMembers, user.id]);
                            } else {
                              setEditSelectedMembers(editSelectedMembers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label 
                          htmlFor={`edit-member-${user.id}`}
                          className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium">{user.name}</span>
                            <span className="text-muted-foreground ml-2">({user.email})</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {user.title || 'No Title'}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Only users with employee profiles can be added to teams</p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingTeam(null);
                  setEditTeamDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!editTeamName || !editTeamDescription) {
                    toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
                    return;
                  }
                  const expertiseAreas = editTeamExpertiseAreas.split(',').map(area => area.trim()).filter(area => area);
                  updateTeamMutation.mutate({
                    id: editingTeam.id,
                    name: editTeamName,
                    description: editTeamDescription,
                    expertiseAreas,
                    visibility: editTeamVisibility,
                    members: editSelectedMembers
                  });
                }}
                disabled={updateTeamMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email and password authentication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newUserFirstName">First Name</Label>
                <Input
                  id="newUserFirstName"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="newUserLastName">Last Name</Label>
                <Input
                  id="newUserLastName"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newUserEmail">Email Address</Label>
              <Input
                id="newUserEmail"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label htmlFor="newUserPassword">Password</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="newUserRole">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="team-manager">Team Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewUserEmail("");
                  setNewUserFirstName("");
                  setNewUserLastName("");
                  setNewUserPassword("");
                  setNewUserRole("user");
                  setCreateUserDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
                    toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
                    return;
                  }
                  createUserMutation.mutate({
                    email: newUserEmail,
                    password: newUserPassword,
                    firstName: newUserFirstName,
                    lastName: newUserLastName,
                    role: newUserRole
                  });
                }}
                disabled={createUserMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription>
              Create a new team with members and expertise areas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newTeamName">Team Name</Label>
                <Input
                  id="newTeamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="newTeamVisibility">Team Visibility</Label>
                <Select value={newTeamVisibility} onValueChange={setNewTeamVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="newTeamDescription">Description</Label>
              <Input
                id="newTeamDescription"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Brief description of the team"
              />
            </div>
            <div>
              <Label htmlFor="newTeamExpertiseAreas">Expertise Areas (comma-separated)</Label>
              <Input
                id="newTeamExpertiseAreas"
                value={newTeamExpertiseAreas}
                onChange={(e) => setNewTeamExpertiseAreas(e.target.value)}
                placeholder="Finance, Risk Management, Compliance"
              />
            </div>

            {/* Team Member Selection */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Team Members (Optional)</Label>
                <Badge variant="secondary">
                  {selectedTeamMembers.length} selected
                </Badge>
              </div>
              
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                {allUsersLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                ) : allUsersForTeams.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No users available</div>
                ) : (
                  <div className="space-y-2">
                    {(allUsersForTeams as any[])
                      .filter(user => user.hasEmployeeProfile)
                      .map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                        <input
                          type="checkbox"
                          id={`member-${user.id}`}
                          checked={selectedTeamMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                            } else {
                              setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label 
                          htmlFor={`member-${user.id}`}
                          className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium">{user.name}</span>
                            <span className="text-muted-foreground ml-2">({user.email})</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {user.title || 'No Title'}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Only users with employee profiles can be added to teams</p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewTeamName("");
                  setNewTeamDescription("");
                  setNewTeamExpertiseAreas("");
                  setNewTeamVisibility("public");
                  setSelectedTeamMembers([]);
                  setCreateTeamDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!newTeamName || !newTeamDescription) {
                    toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
                    return;
                  }
                  const expertiseAreas = newTeamExpertiseAreas.split(',').map(area => area.trim()).filter(area => area);
                  createTeamMutation.mutate({
                    name: newTeamName,
                    description: newTeamDescription,
                    expertiseAreas,
                    visibility: newTeamVisibility,
                    members: selectedTeamMembers
                  });
                }}
                disabled={createTeamMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}