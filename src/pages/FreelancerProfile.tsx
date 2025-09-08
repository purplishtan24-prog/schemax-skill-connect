import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/layout/Navigation";
import { 
  MapPin, 
  DollarSign, 
  Star, 
  Calendar,
  Clock,
  User,
  CheckCircle
} from "lucide-react";

interface FreelancerProfile {
  id: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  is_public: boolean;
  avg_rating: number;
  review_count: number;
  is_verified: boolean;
  skills: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price_cents: number;
    duration_minutes: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    client_id: string;
  }>;
}

export default function FreelancerProfile() {
  const { freelancerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!freelancerId) {
      navigate('/search');
      return;
    }
    loadFreelancer();
  }, [freelancerId]);

  const loadFreelancer = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          freelancer_skills(
            skill:skills(id, name)
          ),
          services(
            id,
            title,
            description,
            price_cents,
            duration_minutes,
            is_active
          ),
          verifications(
            status
          )
        `)
        .eq('id', freelancerId)
        .eq('role', 'freelancer')
        .eq('is_public', true)
        .single();

      if (profileError) throw profileError;

      // Fetch reviews separately to avoid relationship conflicts
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client_id
        `)
        .eq('freelancer_id', freelancerId);

      if (reviewsError) throw reviewsError;

      const data = {
        ...profileData,
        reviews: reviewsData || []
      };

      if (data) {
        // Calculate average rating
        const reviews = data.reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
          : 0;

        // Check verification status
        const isVerified = data.verifications?.some((v: any) => v.status === "verified") || false;

        // Get skills
        const skills = data.freelancer_skills?.map((fs: any) => fs.skill) || [];

        // Filter active services
        const activeServices = data.services?.filter((s: any) => s.is_active) || [];

        setFreelancer({
          ...data,
          avg_rating: Number(avgRating.toFixed(1)),
          review_count: reviews.length,
          is_verified: isVerified,
          skills,
          services: activeServices,
          reviews: reviews.slice(0, 5) // Show only recent reviews
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: any) => {
    navigate(`/book/${service.id}`, { 
      state: { 
        service,
        freelancer: { 
          display_name: freelancer?.display_name,
          avatar_url: freelancer?.avatar_url 
        } 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
          <p className="text-muted-foreground mb-4">This freelancer profile is not available.</p>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={freelancer.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {freelancer.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="flex items-center justify-center gap-2">
                  {freelancer.display_name}
                  {freelancer.is_verified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                {freelancer.location && (
                  <CardDescription className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {freelancer.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancer.hourly_rate && (
                  <div className="text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <DollarSign className="w-5 h-5" />
                      ৳{freelancer.hourly_rate}/hr
                    </div>
                  </div>
                )}

                {freelancer.review_count > 0 && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold">{freelancer.avg_rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.review_count} review{freelancer.review_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {freelancer.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-sm text-muted-foreground">{freelancer.bio}</p>
                  </div>
                )}

                {freelancer.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services and Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Available services from this freelancer</CardDescription>
              </CardHeader>
              <CardContent>
                {freelancer.services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No services available at the moment.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {freelancer.services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{service.title}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ৳{(service.price_cents / 100).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} mins
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBookService(service)}
                          className="w-full"
                        >
                          Book Service
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            {freelancer.reviews.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                  <CardDescription>What clients say about this freelancer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {freelancer.reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}