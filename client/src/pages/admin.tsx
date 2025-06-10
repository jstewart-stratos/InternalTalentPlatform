import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Activity, Settings, Shield, Lock, Unlock, UserCheck, Clock, AlertTriangle, Plus, Save, Trash2, Building } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, SiteSetting, AuditLog, Department } from "@shared/schema";

export default function Admin() {
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingDescription, setNewSettingDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [editingValue, setEditingValue] = useState("");
  
  // Department management state
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState("");
  const [editingDepartmentDescription, setEditingDepartmentDescription] = useState("");

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

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/admin/departments']
  });

  // Admin mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role });
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
      return await apiRequest('PUT', `/api/admin/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User deactivated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate user", variant: "destructive" });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('PUT', `/api/admin/users/${userId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User activated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate user", variant: "destructive" });
    }
  });

  const createSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string; category: string }) => {
      return await apiRequest("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setNewSettingKey("");
      setNewSettingValue("");
      setNewSettingDescription("");
      toast({ title: "Success", description: "Setting created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create setting", variant: "destructive" });
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest(`/api/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setEditingSetting(null);
      setEditingValue("");
      toast({ title: "Success", description: "Setting updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    }
  });

  // Department management mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return await apiRequest('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/departments'] });
      setNewDepartmentName('');
      setNewDepartmentDescription('');
      toast({ title: "Success", description: "Department created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" });
    }
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description?: string }) => {
      return await apiRequest(`/api/admin/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/departments'] });
      setEditingDepartment(null);
      setEditingDepartmentName('');
      setEditingDepartmentDescription('');
      toast({ title: "Success", description: "Department updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update department", variant: "destructive" });
    }
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/departments/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/departments'] });
      toast({ title: "Success", description: "Department deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" });
    }
  });

  const toggleDepartmentStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/admin/departments/${id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/departments'] });
      toast({ title: "Success", description: "Department status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update department status", variant: "destructive" });
    }
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleUserToggle = (userId: string, isActive: boolean) => {
    if (isActive) {
      deactivateUserMutation.mutate(userId);
    } else {
      activateUserMutation.mutate(userId);
    }
  };

  const handleCreateSetting = () => {
    if (!newSettingKey || !newSettingValue) {
      toast({ title: "Error", description: "Key and value are required", variant: "destructive" });
      return;
    }
    
    createSettingMutation.mutate({
      key: newSettingKey,
      value: newSettingValue,
      description: newSettingDescription,
      category: selectedCategory
    });
  };

  const handleUpdateSetting = (setting: SiteSetting) => {
    updateSettingMutation.mutate({ key: setting.key, value: editingValue });
  };

  // Department management handlers
  const handleCreateDepartment = () => {
    if (!newDepartmentName) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }
    
    createDepartmentMutation.mutate({
      name: newDepartmentName,
      description: newDepartmentDescription
    });
  };

  const handleUpdateDepartment = (department: Department) => {
    updateDepartmentMutation.mutate({
      id: department.id,
      name: editingDepartmentName,
      description: editingDepartmentDescription
    });
  };

  const handleDeleteDepartment = (id: number) => {
    deleteDepartmentMutation.mutate(id);
  };

  const handleToggleDepartmentStatus = (id: number, isActive: boolean) => {
    toggleDepartmentStatusMutation.mutate({ id, isActive: !isActive });
  };

  const startEditingDepartment = (department: Department) => {
    setEditingDepartment(department);
    setEditingDepartmentName(department.name);
    setEditingDepartmentDescription(department.description || '');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('deactivated') || action.includes('revoked')) return 'destructive';
    if (action.includes('created') || action.includes('granted')) return 'default';
    return 'secondary';
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Manage users, site settings, and monitor system activity</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">User Management</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm">
            <Building className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Departments</span>
            <span className="sm:hidden">Depts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Site Settings</span>
            <span className="sm:hidden">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Audit Logs</span>
            <span className="sm:hidden">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Users from Employees */}
              <div className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-blue-50">
                <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Sync User Accounts</h3>
                <p className="text-xs sm:text-sm text-blue-700">Create user accounts for all employees who don't have user accounts yet. This will populate the user management system with all current employees.</p>
                <Button 
                  onClick={() => {
                    apiRequest('POST', '/api/seed-users').then(() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
                      toast({ title: "Success", description: "User accounts synced successfully" });
                    }).catch(() => {
                      toast({ title: "Error", description: "Failed to sync user accounts", variant: "destructive" });
                    });
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-3 py-2"
                  size="sm"
                >
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sync Users from Employees</span>
                  <span className="sm:hidden">Sync Users</span>
                </Button>
              </div>

              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Role</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Last Login</TableHead>
                        <TableHead className="min-w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="min-w-[200px]">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User'}</div>
                                <div className="text-xs text-gray-500 truncate">{user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            <span className="truncate block">{user.email || 'No email'}</span>
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            >
                              <SelectTrigger className="w-full min-w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            <Badge variant={user.isActive ? "default" : "destructive"} className="whitespace-nowrap">
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            <Button
                              size="sm"
                              variant={user.isActive ? "destructive" : "default"}
                              onClick={() => handleUserToggle(user.id, user.isActive)}
                              className="whitespace-nowrap"
                            >
                              {user.isActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              <span className="ml-1">{user.isActive ? "Deactivate" : "Activate"}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Management Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>
                Create and manage organizational departments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Department */}
              <div className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-sm sm:text-base">Add New Department</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="departmentName" className="text-xs sm:text-sm">Department Name</Label>
                    <Input
                      id="departmentName"
                      placeholder="Enter department name"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="departmentDescription" className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      id="departmentDescription"
                      placeholder="Enter department description"
                      value={newDepartmentDescription}
                      onChange={(e) => setNewDepartmentDescription(e.target.value)}
                      className="text-sm h-9 resize-none"
                      rows={1}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateDepartment}
                  disabled={createDepartmentMutation.isPending}
                  className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
                  size="sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                </Button>
              </div>

              {/* Departments List */}
              {departmentsLoading ? (
                <div className="text-center py-8">Loading departments...</div>
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
                    {(departments as Department[]).map((department) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">
                          {editingDepartment?.id === department.id ? (
                            <Input
                              value={editingDepartmentName}
                              onChange={(e) => setEditingDepartmentName(e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            department.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingDepartment?.id === department.id ? (
                            <Textarea
                              value={editingDepartmentDescription}
                              onChange={(e) => setEditingDepartmentDescription(e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            department.description || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={department.isActive ? "default" : "destructive"}>
                            {department.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(department.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {editingDepartment?.id === department.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateDepartment(department)}
                                  disabled={updateDepartmentMutation.isPending}
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingDepartment(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingDepartment(department)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant={department.isActive ? "destructive" : "default"}
                                  onClick={() => handleToggleDepartmentStatus(department.id, department.isActive)}
                                >
                                  {department.isActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                  {department.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{department.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteDepartment(department.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Configure platform settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Users from Employees */}
              <div className="border rounded-lg p-4 space-y-4 mb-6">
                <h3 className="font-semibold">Sync User Accounts</h3>
                <p className="text-sm text-gray-600">Create user accounts for all employees who don't have accounts yet.</p>
                <Button 
                  onClick={() => {
                    apiRequest('/api/seed-users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
                      toast({ title: "Success", description: "User accounts synced successfully" });
                    }).catch(() => {
                      toast({ title: "Error", description: "Failed to sync user accounts", variant: "destructive" });
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Sync Users from Employees
                </Button>
              </div>

              {/* Add New Setting */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add New Setting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="settingKey">Key</Label>
                    <Input
                      id="settingKey"
                      value={newSettingKey}
                      onChange={(e) => setNewSettingKey(e.target.value)}
                      placeholder="setting_key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="settingValue">Value</Label>
                    <Input
                      id="settingValue"
                      value={newSettingValue}
                      onChange={(e) => setNewSettingValue(e.target.value)}
                      placeholder="setting value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="settingCategory">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="notifications">Notifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="settingDescription">Description</Label>
                    <Input
                      id="settingDescription"
                      value={newSettingDescription}
                      onChange={(e) => setNewSettingDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSetting} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Setting
                </Button>
              </div>

              {/* Existing Settings */}
              {settingsLoading ? (
                <div className="text-center py-8">Loading settings...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteSettings.map((setting: SiteSetting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                        <TableCell>
                          {editingSetting?.id === setting.id ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-32"
                            />
                          ) : (
                            <span className="max-w-32 truncate block">{setting.value}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{setting.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {setting.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {setting.updatedBy || 'System'}
                        </TableCell>
                        <TableCell>
                          {editingSetting?.id === setting.id ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateSetting(setting)}
                                className="flex items-center gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSetting(null);
                                  setEditingValue("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSetting(setting);
                                setEditingValue(setting.value);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                Track administrative actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading audit logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: AuditLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{new Date(log.createdAt!).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.userId}</TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.targetType}</div>
                            {log.targetId && (
                              <div className="text-gray-500 font-mono text-xs">{log.targetId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.changes && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600">View Changes</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.filter((u: User) => u.isActive).length} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Site Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{siteSettings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Configuration entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditLogs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total audit entries
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['admin', 'user'].map(role => {
                  const count = users.filter((u: User) => u.role === role).length;
                  const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  
                  return (
                    <div key={role} className="flex items-center space-x-4">
                      <Badge variant={getRoleBadgeVariant(role)} className="w-20 justify-center">
                        {role}
                      </Badge>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}