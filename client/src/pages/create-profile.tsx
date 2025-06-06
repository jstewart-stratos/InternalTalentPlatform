import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, Plus, User, Mail, Building, MapPin, Briefcase, Award, Target } from "lucide-react";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import SkillTaggingSystem from "@/components/skill-tagging-system";
import LinkedInSkillsImport from "@/components/linkedin-skills-import";
import ImageUpload from "@/components/image-upload";

const createProfileSchema = insertEmployeeSchema.extend({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  yearsExperience: z.number().min(0, "Years of experience must be positive"),
});

type CreateProfileForm = z.infer<typeof createProfileSchema>;

export default function CreateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch("/api/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      return response.json() as Promise<string[]>;
    },
  });

  // Check if current user has an existing employee profile
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees/current"],
    queryFn: async () => {
      const response = await fetch("/api/employees/current");
      if (!response.ok) {
        if (response.status === 404) return null; // No existing profile
        throw new Error("Failed to fetch current employee");
      }
      return response.json();
    },
  });

  const isEditing = !!currentEmployee;

  const form = useForm<CreateProfileForm>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      address: "",
      bio: "",
      skills: [],
      experienceLevel: "Mid-Level",
      yearsExperience: 0,
    },
    mode: "onChange",
  });

  // Update form values when user data or existing employee data loads
  useEffect(() => {
    if (currentEmployee) {
      // Load existing employee data for editing
      form.setValue("name", currentEmployee.name || "");
      form.setValue("email", currentEmployee.email || "");
      form.setValue("title", currentEmployee.title || "");
      form.setValue("address", currentEmployee.address || "");
      form.setValue("bio", currentEmployee.bio || "");
      form.setValue("skills", currentEmployee.skills || []);
      form.setValue("experienceLevel", currentEmployee.experienceLevel || "Mid-Level");
      form.setValue("yearsExperience", currentEmployee.yearsExperience || 0);
      form.setValue("profileImage", currentEmployee.profileImage || "");
    } else if (user) {
      // Load user auth data for new profile
      if (user.firstName && user.lastName) {
        form.setValue("name", `${user.firstName} ${user.lastName}`);
      }
      if (user.email) {
        form.setValue("email", user.email);
      }
    }
  }, [user, currentEmployee, form]);

  const createEmployee = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const url = isEditing ? `/api/employees/${currentEmployee.id}` : "/api/employees";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update profile" : "Failed to create profile");
      }
      return response.json();
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to profile page
      window.location.href = `/profile`;
    },
  });



  const onSubmit = (data: CreateProfileForm) => {
    createEmployee.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Edit Your Professional Profile" : "Create Your Professional Profile"}
          </h1>
          <p className="text-lg text-gray-600">
            {isEditing 
              ? "Update your expertise and professional information" 
              : "Join Stratos Skill Swap and showcase your expertise to colleagues"
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Picture Section */}
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          name={form.getValues("name") || "User"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Job Title
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Senior Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., New York, NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Years of Experience
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 5" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Experience Level
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Entry-Level">Entry-Level</SelectItem>
                            <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                            <SelectItem value="Senior-Level">Senior-Level</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Professional Bio
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell colleagues about your background, expertise, and what you're passionate about..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn Skills Import */}
                <LinkedInSkillsImport
                  onSkillsSelected={(selectedSkills) => {
                    const currentSkills = form.getValues("skills") || [];
                    const newSkills = [...currentSkills, ...selectedSkills];
                    form.setValue("skills", newSkills);
                  }}
                  currentSkills={form.watch("skills") || []}
                  className="mb-6"
                />

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Skills & Expertise
                      </FormLabel>
                      <FormControl>
                        <SkillTaggingSystem
                          selectedSkills={field.value}
                          onSkillsChange={field.onChange}
                          placeholder="Add skills with AI suggestions..."
                          maxSkills={20}
                          showAISuggestions={true}
                          context="profile"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = "/"}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployee.isPending}
                    className="min-w-[120px]"
                  >
                    {createEmployee.isPending 
                      ? (isEditing ? "Updating..." : "Creating...") 
                      : (isEditing ? "Update Profile" : "Create Profile")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}