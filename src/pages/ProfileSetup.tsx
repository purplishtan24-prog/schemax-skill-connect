import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, DollarSign, FileText } from "lucide-react";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [hourlyRate, setHourlyRate] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Pre-fill display name from auth metadata
      if (session.user.user_metadata?.display_name) {
        setDisplayName(session.user.user_metadata.display_name);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const profileData = {
        id: session.user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        role,
        hourly_rate: role === 'freelancer' && hourlyRate ? parseInt(hourlyRate) : null,
        is_public: isPublic,
      };

      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) throw error;

      toast({
        title: "Profile created successfully!",
        description: "Welcome to SchemaX. Let's get you started.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-2xl gradient-text">SchemaX</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Let's set up your profile to get you started on SchemaX
          </p>
        </div>

        <Card className="shadow-glass border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Tell us about yourself to create your SchemaX profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>I want to *</Label>
                <RadioGroup value={role} onValueChange={(value: 'client' | 'freelancer') => setRole(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client">Hire freelancers (I'm a client)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="freelancer" id="freelancer" />
                    <Label htmlFor="freelancer">Offer my services (I'm a freelancer)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {role === 'freelancer' && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Hourly Rate (USD)
                  </Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="50"
                    min="1"
                    max="500"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder={role === 'freelancer' 
                    ? "Tell clients about your skills and experience..."
                    : "Tell freelancers about your projects and requirements..."
                  }
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPublic">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to discover your profile
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating Profile..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}