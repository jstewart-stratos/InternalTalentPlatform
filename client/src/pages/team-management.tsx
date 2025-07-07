import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Users, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";

export default function TeamManagement() {
  console.log("=== TeamManagement page loaded ===");
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamExpertiseAreas, setEditTeamExpertiseAreas] = useState("");
  const [newExpertiseArea, setNewExpertiseArea] = useState("");

  // Fetch teams managed by current user
  console.log("=== About to fetch managed teams from /api/team-manager/my-teams ===");
  const { data: managedTeams, isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ["/api/team-manager/my-teams", Date.now()], // Add timestamp to force fresh queries
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch team members for selected team
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"],
    enabled: !!selectedTeam,
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, teamData }: any) => {
      const response = await apiRequest("PUT", `/api/team-manager/teams/${teamId}`, teamData);
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
      const response = await apiRequest("PUT", `/api/team-manager/teams/${teamId}/members/${employeeId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-manager/teams", selectedTeam?.id, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId }: any) => {
      const response = await apiRequest("DELETE", `/api/team-manager/teams/${teamId}/members/${employeeId}`);
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
        visibility: selectedTeam.visibility || 'public'
      }
    });
  };

  const handleRoleToggle = (member: any) => {
    const newRole = member.role === 'manager' ? 'member' : 'manager';
    updateMemberRoleMutation.mutate({
      teamId: selectedTeam.id,
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
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">{team.memberCount} members</p>
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
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedTeam.name}</CardTitle>
                          <p className="text-muted-foreground mt-1">{selectedTeam.description}</p>
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
                        <Badge variant="secondary">
                          {teamMembers?.length || 0} members
                        </Badge>
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
                                  title={member.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
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
    </div>
  );
}