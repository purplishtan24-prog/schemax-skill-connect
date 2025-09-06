import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Smartphone, Palette, Brush, Megaphone, PenTool, Search, BarChart3, Globe, ShoppingCart, Languages, Film, DollarSign } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

const iconMap: Record<string, JSX.Element> = {
  "Technology": <Code2 className="w-5 h-5" />,
  "Design": <Palette className="w-5 h-5" />,
  "Marketing": <Megaphone className="w-5 h-5" />,
  "Writing": <PenTool className="w-5 h-5" />,
  "Business": <BarChart3 className="w-5 h-5" />,
  "Programming": <Smartphone className="w-5 h-5" />,
  "Finance": <DollarSign className="w-5 h-5" />,
  "Education": <Globe className="w-5 h-5" />,
};

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name", { ascending: true });
      setCategories(data || []);
      setLoading(false);
    };
    loadCategories();
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
          {(loading ? Array.from({ length: 8 }) : categories).map((category: any, idx) => (
            <Card key={category?.id || idx} className="hover-lift border-card-border bg-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary">
                    {iconMap[category?.name as string] || <Search className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium">{category?.name || "\u00A0"}</div>
                    <div className="text-xs text-muted-foreground">Find professionals</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
                  disabled={!category?.name}
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
