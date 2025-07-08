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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Activity, Settings, Shield, Clock, Plus, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, ServiceCategory } from "@shared/schema";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  
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
  const [newExpertiseAreaForCreate, setNewExpertiseAreaForCreate] = useState("");
  const [newTeamVisibility, setNewTeamVisibility] = useState("public");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  
  // Team editing state
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamExpertiseAreas, setEditTeamExpertiseAreas] = useState("");
  const [newExpertiseArea, setNewExpertiseArea] = useState("");
  const [editTeamVisibility, setEditTeamVisibility] = useState("public");
  const [editSelectedMembers, setEditSelectedMembers] = useState<number[]>([]);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

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

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/admin/teams']
  });

  const { data: allUsersForTeams = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/admin/all-users-for-teams']
  });

  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['/api/service-categories']
  });

  // Current team members query for editing
  const { data: currentTeamMembers = [], isLoading: currentMembersLoading } = useQuery({
    queryKey: [`/api/admin/teams/${editingTeam?.id}/members`],
    enabled: !!editingTeam?.id
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/admin/users', 'POST', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-users-for-teams'] });
      setCreateUserDialogOpen(false);
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserPassword("");
      setNewUserRole("user");
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string, userData: any }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, 'PUT', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-users-for-teams'] });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
    }
  });

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const response = await apiRequest('/api/admin/teams', 'POST', teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      setCreateTeamDialogOpen(false);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamExpertiseAreas("");
      setNewTeamVisibility("public");
      setSelectedTeamMembers([]);
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create team", variant: "destructive" });
    }
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId, role = 'member' }: { teamId: number, employeeId: number, role?: string }) => {
      const response = await apiRequest(`/api/admin/teams/${teamId}/members`, 'POST', { employeeId, role });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/teams/${variables.teamId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-users-for-teams'] });
      toast({ title: "Success", description: "Team member added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add team member", variant: "destructive" });
    }
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId }: { teamId: number, employeeId: number }) => {
      const response = await apiRequest(`/api/admin/teams/${teamId}/members/${employeeId}`, 'DELETE');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/teams/${variables.teamId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-users-for-teams'] });
      toast({ title: "Success", description: "Team member removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove team member", variant: "destructive" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, teamData }: { teamId: number, teamData: any }) => {
      const response = await apiRequest(`/api/admin/teams/${teamId}`, 'PUT', teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      setEditTeamDialogOpen(false);
      setEditingTeam(null);
      toast({ title: "Success", description: "Team updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update team", variant: "destructive" });
    }
  });

  // Service category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest('/api/service-categories', 'POST', categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      setNewCategoryName("");
      setNewCategoryDescription("");
      toast({ title: "Success", description: "Service category created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create service category", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, categoryData }: { categoryId: number, categoryData: any }) => {
      const response = await apiRequest(`/api/service-categories/${categoryId}`, 'PUT', categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      setEditingCategory(null);
      toast({ title: "Success", description: "Service category updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update service category", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest(`/api/service-categories/${categoryId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      toast({ title: "Success", description: "Service category deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete service category", variant: "destructive" });
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, teams, and system configuration
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

        {/* Users & Teams Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Users Section */}
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
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  {!user.hasEmployeeProfile && (
                                    <Badge variant="outline" className="text-xs mt-1">No Profile</Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : user.role === 'team-manager' ? 'secondary' : 'outline'}>
                                {user.role === 'team-manager' ? 'Team Manager' : user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
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
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditUserFirstName(user.firstName || "");
                                  setEditUserLastName(user.lastName || "");
                                  setEditUserEmail(user.email);
                                  setEditUserRole(user.role);
                                  setEditUserPassword("");
                                  setResetPassword(false);
                                  setEditUserDialogOpen(true);
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
                              onClick={async () => {
                                setEditingTeam(team);
                                setEditTeamName(team.name);
                                setEditTeamDescription(team.description);
                                setEditTeamExpertiseAreas(team.specialties?.join(', ') || '');
                                setEditTeamVisibility(team.visibility || 'public');
                                
                                // Fetch current team members
                                try {
                                  const response = await fetch(`/api/admin/teams/${team.id}/members`, {
                                    credentials: "include"
                                  });
                                  if (response.ok) {
                                    const members = await response.json();
                                    // Use employeeId for team member selection, not userId
                                    const memberIds = members.map((member: any) => member.employeeId);
                                    setEditSelectedMembers(memberIds);
                                  } else {
                                    setEditSelectedMembers([]);
                                  }
                                } catch (error) {
                                  console.error("Error fetching team members:", error);
                                  setEditSelectedMembers([]);
                                }
                                
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

        {/* Service Categories Tab */}
        <TabsContent value="service-categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>
                Manage service categories for marketplace organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="newCategoryName">Category Name</Label>
                  <Input
                    id="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="newCategoryDescription">Description</Label>
                  <Input
                    id="newCategoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      if (!newCategoryName.trim()) {
                        toast({ title: "Error", description: "Category name is required", variant: "destructive" });
                        return;
                      }
                      createCategoryMutation.mutate({
                        name: newCategoryName.trim(),
                        description: newCategoryDescription.trim()
                      });
                    }}
                    disabled={createCategoryMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {serviceCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No service categories found. Create one to get started.
                  </div>
                ) : (
                  serviceCategories.map((category: any) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      {editingCategory?.id === category.id ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mr-4">
                          <Input
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            placeholder="Category name"
                          />
                          <Input
                            value={editingCategoryDescription}
                            onChange={(e) => setEditingCategoryDescription(e.target.value)}
                            placeholder="Description"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="font-medium">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        {editingCategory?.id === category.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                updateCategoryMutation.mutate({
                                  categoryId: category.id,
                                  categoryData: {
                                    name: editingCategoryName,
                                    description: editingCategoryDescription
                                  }
                                });
                              }}
                              disabled={updateCategoryMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCategory(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(category);
                                setEditingCategoryName(category.name);
                                setEditingCategoryDescription(category.description || "");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this category?")) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                System activity and user action logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Audit logs functionality coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                User engagement and platform metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
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
            {/* Team Description */}
            <div className="space-y-2">
              <Label htmlFor="newTeamDescription" className="text-base font-semibold">Team Description</Label>
              <textarea
                id="newTeamDescription"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Enter a detailed description of the team, its purpose, goals, and areas of focus..."
                className="min-h-[100px] w-full px-3 py-2 text-sm border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {newTeamDescription.length}/500 characters
              </p>
            </div>
            {/* Expertise Areas Management */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Expertise Areas</Label>
              
              {/* Current Expertise Areas */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Expertise:</Label>
                {newTeamExpertiseAreas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    No expertise areas defined
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-background">
                    {newTeamExpertiseAreas.split(',').map((area, index) => {
                      const trimmedArea = area.trim();
                      if (!trimmedArea) return null;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {trimmedArea}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const areas = newTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                              const newAreas = areas.filter((_, i) => i !== index);
                              setNewTeamExpertiseAreas(newAreas.join(', '));
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
              </div>
              
              {/* Add New Expertise Area */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add Expertise Area:</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Risk Management, Financial Planning"
                    value={newExpertiseAreaForCreate}
                    onChange={(e) => setNewExpertiseAreaForCreate(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newExpertiseAreaForCreate.trim()) {
                        const currentAreas = newTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                        const newArea = newExpertiseAreaForCreate.trim();
                        if (!currentAreas.includes(newArea)) {
                          const updatedAreas = [...currentAreas, newArea];
                          setNewTeamExpertiseAreas(updatedAreas.join(', '));
                          setNewExpertiseAreaForCreate('');
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newExpertiseAreaForCreate.trim()) {
                        const currentAreas = newTeamExpertiseAreas.split(',').map(a => a.trim()).filter(a => a);
                        const newArea = newExpertiseAreaForCreate.trim();
                        if (!currentAreas.includes(newArea)) {
                          const updatedAreas = [...currentAreas, newArea];
                          setNewTeamExpertiseAreas(updatedAreas.join(', '));
                          setNewExpertiseAreaForCreate('');
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

            {/* Team Member Selection */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Team Members (Optional)</Label>
                <Badge variant="secondary">
                  {selectedTeamMembers.length} members
                </Badge>
              </div>
              
              {/* Search and Add Members */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Search by name or email. Employee profiles will be created automatically if needed.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users to add..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Search Results */}
                {memberSearchQuery && (
                  <div className="border rounded-lg max-h-32 overflow-y-auto bg-background">
                    {allUsersLoading ? (
                      <div className="text-center py-2 text-muted-foreground text-sm">Loading...</div>
                    ) : (
                      <div className="p-1">
                        {(allUsersForTeams as any[])
                          .filter(user => 
                            !selectedTeamMembers.includes(user.id) &&
                            (user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          )
                          .slice(0, 5)
                          .map((user) => (
                            <div 
                              key={user.id} 
                              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                              onClick={() => {
                                setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                                setMemberSearchQuery('');
                              }}
                            >
                              <div>
                                <span className="font-medium text-sm">{user.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">({user.email})</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {user.title || 'No Title'}
                              </Badge>
                            </div>
                          ))}
                        {(allUsersForTeams as any[])
                          .filter(user => 
                            !selectedTeamMembers.includes(user.id) &&
                            (user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          ).length === 0 && (
                          <div className="text-center py-2 text-muted-foreground text-sm">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Members List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Members:</Label>
                {selectedTeamMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    No members selected
                  </div>
                ) : (
                  <div className="border rounded-lg p-2 max-h-32 overflow-y-auto bg-background">
                    {selectedTeamMembers.map((userId) => {
                      const user = (allUsersForTeams as any[]).find(u => u.id === userId);
                      if (!user) return null;
                      return (
                        <div key={userId} className="flex items-center justify-between p-1 hover:bg-muted/25 rounded">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-medium text-sm">{user.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">({user.email})</span>
                            </div>
                            <Badge 
                              variant={user.role === 'team-manager' ? 'default' : 'outline'} 
                              className={`text-xs ${user.role === 'team-manager' ? 'bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white' : ''}`}
                            >
                              {user.role === 'team-manager' ? 'Team Manager' : 'Member'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== userId));
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Search and click to add members. Only users with employee profiles can be added to teams.</p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewTeamName("");
                  setNewTeamDescription("");
                  setNewTeamExpertiseAreas("");
                  setNewExpertiseAreaForCreate("");
                  setNewTeamVisibility("public");
                  setSelectedTeamMembers([]);
                  setMemberSearchQuery("");
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
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                placeholder="user@company.com"
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
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resetPassword"
                  checked={resetPassword}
                  onChange={(e) => setResetPassword(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="resetPassword" className="text-sm">
                  Reset password
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
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                  setEditUserDialogOpen(false);
                  setResetPassword(false);
                  setEditUserPassword("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const updateData: any = {
                    firstName: editUserFirstName,
                    lastName: editUserLastName,
                    email: editUserEmail,
                    role: editUserRole
                  };
                  
                  if (resetPassword && editUserPassword) {
                    updateData.password = editUserPassword;
                  }
                  
                  updateUserMutation.mutate({
                    userId: editingUser.id,
                    userData: updateData
                  });
                }}
                disabled={updateUserMutation.isPending}
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
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
              Update team information and members
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
            {/* Team Description Management */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Team Description</Label>
              
              {/* Current Description Display */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Description:</Label>
                {!editTeamDescription || editTeamDescription.trim().length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    No description provided
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-sm">{editTeamDescription}</p>
                  </div>
                )}
              </div>
              
              {/* Edit Description */}
              <div className="space-y-2">
                <Label htmlFor="editTeamDescription" className="text-sm font-medium">Edit Description:</Label>
                <textarea
                  id="editTeamDescription"
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                  placeholder="Enter a detailed description of the team, its purpose, goals, and areas of focus..."
                  className="min-h-[100px] w-full px-3 py-2 text-sm border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {editTeamDescription.length}/500 characters
                </p>
              </div>
            </div>
            {/* Expertise Areas Management */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Expertise Areas</Label>
              
              {/* Current Expertise Areas */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Expertise:</Label>
                {editTeamExpertiseAreas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    No expertise areas defined
                  </div>
                ) : (
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
              </div>
              
              {/* Add New Expertise Area */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add Expertise Area:</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Risk Management, Financial Planning"
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

            {/* Team Members Management */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Team Members</Label>
                <Badge variant="secondary">
                  {editSelectedMembers.length} members
                </Badge>
              </div>
              
              {/* Search and Add Members */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Search by name or email. Employee profiles will be created automatically if needed.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users to add..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Search Results */}
                {memberSearchQuery && (
                  <div className="border rounded-lg max-h-32 overflow-y-auto bg-background">
                    {allUsersLoading ? (
                      <div className="text-center py-2 text-muted-foreground text-sm">Loading...</div>
                    ) : (
                      <div className="p-1">
                        {(allUsersForTeams as any[])
                          .filter(user => 
                            !editSelectedMembers.includes(user.id) &&
                            (user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          )
                          .slice(0, 5)
                          .map((user) => (
                            <div 
                              key={user.id} 
                              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                              onClick={() => {
                                addTeamMemberMutation.mutate({
                                  teamId: editingTeam.id,
                                  employeeId: user.id
                                });
                                setMemberSearchQuery('');
                              }}
                            >
                              <div>
                                <span className="font-medium text-sm">{user.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">({user.email})</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {user.title || 'No Title'}
                              </Badge>
                            </div>
                          ))}
                        {(allUsersForTeams as any[])
                          .filter(user => 
                            !editSelectedMembers.includes(user.id) &&
                            (user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          ).length === 0 && (
                          <div className="text-center py-2 text-muted-foreground text-sm">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Members List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Members:</Label>
                {currentMembersLoading ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    Loading members...
                  </div>
                ) : currentTeamMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                    No members in this team
                  </div>
                ) : (
                  <div className="border rounded-lg p-2 max-h-32 overflow-y-auto bg-background">
                    {currentTeamMembers.map((member) => {
                      return (
                        <div key={member.employeeId} className="flex items-center justify-between p-2 hover:bg-muted/25 rounded border-b last:border-b-0">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-medium text-sm">{member.employeeName}</span>
                              <span className="text-muted-foreground ml-2 text-xs">({member.employeeEmail})</span>
                            </div>
                            <Badge 
                              variant={member.role === 'manager' ? 'default' : 'outline'} 
                              className={`text-xs ${member.role === 'manager' ? 'bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white' : ''}`}
                            >
                              {member.role === 'manager' ? 'Team Manager' : 'Member'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Role toggle button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const newRole = member.role === 'manager' ? 'member' : 'manager';
                                try {
                                  const response = await apiRequest(`/api/admin/teams/${editingTeam.id}/members/${member.employeeId}/role`, 'PUT', { role: newRole });
                                  
                                  if (response.ok) {
                                    // Invalidate queries to refetch data
                                    queryClient.invalidateQueries({ queryKey: [`/api/admin/teams/${editingTeam.id}/members`] });
                                    queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
                                    toast({
                                      title: "Success",
                                      description: `${member.employeeName} is now a ${newRole === 'manager' ? 'team manager' : 'team member'}`,
                                    });
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: "Failed to update member role",
                                      variant: "destructive"
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to update member role",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-[rgb(248,153,59)]"
                              title={member.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
                            >
                              {member.role === 'manager' ? '↓' : '↑'}
                            </Button>
                            {/* Remove button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${member.employeeName} from the team?`)) {
                                  removeTeamMemberMutation.mutate({
                                    teamId: editingTeam.id,
                                    employeeId: member.employeeId
                                  });
                                }
                              }}
                              disabled={removeTeamMemberMutation.isPending}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              title="Remove from team"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Search and click to add members. Only users with employee profiles can be added to teams.</p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingTeam(null);
                  setMemberSearchQuery("");
                  setNewExpertiseArea("");
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
                    teamId: editingTeam.id,
                    teamData: {
                      name: editTeamName,
                      description: editTeamDescription,
                      expertiseAreas,
                      visibility: editTeamVisibility,
                      members: editSelectedMembers
                    }
                  });
                }}
                disabled={updateTeamMutation.isPending}
                className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
              >
                {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}