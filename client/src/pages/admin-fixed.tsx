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
import { toast } from "@/hooks/use-toast";
import { Users, Activity, Settings, Shield, Lock, Unlock, UserCheck, Clock, AlertTriangle, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, SiteSetting, AuditLog, ServiceCategory } from "@shared/schema";

export default function Admin() {
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingDescription, setNewSettingDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [editingValue, setEditingValue] = useState("");
  
  // Service category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryDescription, setEditingCategoryDescription] = useState("");

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
    onError: (error) => {
      console.error("Deactivation error:", error);
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
    onError: (error) => {
      console.error("Activation error:", error);
      toast({ title: "Error", description: "Failed to activate user", variant: "destructive" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; description: string }) => {
      return await apiRequest('POST', '/api/admin/service-categories', categoryData);
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="service-categories" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Service Categories</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
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
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
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
    </div>
  );
}