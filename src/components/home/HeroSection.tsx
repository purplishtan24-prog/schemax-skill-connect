import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Users, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-hero rounded-full blur-3xl opacity-20 animate-float" />
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent rounded-full blur-2xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <Star className="w-3 h-3 mr-1" />
                Trusted by 10,000+ clients worldwide
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Find the{" "}
                <span className="gradient-text">Perfect Freelancer</span>
                {" "}for Your Project
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Connect with skilled professionals worldwide. Get your projects done faster with verified freelancers, instant booking, and secure payments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-base px-8" onClick={() => navigate('/search')}>
                <Search className="w-4 h-4 mr-2" />
                Find Freelancers
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8" onClick={() => navigate('/auth')}>
                Join as Freelancer
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">50,000+ freelancers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">98% success rate</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <img
                src={heroImage}
                alt="Professional freelancers collaborating"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating Stats Cards */}
            <div className="absolute -top-6 -left-6 bg-card border border-card-border rounded-xl p-4 shadow-card backdrop-blur-sm animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-success-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Project Completed</div>
                  <div className="text-xs text-muted-foreground">+2,341 this week</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-card border border-card-border rounded-xl p-4 shadow-card backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">5.0 Rating</div>
                  <div className="text-xs text-muted-foreground">Average rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};