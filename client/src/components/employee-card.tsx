import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import ProfileAvatar from "@/components/profile-avatar";
import type { Employee } from "@shared/schema";

interface EmployeeCardProps {
  employee: Employee;
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
      return "bg-green-400";
    case "busy":
      return "bg-yellow-400";
    default:
      return "bg-red-400";
  }
};

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const displayedSkills = employee.skills.slice(0, 3);
  const remainingSkills = employee.skills.length - 3;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <ProfileAvatar
            src={employee.profileImage}
            name={employee.name}
            size="lg"
            className="mr-4"
          />
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{employee.name}</h4>
            <p className="text-secondary text-sm">{employee.title}</p>
            <p className="text-secondary text-xs">
              {employee.department} • {employee.yearsExperience} years exp
            </p>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {displayedSkills.map((skill) => (
              <Badge
                key={skill}
                className={`text-xs ${getSkillColor(skill)}`}
                variant="secondary"
              >
                {skill}
              </Badge>
            ))}
            {remainingSkills > 0 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                +{remainingSkills} more
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{employee.bio}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${getAvailabilityColor(employee.availability)}`}></div>
            <span className="text-xs text-gray-500">{employee.availabilityMessage}</span>
          </div>
          <Link
            href={`/profile/${employee.id}`}
            className="text-primary hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View Profile <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
