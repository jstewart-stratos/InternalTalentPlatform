import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, MessageCircle, Phone, Users, Award, Clock, MapPin } from "lucide-react";
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
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");
  const [experienceFilter, setExperienceFilter] = useState<string>("");

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["/api/experts", searchTerm, selectedSkill, availabilityFilter, experienceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedSkill && selectedSkill !== "all") params.append("skill", selectedSkill);
      if (availabilityFilter && availabilityFilter !== "all") params.append("availability", availabilityFilter);
      if (experienceFilter && experienceFilter !== "all") params.append("experience", experienceFilter);
      
      const response = await fetch(`/api/experts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch experts");
      return response.json() as Promise<ExpertProfile[]>;
    },
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
    queryFn: async () => {
      const response = await fetch("/api/skills/all");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<string[]>;
    },
  });

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case "email": return <Mail className="h-4 w-4" />;
      case "slack": return <MessageCircle className="h-4 w-4" />;
      case "teams": return <MessageCircle className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
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

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
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
      {experts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No experts found</h3>
          <p className="text-gray-600">Try adjusting your search criteria to find relevant experts.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Found {experts.length} expert{experts.length !== 1 ? 's' : ''}
            </p>
          </div>

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
                        <Badge className={getAvailabilityColor(expert.availabilityStatus || "available")}>
                          {expert.availabilityStatus || "available"}
                        </Badge>
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

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      {getContactIcon(expert.preferredContactMethod || "email")}
                      <span className="ml-2">Contact</span>
                    </Button>
                    {expert.maxMentees && expert.maxMentees > 0 && (
                      <Button size="sm" variant="outline">
                        Request Mentorship
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}