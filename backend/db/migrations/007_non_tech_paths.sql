-- ============================================================
-- Phase 22: Non-Tech Career Path Expansion
-- ============================================================

-- Inserting New Domains
INSERT INTO domains (id, name, description, icon) VALUES 
('55555555-5555-4555-b555-555555555555', 'Farming & Agriculture', 'Precision farming, organic agriculture, and agri-business management.', '🚜'),
('66666666-6666-4666-b666-666666666666', 'Hospitality & Tourism', 'Hotel management, culinary arts, and tourism operations.', '🏨'),
('77777777-7777-4777-b777-777777777777', 'Law & Justice', 'Corporate law, litigation, legal tech, and public interest law.', '⚖️')
ON CONFLICT (name) DO NOTHING;

-- Inserting Career Paths for Arts (Existing Domain)
INSERT INTO career_paths (id, domain_id, name, description, required_skills_json, expected_activities_json) VALUES 
(uuid_generate_v4(), '44444444-4444-4444-b444-444444444444', 'Graphic Designer', 'Visual communication using typography, photography, and illustration.', '["Adobe Suite", "Typography", "Branding"]', '{"portfolio_pieces": 5, "freelance_projects": 2}'),
(uuid_generate_v4(), '44444444-4444-4444-b444-444444444444', 'Content Strategist', 'Creating and managing engaging specialized content for digital platforms.', '["SEO", "Storytelling", "Research", "Copywriting"]', '{"published_articles": 10, "blog_posts": 20}'),
(uuid_generate_v4(), '44444444-4444-4444-b444-444444444444', 'UPSC Civil Servant', 'Serving the nation through various administrative roles in the government.', '["General Studies", "Ethics", "Public Administration", "Analytical Writing"]', '{"mock_tests": 50, "essay_writing": 20}'),
(uuid_generate_v4(), '44444444-4444-4444-b444-444444444444', 'Corporate Psychologist', 'Improving organizational productivity and employee well-being.', '["Behavioral Analysis", "Conflict Resolution", "Research Methods"]', '{"case_studies": 5, "internships": 1}')
ON CONFLICT DO NOTHING;

-- Inserting Career Paths for Commerce (Existing Domain)
INSERT INTO career_paths (id, domain_id, name, description, required_skills_json, expected_activities_json) VALUES 
(uuid_generate_v4(), '33333333-3333-4333-b333-333333333333', 'Chartered Accountant (CA)', 'Specializing in auditing, taxation, and financial management.', '["Financial Accounting", "Direct Taxation", "Auditing", "Corporate Laws"]', '{"articleship_years": 3, "exam_cleared": "Final"}'),
(uuid_generate_v4(), '33333333-3333-4333-b333-333333333333', 'Investment Banker', 'Advising corporations on capital raising and M&A activities.', '["Financial Modeling", "Valuation", "Excel", "Pitching"]', '{"internships": 2, "deal_simulations": 5}'),
(uuid_generate_v4(), '33333333-3333-4333-b333-333333333333', 'Fintech Analyst', 'Analyzing data and trends at the intersection of finance and technology.', '["Data Analysis", "Python", "Payments Systems", "Blockchain Basics"]', '{"project_reports": 3, "industry_certs": 2}')
ON CONFLICT DO NOTHING;

-- Inserting Career Paths for Farming
INSERT INTO career_paths (id, domain_id, name, description, required_skills_json, expected_activities_json) VALUES 
(uuid_generate_v4(), '55555555-5555-4555-b555-555555555555', 'Precision Agriculturist', 'Using IoT and data to optimize crop yields and soil health.', '["IoT", "Data Analysis", "Agronomy"]', '{"field_trials": 3, "tech_implementations": 2}'),
(uuid_generate_v4(), '55555555-5555-4555-b555-555555555555', 'Organic Farm Manager', 'Managing soil fertility and biodiversity per organic standards.', '["Organic Chemistry", "Pest Management", "Composting"]', '{"certification_process": 1, "farm_size_managed": "5+ acres"}')
ON CONFLICT DO NOTHING;

-- Inserting Career Paths for Hospitality
INSERT INTO career_paths (id, domain_id, name, description, required_skills_json, expected_activities_json) VALUES 
(uuid_generate_v4(), '66666666-6666-4666-b666-666666666666', 'Chef de Cuisine', 'Mastering culinary techniques and managing commercial kitchens.', '["Menu Planning", "Food Safety", "Cost Control"]', '{"cuisine_specialties": 3, "service_hours": 2000}'),
(uuid_generate_v4(), '66666666-6666-4666-b666-666666666666', 'Hotel Manager', 'Overseeing daily operations and guest experiences at a property.', '["Revenue Management", "Customer Service", "HR"]', '{"internships": 2, "leadership_roles": 1}')
ON CONFLICT DO NOTHING;

-- Inserting Career Paths for Law
INSERT INTO career_paths (id, domain_id, name, description, required_skills_json, expected_activities_json) VALUES 
(uuid_generate_v4(), '77777777-7777-4777-b777-777777777777', 'Corporate Counsel', 'Advising businesses on legal obligations and corporate transactions.', '["Contract Drafting", "Company Law", "Securities Law", "M&A"]', '{"internships": 3, "moot_courts": 2}'),
(uuid_generate_v4(), '77777777-7777-4777-b777-777777777777', 'Cyber Law Specialist', 'Handling cases related to cybercrime and digital information security.', '["IT Act", "Data Privacy", "Digital Evidence", "IPR"]', '{"certifications": 2, "case_analyses": 10}'),
(uuid_generate_v4(), '77777777-7777-4777-b777-777777777777', 'Public Interest Litigator', 'Representing the public interest in matters like human rights and environment.', '["Constitutional Law", "Oral Advocacy", "Legal Research", "Social Justice"]', '{"PIL_drafts": 2, "volunteer_hours": 500}')
ON CONFLICT DO NOTHING;
