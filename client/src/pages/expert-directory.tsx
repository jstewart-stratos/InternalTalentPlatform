import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, MessageCircle, Phone, Users, Award, Clock, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import ProfileAvatar from "@/components/profile-avatar";
import type { Employee } from "@shared/schema";

interface ExpertProfile extends Employee {
  totalEndorsements?: number;
  menteeCount?: number;
  responseTime?: string;
}

export default function ExpertDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [experienceFilter, setExperienceFilter] = useState<string>("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle URL parameters on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const skillParam = urlParams.get('skill');
    const searchParam = urlParams.get('search');
    const experienceParam = urlParams.get('experience');
    
    if (skillParam) setSelectedSkill(skillParam);
    if (searchParam) setSearchTerm(searchParam);
    if (experienceParam) setExperienceFilter(experienceParam);
  }, []);

  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ["search-experts-and-teams-v3", searchTerm, selectedSkill, experienceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedSkill && selectedSkill !== "all") params.append("skill", selectedSkill);
      if (experienceFilter && experienceFilter !== "all") params.append("experience", experienceFilter);
      
      console.log('🔍 Fetching experts and teams with params:', params.toString());
      const response = await fetch(`/api/search-experts-and-teams?${params}`);
      if (!response.ok) throw new Error("Failed to fetch experts and teams");
      const data = await response.json();
      console.log('✅ Received search results:', data.length, 'items');
      console.log('🔍 Data types:', data.map((item: any) => item.type));
      return data;
    },
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (v5 syntax)
  });

  // Separate experts and teams for display - handle both new and legacy API responses
  const experts = searchResults.filter((item: any) => {
    // New API format has explicit type field
    if (item.type === 'individual') return true;
    // Legacy API format - items without type or with employee-like fields are individuals
    if (!item.type && (item.userId || item.email || item.experienceLevel)) return true;
    return false;
  });
  
  const teams = searchResults.filter((item: any) => {
    // New API format has explicit type field
    if (item.type === 'team') return true;
    // Legacy API format - items with memberCount but no userId are teams
    if (!item.type && item.memberCount !== undefined && !item.userId) return true;
    return false;
  });
  
  console.log('🔍 Filtered results:', { experts: experts.length, teams: teams.length });

  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<string[]>;
    },
  });

  const getContactIcon = (method: string) => {
    switch (method) {
      case "email": return <Mail className="h-4 w-4" />;
      case "slack": return <MessageCircle className="h-4 w-4" />;
      case "teams": return <MessageCircle className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const handleContact = (expert: ExpertProfile) => {
    const method = expert.preferredContactMethod || "email";
    
    switch (method) {
      case "email":
        if (expert.email) {
          window.location.href = `mailto:${expert.email}?subject=Expert Consultation Request&body=Hi ${expert.name},%0D%0A%0D%0AI would like to request your expertise regarding...`;
        } else {
          toast({
            title: "Contact Information Not Available",
            description: "Email address not found for this expert.",
            variant: "destructive",
          });
        }
        break;
      case "phone":
        if (expert.phone) {
          window.location.href = `tel:${expert.phone}`;
        } else {
          toast({
            title: "Contact Information Not Available", 
            description: "Phone number not found for this expert.",
            variant: "destructive",
          });
        }
        break;
      case "slack":
      case "teams":
        toast({
          title: "Contact Expert",
          description: `Please reach out to ${expert.name} via ${method.charAt(0).toUpperCase() + method.slice(1)}.`,
        });
        break;
      default:
        if (expert.email) {
          window.location.href = `mailto:${expert.email}?subject=Expert Consultation Request&body=Hi ${expert.name},%0D%0A%0D%0AI would like to request your expertise regarding...`;
        } else {
          toast({
            title: "Contact Information Not Available",
            description: "No contact method available for this expert.",
            variant: "destructive",
          });
        }
    }
  };

  const handleMentorshipRequest = (expert: ExpertProfile) => {
    if (expert.email) {
      window.location.href = `mailto:${expert.email}?subject=Mentorship Request&body=Hi ${expert.name},%0D%0A%0D%0AI am interested in your mentorship program and would like to discuss...`;
    } else {
      toast({
        title: "Mentorship Request",
        description: `Please contact ${expert.name} directly to request mentorship.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expert directory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Directory</h1>
        <p className="text-gray-600">Find subject matter experts across the organization for mentorship, collaboration, and knowledge sharing.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Junior">Junior</SelectItem>
              <SelectItem value="Mid-Level">Mid-Level</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading experts</h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No experts or teams found</h3>
          <p className="text-gray-600">Try adjusting your search criteria to find relevant experts and teams.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Found {experts.length} expert{experts.length !== 1 ? 's' : ''} and {teams.length} team{teams.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Teams Section */}
          {teams.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Teams ({teams.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {teams.map((team: any) => (
                  <Card key={`team-${team.id}`} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {team.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mb-2">Team • {team.memberCount} members</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              Team
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {team.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Team Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {team.skills?.slice(0, 4).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {team.skills?.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{team.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {team.memberCount} members
                          </div>
                          {team.serviceCount > 0 && (
                            <div className="flex items-center">
                              <Badge variant="outline" className="text-xs">
                                {team.serviceCount} services
                              </Badge>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/teams/${team.id}`)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          View Team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Individual Experts Section */}
          {experts.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Individual Experts ({experts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <ProfileAvatar
                      src={expert.profileImage}
                      name={expert.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {expert.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-2">{expert.title}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {expert.experienceLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {expert.address && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-2" />
                      {expert.address}
                    </div>
                  )}

                  {expert.bio && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {expert.bio}
                    </p>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-1">
                      {expert.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {expert.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {expert.totalEndorsements !== undefined && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2" />
                        {expert.totalEndorsements} endorsements
                      </div>
                    )}
                    
                    {expert.menteeCount !== undefined && expert.menteeCount > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Mentoring {expert.menteeCount} people
                      </div>
                    )}

                    {expert.responseTime && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Typically responds in {expert.responseTime}
                      </div>
                    )}
                  </div>

                  {/* Action buttons section */}
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setLocation(`/profile/${expert.id}`)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}