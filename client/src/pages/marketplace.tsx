import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Star, Clock, MapPin, Users, Search, Filter } from "lucide-react";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/professional-services", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      
      const response = await fetch(`/api/professional-services?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/service-categories"],
  });

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

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Professional Services Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Discover expert financial services from certified professionals
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {servicesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
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
        ) : services.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6">
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No services found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {searchQuery || selectedCategory 
                      ? "Try adjusting your search criteria"
                      : "Be the first to offer professional services"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service: any) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {getCategoryName(service.categoryId)}
                      </CardDescription>
                    </div>
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
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
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

                  {/* Skills offered */}
                  {service.offeredSkills && service.offeredSkills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {service.offeredSkills.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {service.offeredSkills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.offeredSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}