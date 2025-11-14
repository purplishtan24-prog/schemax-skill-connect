import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock, Verified } from "lucide-react";
import freelancer1 from "@/assets/freelancer-1.jpg";
import freelancer2 from "@/assets/freelancer-2.jpg";
import freelancer3 from "@/assets/freelancer-3.jpg";
import { useNavigate } from "react-router-dom";

const freelancers = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "Full-Stack Developer",
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 85,
    location: "San Francisco, CA",
    skills: ["React", "Node.js", "TypeScript"],
    availability: "Available now",
    image: freelancer1,
    verified: true,
    completedProjects: 89,
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    title: "UI/UX Designer",
    rating: 5.0,
    reviewCount: 203,
    hourlyRate: 75,
    location: "Austin, TX",
    skills: ["Figma", "Design Systems", "Prototyping"],
    availability: "Available in 2 days",
    image: freelancer2,
    verified: true,
    completedProjects: 156,
  },
  {
    id: 3,
    name: "Emily Johnson",
    title: "Digital Marketing Expert",
    rating: 4.8,
    reviewCount: 91,
    hourlyRate: 65,
    location: "New York, NY",
    skills: ["SEO", "Content Strategy", "Analytics"],
    availability: "Available now",
    image: freelancer3,
    verified: true,
    completedProjects: 73,
  },
];

export const FeaturedFreelancers = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12 animate-fade-in">
          <Badge variant="secondary" className="mb-4">
            Top Rated
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured <span className="gradient-text">Freelancers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Work with top-rated professionals who have proven track records and excellent client feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer, index) => (
            <Card 
              key={freelancer.id} 
              className="hover-lift cursor-pointer border-card-border bg-card animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={freelancer.image}
                      alt={freelancer.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {freelancer.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center border-2 border-card">
                        <Verified className="w-3 h-3 text-success-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                    <p className="text-muted-foreground text-sm">{freelancer.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{freelancer.rating}</span>
                      <span className="text-sm text-muted-foreground">({freelancer.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {freelancer.location}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-success" />
                    <span className="text-success font-medium">{freelancer.availability}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {freelancer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-bold text-primary">৳{freelancer.hourlyRate}</div>
                    <div className="text-sm text-muted-foreground">per hour</div>
                  </div>
                  
                  <Button variant="default" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8" onClick={() => navigate('/search')}>
            View All Freelancers
          </Button>
        </div>
      </div>
    </section>
  );
};