import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Star, DollarSign, Clock, MapPin, Users } from "lucide-react";

const serviceFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  categoryId: z.number().min(1, "Please select a category"),
  pricingType: z.enum(["hourly", "fixed", "consultation", "package"]),
  hourlyRate: z.number().optional(),
  fixedPrice: z.number().optional(),
  consultationRate: z.number().optional(),
  deliveryTimeframe: z.string().min(1, "Please specify delivery timeframe"),
  isRemote: z.boolean().default(true),
  isOnsite: z.boolean().default(false),
  maxClientsPerMonth: z.number().optional(),
  offeredSkills: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: myServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/my-services"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["/api/skills/all"],
  });

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await apiRequest("/api/service-categories", "POST", {
        name: categoryName,
        description: `${categoryName} services`
      });
      return response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      form.setValue("categoryId", newCategory.id);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      toast({
        title: "Success",
        description: "New category created and selected",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive"
      });
    }
  });

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      categoryId: 0,
      pricingType: "hourly",
      deliveryTimeframe: "",
      isRemote: true,
      isOnsite: false,
      offeredSkills: [],
      requiredSkills: [],
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await fetch("/api/professional-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Convert pricing to cents
          hourlyRate: data.hourlyRate ? Math.round(data.hourlyRate * 100) : undefined,
          fixedPrice: data.fixedPrice ? Math.round(data.fixedPrice * 100) : undefined,
          consultationRate: data.consultationRate ? Math.round(data.consultationRate * 100) : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create service");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-services"] });
      handleDialogClose();
      toast({
        title: "Success",
        description: "Professional service created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      const response = await fetch(`/api/professional-services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Convert pricing to cents
          hourlyRate: data.hourlyRate ? Math.round(data.hourlyRate * 100) : undefined,
          fixedPrice: data.fixedPrice ? Math.round(data.fixedPrice * 100) : undefined,
          consultationRate: data.consultationRate ? Math.round(data.consultationRate * 100) : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-services"] });
      setEditingService(null);
      toast({
        title: "Success",
        description: "Professional service updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/professional-services/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete service");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-services"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getPriceDisplay = (service: any) => {
    switch (service.pricingType) {
      case "hourly":
        return service.hourlyRate ? `${formatPrice(service.hourlyRate)}/hour` : "Rate not set";
      case "fixed":
        return service.fixedPrice ? formatPrice(service.fixedPrice) : "Price not set";
      case "consultation":
        return service.consultationRate ? `${formatPrice(service.consultationRate)}/consultation` : "Rate not set";
      case "package":
        return "Package pricing";
      default:
        return "Pricing not set";
    }
  };

  const resetCategoryDialog = () => {
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingService(null);
    form.reset();
    resetCategoryDialog();
  };

  const handleCreateNew = () => {
    setEditingService(null);
    resetCategoryDialog();
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    resetCategoryDialog();
    form.reset({
      title: service.title,
      shortDescription: service.shortDescription || "",
      description: service.description,
      categoryId: service.categoryId,
      pricingType: service.pricingType,
      hourlyRate: service.hourlyRate ? service.hourlyRate / 100 : undefined,
      fixedPrice: service.fixedPrice ? service.fixedPrice / 100 : undefined,
      consultationRate: service.consultationRate ? service.consultationRate / 100 : undefined,
      deliveryTimeframe: service.deliveryTimeframe || "",
      isRemote: service.isRemote,
      isOnsite: service.isOnsite,
      maxClientsPerMonth: service.maxClientsPerMonth || undefined,
      offeredSkills: service.offeredSkills || [],
      requiredSkills: service.requiredSkills || [],
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Professional Services
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your professional service offerings and pricing
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            if (!open) handleDialogClose();
            else setIsCreateDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Edit Professional Service" : "Create Professional Service"}
                </DialogTitle>
                <DialogDescription>
                  {editingService ? "Update your service details and pricing" : "Add a new professional service offering"}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Financial Risk Assessment Consultation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Category *</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                            className="whitespace-nowrap"
                          >
                            {showNewCategoryInput ? "Cancel" : "Request New"}
                          </Button>
                        </div>
                        {showNewCategoryInput && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Enter new category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleCreateNewCategory}
                              disabled={createCategoryMutation.isPending}
                              className="bg-[rgb(248,153,59)] hover:bg-[rgb(228,133,39)] text-white"
                            >
                              {createCategoryMutation.isPending ? "Creating..." : "Create"}
                            </Button>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief overview of your service (shown in service cards)"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Comprehensive description of your service, methodology, and what clients can expect"
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pricingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing Model</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pricing model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly Rate</SelectItem>
                            <SelectItem value="fixed">Fixed Project Price</SelectItem>
                            <SelectItem value="consultation">Consultation Fee</SelectItem>
                            <SelectItem value="package">Package Deal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("pricingType") === "hourly" && (
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="e.g., 150.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("pricingType") === "fixed" && (
                    <FormField
                      control={form.control}
                      name="fixedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="e.g., 2500.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("pricingType") === "consultation" && (
                    <FormField
                      control={form.control}
                      name="consultationRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consultation Fee ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="e.g., 200.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="deliveryTimeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Timeframe</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2-3 business days, 1-2 weeks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isRemote"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Available Remotely
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isOnsite"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Available On-site
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="offeredSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills Offered</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Financial Analysis, Risk Management, Tax Planning"
                            value={field.value.join(', ')}
                            onChange={(e) => {
                              const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                              field.onChange(skills);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">Separate multiple skills with commas</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiredSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prerequisites (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Basic Accounting, Excel Proficiency"
                            value={field.value.join(', ')}
                            onChange={(e) => {
                              const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                              field.onChange(skills);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">Skills clients should have before using this service</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxClientsPerMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Clients Per Month (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDialogClose}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                    >
                      {editingService ? "Update Service" : "Create Service"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {servicesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myServices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6">
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No services yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Start monetizing your expertise by creating your first professional service
                  </p>
                </div>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Service
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myServices.map((service: any) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {categories.find((c: any) => c.id === service.categoryId)?.name}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {getPriceDisplay(service)}
                    </div>
                    {service.averageRating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {(service.averageRating / 100).toFixed(1)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                    {service.shortDescription || service.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-3">
                      {service.deliveryTimeframe && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {service.deliveryTimeframe}
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        {service.isRemote && (
                          <Badge variant="secondary" className="text-xs">Remote</Badge>
                        )}
                        {service.isOnsite && (
                          <Badge variant="secondary" className="text-xs">On-site</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {service.bookingCount || 0} bookings
                    </div>
                  </div>

                  {service.isPaused && (
                    <Badge variant="destructive" className="mt-3">
                      Paused
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}