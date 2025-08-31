import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Star 
} from "lucide-react";

const footerLinks = {
  "For Clients": [
    "Find Freelancers",
    "Post a Project",
    "How it Works",
    "Client Success Stories",
    "Trust & Safety",
  ],
  "For Freelancers": [
    "Join as Freelancer",
    "Find Work",
    "Success Stories",
    "Resources",
    "Community",
  ],
  "Company": [
    "About Us",
    "Careers",
    "Press",
    "Blog",
    "Contact",
  ],
  "Support": [
    "Help Center",
    "Terms of Service",
    "Privacy Policy",
    "Cookie Policy",
    "Guidelines",
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl gradient-text">SchemaX</span>
            </div>
            
            <p className="text-muted-foreground text-sm max-w-xs">
              The world's premier freelancer marketplace. Connect with top talent and grow your business.
            </p>
            
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">4.9/5 from 50,000+ reviews</span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Newsletter Section */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-semibold mb-2">Stay updated</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest news, updates, and tips delivered to your inbox.
            </p>
          </div>
          
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <Button variant="default">Subscribe</Button>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Contact & Copyright */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              contact@schemax.com
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              +1 (555) 123-4567
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              San Francisco, CA
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground md:text-right">
            © 2024 SchemaX. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};