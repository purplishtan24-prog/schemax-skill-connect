import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, CreditCard, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find the Right Freelancer",
    description: "Browse through thousands of verified professionals and filter by skills, experience, and budget.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: UserCheck,
    title: "Review & Book Instantly",
    description: "Check portfolios, read reviews, and book your chosen freelancer with instant confirmation.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: CreditCard,
    title: "Secure Payment & Delivery",
    description: "Pay securely through our platform and receive your completed project with satisfaction guarantee.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "Share your experience and help build our community of trusted professionals.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="gradient-text">SchemaX</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get your projects done in four simple steps. From finding the perfect freelancer to project completion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index} 
                className="text-center group animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${step.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-8 h-8 ${step.color}`} />
                </div>
                
                <div className="relative">
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-12 w-8 h-px bg-gradient-to-r from-border to-transparent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-8 bg-gradient-card rounded-2xl border border-card-border text-center animate-fade-in">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join thousands of satisfied clients who've found their perfect freelancer match on SchemaX. Our platform connects you with verified professionals from Bangladesh and around the world.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-semibold mb-2 text-primary">🛡️ Secure & Trusted</h4>
              <p className="text-sm text-muted-foreground">All payments are secured with escrow protection. Pay only when you're 100% satisfied with the work.</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-semibold mb-2 text-accent">⚡ Quick Turnaround</h4>
              <p className="text-sm text-muted-foreground">Get your projects completed faster with our pool of dedicated freelancers available 24/7.</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-semibold mb-2 text-success">💰 Fair Pricing</h4>
              <p className="text-sm text-muted-foreground">Competitive rates starting from ৳500. No hidden fees, transparent pricing for all services.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-hero text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Post Your Project
            </button>
            <button className="px-8 py-3 border border-border rounded-lg hover:bg-secondary transition-colors">
              Browse Freelancers
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};