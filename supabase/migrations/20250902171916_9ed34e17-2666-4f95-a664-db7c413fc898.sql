-- Insert popular skills/categories for the marketplace
INSERT INTO skills (name) VALUES
('Web Development'),
('Mobile App Development'),
('UI/UX Design'), 
('Graphic Design'),
('Digital Marketing'),
('Content Writing'),
('SEO'),
('Video Editing'),
('Data Analysis'),
('WordPress'),
('React'),
('Node.js'),
('Python'),
('JavaScript'),
('Figma'),
('Photoshop'),
('Social Media Marketing'),
('Logo Design'),
('E-commerce'),
('Translation')
ON CONFLICT (name) DO NOTHING;