import { useState } from "react";
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

const createProfileSchema = insertEmployeeSchema.extend({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  yearsExperience: z.number().min(0, "Years of experience must be positive"),
});

type CreateProfileForm = z.infer<typeof createProfileSchema>;

export default function CreateProfile() {
  const [newSkill, setNewSkill] = useState("");
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch("/api/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      return response.json() as Promise<string[]>;
    },
  });

  const form = useForm<CreateProfileForm>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      department: "",
      bio: "",
      skills: [],
      experienceLevel: "Mid-Level",
      availability: "Available",
      yearsExperience: 0,
    },
    mode: "onChange",
  });

  const createEmployee = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create employee");
      }
      return response.json();
    },
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      // Store user ID for session management
      localStorage.setItem('currentUserId', newEmployee.id.toString());
      // Redirect to the new profile
      window.location.href = `/profile/${newEmployee.id}`;
    },
  });

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !form.getValues("skills").includes(skill)) {
      const currentSkills = form.getValues("skills");
      form.setValue("skills", [...currentSkills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = (data: CreateProfileForm) => {
    createEmployee.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Professional Profile</h1>
          <p className="text-lg text-gray-600">
            Join Stratos Skill Swap and showcase your expertise to colleagues
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
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Department
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                <div className="space-y-4">
                  <FormLabel className="flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Skills & Expertise
                  </FormLabel>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., React, Project Management)"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {form.watch("skills").map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-sm">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  {form.formState.errors.skills && (
                    <p className="text-sm text-red-600">{form.formState.errors.skills.message}</p>
                  )}
                </div>

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
                    {createEmployee.isPending ? "Creating..." : "Create Profile"}
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