import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, Star, Clock, MapPin, Users, Calendar, Shield, Award, MessageSquare, UserCircle } from "lucide-react";

const bookingFormSchema = z.object({
  clientMessage: z.string().min(10, "Please provide details about your requirements"),
  requirements: z.string().min(20, "Please describe your specific requirements"),
  estimatedHours: z.number().optional(),
  scheduledStartDate: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ["/api/professional-services", id],
    queryFn: async () => {
      const response = await fetch(`/api/professional-services/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch service details");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: provider } = useQuery({
    queryKey: ["/api/employees", service?.providerId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${service.providerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch provider details");
      }
      return response.json();
    },
    enabled: !!service?.providerId,
  });

  const { data: team } = useQuery({
    queryKey: ["/api/teams", service?.teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${service.teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team details");
      }
      return response.json();
    },
    enabled: !!service?.teamId && service?.serviceType === "team",
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/professional-services", id, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/professional-services/${id}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ["/api/professional-services", id, "portfolios"],
    queryFn: async () => {
      const response = await fetch(`/api/professional-services/${id}/portfolios`);
      if (!response.ok) {
        throw new Error("Failed to fetch portfolios");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      clientMessage: "",
      requirements: "",
    },
  });

  const bookServiceMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await fetch("/api/service-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: parseInt(id!),
          providerId: service.providerId,
          bookingType: service.pricingType,
          agreedRate: service.hourlyRate || service.fixedPrice || service.consultationRate || 0,
          ...data,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book service");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bookings"] });
      setIsBookingDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Service booking request sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to book service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    bookServiceMutation.mutate(data);
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getPriceDisplay = () => {
    if (!service) return "";
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

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Service Not Found</h1>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {getCategoryName(service.categoryId)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{getPriceDisplay()}</div>
                    {service.averageRating && (
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm">{(service.averageRating / 100).toFixed(1)} ({reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mt-4">
                  {service.deliveryTimeframe && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.deliveryTimeframe}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {service.bookingCount || 0} bookings
                  </div>
                  <div className="flex items-center space-x-1">
                    {service.isRemote && <Badge variant="secondary">Remote</Badge>}
                    {service.isOnsite && <Badge variant="secondary">On-site</Badge>}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Service Description</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {service.shortDescription && (
                    <div>
                      <h3 className="font-semibold mb-2">Quick Summary</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {service.shortDescription}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Expertise */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.offeredSkills && service.offeredSkills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skills Offered</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.offeredSkills.map((skill: string) => (
                          <Badge key={skill} variant="default" className="bg-green-100 text-green-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.requiredSkills && service.requiredSkills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Prerequisites</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.requiredSkills.map((skill: string) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.title && (
                          <h5 className="font-medium mb-1">{review.title}</h5>
                        )}
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {review.review}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Info */}
            {(service?.serviceType === "team" && team) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={team.profileImage} />
                      <AvatarFallback>
                        {team.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{team.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Team</p>
                      {team.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
                          {team.description}
                        </p>
                      )}
                      {team.specialties && team.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {team.specialties.slice(0, 3).map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {team.specialties.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{team.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      <Link href={`/teams/${team.id}`}>
                        <Button variant="outline" size="sm" className="mt-3">
                          <Users className="h-4 w-4 mr-2" />
                          View Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : provider && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={provider.profileImage} />
                      <AvatarFallback>
                        {provider.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{provider.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {provider.yearsExperience} years experience
                      </p>
                      {provider.bio && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
                          {provider.bio}
                        </p>
                      )}
                      <Link href={`/profile/${provider.id}`}>
                        <Button variant="outline" size="sm" className="mt-3">
                          <UserCircle className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pricing Type:</span>
                    <span className="capitalize">{service.pricingType}</span>
                  </div>
                  
                  {service.maxClientsPerMonth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Capacity:</span>
                      <span>{service.maxClientsPerMonth} clients</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Format:</span>
                    <div className="flex gap-1">
                      {service.isRemote && <Badge variant="secondary" className="text-xs">Remote</Badge>}
                      {service.isOnsite && <Badge variant="secondary" className="text-xs">On-site</Badge>}
                    </div>
                  </div>

                  {service.requiresPrequalification && (
                    <div className="flex items-center text-orange-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="text-xs">Prequalification required</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Book Service */}
            <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book This Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Book Service: {service.title}</DialogTitle>
                  <DialogDescription>
                    Provide details about your requirements to get started with this service.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="clientMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Introduce yourself and explain why you're interested in this service..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Requirements</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your specific needs, expected deliverables, timeline, and any special requirements..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {service.pricingType === "hourly" && (
                      <FormField
                        control={form.control}
                        name="estimatedHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Hours (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 20"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="scheduledStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Start Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBookingDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={bookServiceMutation.isPending}
                      >
                        {bookServiceMutation.isPending ? "Sending..." : "Send Booking Request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}