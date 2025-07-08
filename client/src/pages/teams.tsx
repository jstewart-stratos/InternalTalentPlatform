import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Star, Building, Globe, Settings, Crown } from "lucide-react";
import { Link } from "wouter";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  specialties: z.array(z.string()).default([]),
});

type CreateTeamData = z.infer<typeof createTeamSchema>;

interface Team {
  id: number;
  name: string;
  description?: string;
  profileImage?: string;
  website?: string;
  specialties: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  services?: any[];
  serviceCategories?: any[];
}

interface TeamMember {
  id: number;
  teamId: number;
  employeeId: number;
  role: string;
  joinedAt: string;
  isActive: boolean;
  approvedBy?: number;
  approvedAt?: string;
}

export default function Teams() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState("");

  const form = useForm<CreateTeamData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      specialties: [],
    },
  });

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });

  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees/current"],
    enabled: isAuthenticated,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamData) => {
      return await apiRequest("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });



  const handleAddSpecialty = () => {
    if (specialtyInput.trim()) {
      const currentSpecialties = form.getValues("specialties");
      if (!currentSpecialties.includes(specialtyInput.trim())) {
        form.setValue("specialties", [...currentSpecialties, specialtyInput.trim()]);
      }
      setSpecialtyInput("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    const currentSpecialties = form.getValues("specialties");
    form.setValue("specialties", currentSpecialties.filter(s => s !== specialty));
  };

  const onSubmit = (data: CreateTeamData) => {
    createTeamMutation.mutate(data);
  };

  const isUserMemberOfTeam = (team: Team) => {
    if (!currentEmployee || !team.members) return false;
    return team.members.some(member => 
      member.employeeId === currentEmployee.id && member.isActive
    );
  };

  const getUserRoleInTeam = (team: Team) => {
    if (!currentEmployee || !team.members) return null;
    const membership = team.members.find(member => 
      member.employeeId === currentEmployee.id && member.isActive
    );
    return membership?.role || null;
  };

  const isAdmin = user?.role === "admin";
  const canCreateTeam = isAdmin;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Collaborate with colleagues in specialized business teams
          </p>
        </div>
        {canCreateTeam && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new team to collaborate on business services and projects.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Risk Management Solutions" {...field} />
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
                            placeholder="Describe your team's focus and expertise..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://team-website.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Specialties</FormLabel>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add specialty"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSpecialty())}
                      />
                      <Button type="button" onClick={handleAddSpecialty}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.watch("specialties").map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer"
                               onClick={() => handleRemoveSpecialty(specialty)}>
                          {specialty} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={createTeamMutation.isPending}>
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team: Team) => {
          const userRole = getUserRoleInTeam(team);
          
          return (
            <Card key={team.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.profileImage} />
                      <AvatarFallback>
                        <Building className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{team.members?.filter(m => m.isActive).length || 0} members</span>
                        {userRole === 'leader' && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Leader
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {team.description && (
                  <CardDescription className="text-sm">
                    {team.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {team.specialties && team.specialties.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Specialties</div>
                    <div className="flex flex-wrap gap-1">
                      {team.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {team.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{team.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {team.website && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <a href={team.website} target="_blank" rel="noopener noreferrer" 
                       className="hover:text-primary">
                      Visit Website
                    </a>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <Link href={`/teams/${team.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  

                  
                  {(userRole === 'leader' || isAdmin) && (
                    <Link href={`/teams/${team.id}/manage`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">
              Teams help organize colleagues around specialized business services and expertise.
            </p>
            {canCreateTeam && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}