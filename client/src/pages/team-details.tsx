import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Building, 
  Calendar,
  Mail,
  UserPlus,
  ArrowLeft,
  Star,
  DollarSign,
  Clock,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TeamDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch team details
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: [`/api/teams/${id}`],
    enabled: !!id,
  });
  
  // Fetch team members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/teams/${id}/members`],
    enabled: !!id,
  });
  
  // Fetch team services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/professional-services?teamId=${id}`],
    enabled: !!id,
  });
  
  // Join team mutation
  const joinTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      await apiRequest(`/api/teams/${teamId}/join`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${id}/members`] });
      toast({
        title: "Success",
        description: "Successfully joined the team!",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  if (teamLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (!team) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The team you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/teams">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isUserMember = members?.some((member: any) => member.employeeId === user?.employeeId);
  const teamLeader = members?.find((member: any) => member.role === 'manager');
  
  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">{team.description}</p>
          </div>
        </div>
        
        {!isUserMember && (
          <Button 
            onClick={() => joinTeamMutation.mutate(parseInt(id!))}
            disabled={joinTeamMutation.isPending}
            className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
          </Button>
        )}
      </div>
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Members
              </div>
              <div className="text-2xl font-bold">{members?.length || 0}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Services
              </div>
              <div className="text-2xl font-bold">{services?.length || 0}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <div className="text-sm">
                {new Date(team.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Expertise Areas */}
          {team.expertiseAreas && team.expertiseAreas.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Expertise Areas</h4>
              <div className="flex flex-wrap gap-2">
                {team.expertiseAreas.map((area: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>
        
        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Current team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profileImage} />
                          <AvatarFallback>
                            {member.employeeName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.employeeName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.employeeEmail}
                          </div>
                          {member.employeeTitle && (
                            <div className="text-sm text-muted-foreground">
                              {member.employeeTitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                          {member.role === 'manager' ? 'Team Manager' : 'Member'}
                        </Badge>
                        {member.role === 'manager' && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No members found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Services</CardTitle>
              <CardDescription>
                Professional services offered by this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : services && services.length > 0 ? (
                <div className="grid gap-4">
                  {services.map((service: any) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{service.title}</h3>
                          <p className="text-sm text-muted-foreground">{service.shortDescription}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {service.pricingType === 'hourly' && service.hourlyRate && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${(service.hourlyRate / 100).toFixed(0)}/hr
                            </Badge>
                          )}
                          {service.pricingType === 'fixed' && service.fixedPrice && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${(service.fixedPrice / 100).toFixed(0)}
                            </Badge>
                          )}
                          {service.duration && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration}min
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3">{service.description}</p>
                      
                      {service.skills && service.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {service.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          size="sm"
                          onClick={() => setLocation(`/services/${service.id}`)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >Service Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No services offered yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Skills</CardTitle>
              <CardDescription>
                Collective skills available within this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Collect all unique skills from members */}
                  {(() => {
                    const allSkills = new Set();
                    members?.forEach((member: any) => {
                      if (member.employeeSkills) {
                        member.employeeSkills.forEach((skill: string) => allSkills.add(skill));
                      }
                    });
                    const uniqueSkills = Array.from(allSkills);
                    
                    return uniqueSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {uniqueSkills.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No skills data available
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}