import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Mail, MapPin, Calendar, Award, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Employee } from "@shared/schema";

export default function Profile() {
  const [, params] = useRoute("/profile/:id?");
  const employeeId = params?.id ? parseInt(params.id) : 1; // Default to first employee

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employees", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch employee");
      return response.json() as Promise<Employee>;
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "text-green-600";
      case "busy":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="mb-8">
        <CardContent className="pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
              <AvatarFallback className="text-xl">
                {employee.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</h1>
                  <p className="text-xl text-gray-600 mb-2">{employee.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {employee.department}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {employee.yearsExperience} years experience
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Availability:</span>
                <span className={`text-sm font-medium ${getAvailabilityColor(employee.availability)}`}>
                  {employee.availabilityMessage}
                </span>
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill) => (
                  <Badge
                    key={skill}
                    className={`text-sm ${getSkillColor(skill)}`}
                    variant="secondary"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{employee.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{employee.department} Department</span>
                </div>
              </div>
            </div>
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
