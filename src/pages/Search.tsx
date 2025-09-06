import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search as SearchIcon, 
  MapPin, 
  DollarSign, 
  Star, 
  Filter,
  SlidersHorizontal 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Freelancer {
  id: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  avg_rating: number;
  review_count: number;
  is_verified: boolean;
  skills: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price_cents: number;
  }>;
}

export default function Search() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [minRate, setMinRate] = useState([0]);
  const [maxRate, setMaxRate] = useState([200]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const loc = params.get('location') || '';
    const min = params.get('min_rate');
    const max = params.get('max_rate');
    setSearchQuery(q);
    setLocation(loc);
    if (min) setMinRate([parseInt(min)]);
    if (max) setMaxRate([parseInt(max)]);
    
    // Only search if there are actual search parameters
    if (q || loc || min || max || params.get('skills') || params.get('category')) {
      searchFreelancers();
    }
  }, []);

  const searchFreelancers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (location) params.append('location', location);
      if (minRate[0] > 0) params.append('min_rate', minRate[0].toString());
      if (maxRate[0] < 200) params.append('max_rate', maxRate[0].toString());
      params.append('verified_only', 'false');
      params.append('limit', '20');

      // Preserve category and skills filter from URL if present
      const current = new URLSearchParams(window.location.search);
      const skills = current.get('skills');
      const category = current.get('category');
      if (skills) params.append('skills', skills);
      if (category) params.append('category', category);

      const searchUrl = `https://zdmymcefzmbckohzupgt.supabase.co/functions/v1/search-freelancers?${params.toString()}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbXltY2Vmem1iY2tvaHp1cGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjA4NjYsImV4cCI6MjA3MjIzNjg2Nn0.X83vHjPN1bq_0MLYnauFo9r3NzGVUBG7fPjE4DN4DbM',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data?.success) {
        setFreelancers(data.freelancers || []);
      } else {
        throw new Error(data?.error || 'Search failed');
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search freelancers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchFreelancers();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocation("");
    setMinRate([0]);
    setMaxRate([200]);
    searchFreelancers();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Freelancers</h1>
          <p className="text-muted-foreground">
            Discover talented professionals for your projects
          </p>
        </div>

        {/* Search Header */}
        <Card className="mb-8 shadow-card border-card-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by skills, name, or description..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full lg:w-64">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Location"
                      className="pl-10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Hourly Rate Range: ৳{minRate[0]} - ৳{maxRate[0]}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Min Rate</Label>
                          <Slider
                            value={minRate}
                            onValueChange={setMinRate}
                            max={200}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Rate</Label>
                          <Slider
                            value={maxRate}
                            onValueChange={setMaxRate}
                            max={200}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Apply Filters</Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching for freelancers...</p>
            </div>
          ) : freelancers.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No freelancers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse our categories
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {freelancers.map((freelancer) => (
                <Card key={freelancer.id} className="shadow-card border-card-border hover-lift cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={freelancer.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {freelancer.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {freelancer.display_name}
                              {freelancer.is_verified && (
                                <Badge variant="outline" className="text-xs">Verified</Badge>
                              )}
                            </CardTitle>
                            {freelancer.location && (
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {freelancer.location}
                              </CardDescription>
                            )}
                          </div>
                          <div className="text-right">
                            {freelancer.hourly_rate && (
                              <div className="font-semibold flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ৳{freelancer.hourly_rate}/hr
                              </div>
                            )}
                            {freelancer.review_count > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-3 h-3 fill-current text-yellow-500" />
                                {freelancer.avg_rating.toFixed(1)} ({freelancer.review_count})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {freelancer.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {freelancer.bio}
                      </p>
                    )}
                    
                    {freelancer.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {freelancer.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                          {freelancer.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{freelancer.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {freelancer.services.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Featured Services:</h4>
                        <div className="space-y-1">
                          {freelancer.services.slice(0, 2).map((service) => (
                            <div key={service.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate">
                                {service.title}
                              </span>
                              <span className="font-medium ml-2">
                                ৳{(service.price_cents / 100).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/freelancer/${freelancer.id}/book`)}
                      >
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}