import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Smartphone, Palette, Brush, Megaphone, PenTool, Search, BarChart3, Globe, ShoppingCart, Languages, Film } from "lucide-react";

interface Skill {
  id: string;
  name: string;
}

const iconMap: Record<string, JSX.Element> = {
  "Web Development": <Code2 className="w-5 h-5" />,
  "Mobile App Development": <Smartphone className="w-5 h-5" />,
  "UI/UX Design": <Palette className="w-5 h-5" />,
  "Graphic Design": <Brush className="w-5 h-5" />,
  "Digital Marketing": <Megaphone className="w-5 h-5" />,
  "Content Writing": <PenTool className="w-5 h-5" />,
  "SEO": <Search className="w-5 h-5" />,
  "Data Analysis": <BarChart3 className="w-5 h-5" />,
  "WordPress": <Globe className="w-5 h-5" />,
  "E-commerce": <ShoppingCart className="w-5 h-5" />,
  "Translation": <Languages className="w-5 h-5" />,
  "Video Editing": <Film className="w-5 h-5" />,
};

export const Categories = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(12);
      setSkills(data || []);
      setLoading(false);
    };
    loadSkills();
  }, []);

  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Popular Categories</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Browse by <span className="gradient-text">Category</span>
          </h2>
          <p className="text-muted-foreground mt-2">Find experts across the most in-demand skills</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(loading ? Array.from({ length: 8 }) : skills).map((skill: any, idx) => (
            <Card key={skill?.id || idx} className="hover-lift border-card-border bg-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary">
                    {iconMap[skill?.name as string] || <Search className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium">{skill?.name || "\u00A0"}</div>
                    <div className="text-xs text-muted-foreground">Top talent available</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/search?skills=${encodeURIComponent(skill.name)}`)}
                  disabled={!skill?.name}
                >
                  Explore
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
