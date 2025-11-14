import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Clock, DollarSign, Users } from "lucide-react";

interface RecentSearch {
  id: string;
  query: string;
  timestamp: Date;
}

interface RecommendedFreelancer {
  id: string;
  display_name: string;
  avatar_url: string | null;
  skills: string[];
  rating: number;
  hourly_rate: number;
}

export default function ClientHome() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recommendedFreelancers, setRecommendedFreelancers] = useState<RecommendedFreelancer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user's recent searches and recommended freelancers
    loadRecentSearches();
    loadRecommendedFreelancers();
  }, []);

  const loadRecentSearches = async () => {
    // Mock data for now - in real app, load from user preferences/history
    setRecentSearches([
      { id: '1', query: 'React Developer', timestamp: new Date() },
      { id: '2', query: 'UI/UX Designer', timestamp: new Date() },
      { id: '3', query: 'Content Writer', timestamp: new Date() },
    ]);
  };

  const loadRecommendedFreelancers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          avatar_url,
          hourly_rate,
          skills (name)
        `)
        .eq('role', 'freelancer')
        .limit(6);

      if (data) {
        const freelancers = data.map(freelancer => ({
          id: freelancer.id,
          display_name: freelancer.display_name || 'Anonymous',
          avatar_url: freelancer.avatar_url,
          skills: freelancer.skills?.map((skill: any) => skill.name) || [],
          rating: 4.8, // Mock rating
          hourly_rate: freelancer.hourly_rate || 25,
        }));
        setRecommendedFreelancers(freelancers);
      }
    } catch (error) {
      console.error('Error loading recommended freelancers:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">Find the perfect freelancer for your project</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for freelancers..."
                className="pl-10 pr-4 py-3 w-full text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${e.currentTarget.value}`);
                  }
                }}
              />
            </div>
            <Button onClick={() => navigate('/search')} size="lg">
              Find Freelancers
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Proposals</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">৳0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Star className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Saved Freelancers</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
            <CardDescription>Your recent freelancer searches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <Badge
                  key={search.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/search?q=${search.query}`)}
                >
                  {search.query}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Freelancers */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Top freelancers based on your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedFreelancers.map((freelancer) => (
                <Card key={freelancer.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {freelancer.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{freelancer.display_name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-muted-foreground">{freelancer.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {freelancer.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      ৳{freelancer.hourly_rate}/hour
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}