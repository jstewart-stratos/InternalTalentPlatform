import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Mail, MapPin, Calendar, Award, Edit, ThumbsUp, Users, Plus, Settings, Building, Briefcase, Star, DollarSign, ChevronDown, ChevronUp, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileAvatar from "@/components/profile-avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import ContactDialog from "@/components/contact-dialog";
import SkillsWithLevels from "@/components/skills-with-levels";
import type { Employee, SkillEndorsement } from "@shared/schema";

export default function Profile() {
  const [, params] = useRoute("/profile/:id?");
  const [, setLocation] = useLocation();
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [servicesViewMode, setServicesViewMode] = useState<'grid' | 'list'>('grid');
  
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

  const { data: userServices = [] } = useQuery({
    queryKey: ["/api/professional-services/by-provider", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/professional-services?providerId=${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch user services");
      return response.json();
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
                      <Calendar className="h-4 w-4 mr-1" />
                      {employee.yearsExperience} years experience
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{employee.address || "No address provided"}</span>
                    </div>
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

          <div>
            <SkillsWithLevels
              employeeId={employeeId}
              isOwnProfile={isOwnProfile}
              isEditing={isEditingSkills}
              onEditToggle={() => setIsEditingSkills(!isEditingSkills)}
            />
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

      {/* Services Section */}
      {userServices.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Professional Services
                <Badge variant="secondary" className="ml-2">
                  {userServices.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-md">
                  <Button
                    variant={servicesViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setServicesViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={servicesViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setServicesViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {servicesViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllServices ? userServices : userServices.slice(0, 4)).map((service: any) => (
                  <Card key={service.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-base line-clamp-1 flex-1">{service.title}</h3>
                        {service.averageRating && (
                          <div className="flex items-center ml-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-xs">{(service.averageRating / 100).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {service.shortDescription || service.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-orange-600 text-sm">
                          {service.pricingType === 'hourly' && service.hourlyRate && 
                            `$${(service.hourlyRate / 100).toFixed(0)}/hr`}
                          {service.pricingType === 'fixed' && service.fixedPrice && 
                            `$${(service.fixedPrice / 100).toFixed(0)}`}
                          {service.pricingType === 'consultation' && service.consultationRate && 
                            `$${(service.consultationRate / 100).toFixed(0)}/consultation`}
                          {service.pricingType === 'package' && 'Package'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {service.bookingCount || 0} bookings
                        </span>
                      </div>
                      
                      {service.offeredSkills && service.offeredSkills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {service.offeredSkills.slice(0, 2).map((skill: string) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {service.offeredSkills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{service.offeredSkills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLocation(`/services/${service.id}`)}
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllServices ? userServices : userServices.slice(0, 6)).map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{service.title}</h3>
                        {service.averageRating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-xs">{(service.averageRating / 100).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{service.shortDescription || service.description}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="font-medium text-orange-600 text-sm">
                          {service.pricingType === 'hourly' && service.hourlyRate && 
                            `$${(service.hourlyRate / 100).toFixed(0)}/hr`}
                          {service.pricingType === 'fixed' && service.fixedPrice && 
                            `$${(service.fixedPrice / 100).toFixed(0)}`}
                          {service.pricingType === 'consultation' && service.consultationRate && 
                            `$${(service.consultationRate / 100).toFixed(0)}/consultation`}
                          {service.pricingType === 'package' && 'Package'}
                        </div>
                        <div className="text-xs text-gray-500">{service.bookingCount || 0} bookings</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLocation(`/services/${service.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {userServices.length > (servicesViewMode === 'grid' ? 4 : 6) && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="text-sm"
                >
                  {showAllServices ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show All {userServices.length} Services
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
