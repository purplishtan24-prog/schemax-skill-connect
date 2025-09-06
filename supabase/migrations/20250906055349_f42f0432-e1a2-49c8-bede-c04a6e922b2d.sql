-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add category_id and subcategory_id to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert categories" ON public.categories FOR INSERT WITH CHECK (true);

-- Create policies for subcategories
CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert subcategories" ON public.subcategories FOR INSERT WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, icon) VALUES
('Technology', 'code-2'),
('Design', 'palette'),
('Marketing', 'megaphone'),
('Writing', 'pen-tool'),
('Business', 'briefcase'),
('Programming', 'laptop'),
('Finance', 'calculator'),
('Education', 'book-open')
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Technology
INSERT INTO public.subcategories (name, category_id) 
SELECT 'Web Development', id FROM public.categories WHERE name = 'Technology'
UNION ALL
SELECT 'Mobile Development', id FROM public.categories WHERE name = 'Technology'
UNION ALL  
SELECT 'Software Development', id FROM public.categories WHERE name = 'Technology'
UNION ALL
SELECT 'Database Design', id FROM public.categories WHERE name = 'Technology';

-- Insert subcategories for Design
INSERT INTO public.subcategories (name, category_id)
SELECT 'UI/UX Design', id FROM public.categories WHERE name = 'Design'
UNION ALL
SELECT 'Graphic Design', id FROM public.categories WHERE name = 'Design'
UNION ALL
SELECT 'Logo Design', id FROM public.categories WHERE name = 'Design'
UNION ALL
SELECT 'Web Design', id FROM public.categories WHERE name = 'Design';

-- Insert subcategories for Marketing
INSERT INTO public.subcategories (name, category_id)
SELECT 'Digital Marketing', id FROM public.categories WHERE name = 'Marketing'
UNION ALL
SELECT 'Social Media Marketing', id FROM public.categories WHERE name = 'Marketing'
UNION ALL
SELECT 'SEO', id FROM public.categories WHERE name = 'Marketing'
UNION ALL
SELECT 'Content Marketing', id FROM public.categories WHERE name = 'Marketing';

-- Insert subcategories for Writing
INSERT INTO public.subcategories (name, category_id)
SELECT 'Content Writing', id FROM public.categories WHERE name = 'Writing'
UNION ALL
SELECT 'Technical Writing', id FROM public.categories WHERE name = 'Writing'
UNION ALL
SELECT 'Copywriting', id FROM public.categories WHERE name = 'Writing'
UNION ALL
SELECT 'Translation', id FROM public.categories WHERE name = 'Writing';