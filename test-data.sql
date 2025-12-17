-- ============================================
-- ICG-ATS Test Data Generation Script
-- ============================================
-- This script creates realistic test data for development and testing
-- Run this in the Supabase SQL Editor
-- WARNING: This will add data to your database - use a test environment!

-- ============================================
-- SECTION 1: Clear Existing Test Data (Optional)
-- ============================================
-- Uncomment these lines to clear existing data before inserting test data
DELETE FROM applicants;
DELETE FROM time_slots WHERE is_active = true;
DELETE FROM officers WHERE username != 'admin';

-- ============================================
-- SECTION 2: Time Slots (18 slots across Mon-Thu)
-- ============================================
-- Creating interview time slots for a typical week
-- Monday & Tuesday: 6 slots each (2pm-8pm)
-- Wednesday & Thursday: 3 slots each (2pm-5pm)

INSERT INTO time_slots (id, day_of_week, start_time, end_time, display_label, max_capacity, is_active) VALUES
-- Monday (6 slots)
('550e8400-e29b-41d4-a716-446655440001', 'Monday', '14:00', '15:00', 'Monday 2-3pm', 4, true),
('550e8400-e29b-41d4-a716-446655440002', 'Monday', '15:00', '16:00', 'Monday 3-4pm', 4, true),
('550e8400-e29b-41d4-a716-446655440003', 'Monday', '16:00', '17:00', 'Monday 4-5pm', 4, true),
('550e8400-e29b-41d4-a716-446655440004', 'Monday', '17:00', '18:00', 'Monday 5-6pm', 3, true),
('550e8400-e29b-41d4-a716-446655440005', 'Monday', '18:00', '19:00', 'Monday 6-7pm', 3, true),
('550e8400-e29b-41d4-a716-446655440006', 'Monday', '19:00', '20:00', 'Monday 7-8pm', 3, true),

-- Tuesday (6 slots)
('550e8400-e29b-41d4-a716-446655440007', 'Tuesday', '14:00', '15:00', 'Tuesday 2-3pm', 4, true),
('550e8400-e29b-41d4-a716-446655440008', 'Tuesday', '15:00', '16:00', 'Tuesday 3-4pm', 4, true),
('550e8400-e29b-41d4-a716-446655440009', 'Tuesday', '16:00', '17:00', 'Tuesday 4-5pm', 4, true),
('550e8400-e29b-41d4-a716-446655440010', 'Tuesday', '17:00', '18:00', 'Tuesday 5-6pm', 3, true),
('550e8400-e29b-41d4-a716-446655440011', 'Tuesday', '18:00', '19:00', 'Tuesday 6-7pm', 3, true),
('550e8400-e29b-41d4-a716-446655440012', 'Tuesday', '19:00', '20:00', 'Tuesday 7-8pm', 3, true),

-- Wednesday (3 slots)
('550e8400-e29b-41d4-a716-446655440013', 'Wednesday', '14:00', '15:00', 'Wednesday 2-3pm', 4, true),
('550e8400-e29b-41d4-a716-446655440014', 'Wednesday', '15:00', '16:00', 'Wednesday 3-4pm', 4, true),
('550e8400-e29b-41d4-a716-446655440015', 'Wednesday', '16:00', '17:00', 'Wednesday 4-5pm', 4, true),

-- Thursday (3 slots)
('550e8400-e29b-41d4-a716-446655440016', 'Thursday', '14:00', '15:00', 'Thursday 2-3pm', 4, true),
('550e8400-e29b-41d4-a716-446655440017', 'Thursday', '15:00', '16:00', 'Thursday 3-4pm', 4, true),
('550e8400-e29b-41d4-a716-446655440018', 'Thursday', '16:00', '17:00', 'Thursday 4-5pm', 4, true);

-- ============================================
-- SECTION 3: Officers (3 test officers)
-- ============================================
-- Note: In production, use proper password hashing (bcrypt)
-- These use plain text for testing only

INSERT INTO officers (id, username, password_hash, display_name) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'sarah.chen', 'test123', 'Sarah Chen'),
('660e8400-e29b-41d4-a716-446655440002', 'michael.rodriguez', 'test123', 'Michael Rodriguez'),
('660e8400-e29b-41d4-a716-446655440003', 'emily.patel', 'test123', 'Emily Patel');

-- ============================================
-- SECTION 4: Applicants (50 test applicants)
-- ============================================
-- Statuses: pending, reviewed, interview_scheduled, interview_completed, accepted, rejected
-- Realistic UCI majors and graduation years
-- Varied availability to test auto-assign algorithm

-- Group 1: Reviewed applicants (20) - Ready for interview scheduling
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
-- High flexibility (many slots available)
('770e8400-e29b-41d4-a716-446655440001', 'Alex', 'Johnson', 'alex.johnson@uci.edu', '(949) 555-0101', 'Business Administration', 2026,
  '{"q1": "I want to join ICG to develop my consulting skills and work on real business challenges.", "q2": "Led a team project analyzing market entry strategies for a local startup."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440013'],
  'reviewed', NULL, '[]', '2024-10-15 08:30:00'),

('770e8400-e29b-41d4-a716-446655440002', 'Maya', 'Patel', 'maya.patel@uci.edu', '(949) 555-0102', 'Economics', 2025,
  '{"q1": "ICG offers the perfect blend of analytical work and real-world impact.", "q2": "Conducted econometric analysis for my research project on consumer behavior."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440014'],
  'reviewed', NULL, '[]', '2024-10-15 09:15:00'),

-- Medium flexibility (3-4 slots)
('770e8400-e29b-41d4-a716-446655440003', 'Jordan', 'Lee', 'jordan.lee@uci.edu', '(949) 555-0103', 'Computer Science', 2027,
  '{"q1": "I am passionate about the intersection of technology and business strategy.", "q2": "Built a web application that increased our clubs membership by 40%."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440015'],
  'reviewed', NULL, '[]', '2024-10-15 10:00:00'),

('770e8400-e29b-41d4-a716-446655440004', 'Sofia', 'Martinez', 'sofia.martinez@uci.edu', '(949) 555-0104', 'Business Economics', 2026,
  '{"q1": "ICG will help me combine my quantitative skills with strategic thinking.", "q2": "Analyzed financial statements for a case competition and placed 2nd."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440016'],
  'reviewed', NULL, '[]', '2024-10-15 11:20:00'),

-- Low flexibility (1-2 slots) - Should be prioritized
('770e8400-e29b-41d4-a716-446655440005', 'Ethan', 'Kim', 'ethan.kim@uci.edu', '(949) 555-0105', 'Finance', 2025,
  '{"q1": "I want to apply financial modeling to solve complex business problems.", "q2": "Managed a $50k investment portfolio for our student fund."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007'],
  'reviewed', NULL, '[]', '2024-10-15 12:45:00'),

('770e8400-e29b-41d4-a716-446655440006', 'Aisha', 'Rahman', 'aisha.rahman@uci.edu', '(949) 555-0106', 'Data Science', 2026,
  '{"q1": "ICG offers a unique opportunity to leverage data in strategic consulting.", "q2": "Built predictive models for customer churn that improved retention by 25%."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440013'],
  'reviewed', NULL, '[]', '2024-10-15 13:30:00'),

('770e8400-e29b-41d4-a716-446655440007', 'Marcus', 'Thompson', 'marcus.thompson@uci.edu', '(949) 555-0107', 'International Studies', 2027,
  '{"q1": "I am interested in global business strategy and cross-cultural consulting.", "q2": "Coordinated international conference with 200+ attendees."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440016'],
  'reviewed', NULL, '[]', '2024-10-16 08:00:00'),

('770e8400-e29b-41d4-a716-446655440008', 'Olivia', 'Chen', 'olivia.chen@uci.edu', '(949) 555-0108', 'Accounting', 2025,
  '{"q1": "ICG will allow me to apply my analytical skills to real consulting projects.", "q2": "Completed audit procedures for a nonprofit organization."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440015'],
  'reviewed', NULL, '[]', '2024-10-16 09:30:00'),

('770e8400-e29b-41d4-a716-446655440009', 'Noah', 'Anderson', 'noah.anderson@uci.edu', '(949) 555-0109', 'Psychology', 2026,
  '{"q1": "I want to understand consumer behavior and organizational dynamics.", "q2": "Conducted user research that informed product design decisions."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013'],
  'reviewed', NULL, '[]', '2024-10-16 10:15:00'),

('770e8400-e29b-41d4-a716-446655440010', 'Emma', 'Wilson', 'emma.wilson@uci.edu', '(949) 555-0110', 'Marketing', 2027,
  '{"q1": "ICG will help me develop strategic marketing and consulting expertise.", "q2": "Created marketing campaign that increased social media engagement by 150%."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010'],
  'reviewed', NULL, '[]', '2024-10-16 11:00:00'),

('770e8400-e29b-41d4-a716-446655440011', 'Liam', 'Garcia', 'liam.garcia@uci.edu', '(949) 555-0111', 'Informatics', 2025,
  '{"q1": "I want to bridge technology and business through consulting.", "q2": "Developed data visualization dashboard for business intelligence."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440014'],
  'reviewed', NULL, '[]', '2024-10-16 14:20:00'),

('770e8400-e29b-41d4-a716-446655440012', 'Zara', 'Singh', 'zara.singh@uci.edu', '(949) 555-0112', 'Business Administration', 2026,
  '{"q1": "ICG offers hands-on experience in strategic problem-solving.", "q2": "Led business plan competition team to regional finals."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440009'],
  'reviewed', NULL, '[]', '2024-10-17 08:45:00'),

('770e8400-e29b-41d4-a716-446655440013', 'James', 'Nguyen', 'james.nguyen@uci.edu', '(949) 555-0113', 'Economics', 2027,
  '{"q1": "I am passionate about using economic analysis to drive business decisions.", "q2": "Researched labor market trends for policy recommendation project."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440016'],
  'reviewed', NULL, '[]', '2024-10-17 09:30:00'),

('770e8400-e29b-41d4-a716-446655440014', 'Isabella', 'Brown', 'isabella.brown@uci.edu', '(949) 555-0114', 'Management', 2025,
  '{"q1": "ICG will help me develop leadership and strategic thinking skills.", "q2": "Managed team of 8 for successful fundraising event."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440017'],
  'reviewed', NULL, '[]', '2024-10-17 10:00:00'),

('770e8400-e29b-41d4-a716-446655440015', 'Lucas', 'Davis', 'lucas.davis@uci.edu', '(949) 555-0115', 'Political Science', 2026,
  '{"q1": "I want to apply policy analysis to business strategy consulting.", "q2": "Interned at city hall analyzing public-private partnerships."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013'],
  'reviewed', NULL, '[]', '2024-10-17 11:15:00'),

('770e8400-e29b-41d4-a716-446655440016', 'Mia', 'Lopez', 'mia.lopez@uci.edu', '(949) 555-0116', 'Sociology', 2027,
  '{"q1": "ICG offers a platform to understand organizational behavior and strategy.", "q2": "Conducted ethnographic research on workplace culture."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440016'],
  'reviewed', NULL, '[]', '2024-10-17 13:00:00'),

('770e8400-e29b-41d4-a716-446655440017', 'Aiden', 'White', 'aiden.white@uci.edu', '(949) 555-0117', 'Statistics', 2025,
  '{"q1": "I want to leverage statistical analysis in business consulting.", "q2": "Applied regression models to predict sales trends."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009'],
  'reviewed', NULL, '[]', '2024-10-18 08:30:00'),

('770e8400-e29b-41d4-a716-446655440018', 'Sophia', 'Taylor', 'sophia.taylor@uci.edu', '(949) 555-0118', 'Cognitive Science', 2026,
  '{"q1": "ICG will allow me to apply cognitive research to business problems.", "q2": "Studied decision-making processes in organizational contexts."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440015'],
  'reviewed', NULL, '[]', '2024-10-18 09:45:00'),

('770e8400-e29b-41d4-a716-446655440019', 'Jackson', 'Moore', 'jackson.moore@uci.edu', '(949) 555-0119', 'Urban Studies', 2027,
  '{"q1": "I am interested in sustainable business practices and urban development.", "q2": "Analyzed smart city initiatives for research paper."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440016'],
  'reviewed', NULL, '[]', '2024-10-18 10:30:00'),

('770e8400-e29b-41d4-a716-446655440020', 'Ava', 'Martin', 'ava.martin@uci.edu', '(949) 555-0120', 'Business Information Management', 2025,
  '{"q1": "ICG will help me combine technology and business strategy skills.", "q2": "Implemented ERP system for student organization."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440017'],
  'reviewed', NULL, '[]', '2024-10-18 11:00:00');

-- Group 2: Interview Scheduled (15) - Already assigned to slots
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
('770e8400-e29b-41d4-a716-446655440021', 'Daniel', 'Jackson', 'daniel.jackson@uci.edu', '(949) 555-0121', 'Finance', 2026,
  '{"q1": "Looking to apply financial strategy to consulting projects.", "q2": "Built financial models for startup valuation."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440001',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Strong analytical skills", "created_at": "2024-10-19T10:00:00Z"}]',
  '2024-10-14 09:00:00'),

('770e8400-e29b-41d4-a716-446655440022', 'Grace', 'Lee', 'grace.lee@uci.edu', '(949) 555-0122', 'Economics', 2025,
  '{"q1": "Excited to work on real-world economic consulting problems.", "q2": "Published research on market dynamics."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440001',
  '[]', '2024-10-14 10:30:00'),

('770e8400-e29b-41d4-a716-446655440023', 'Ryan', 'Thomas', 'ryan.thomas@uci.edu', '(949) 555-0123', 'Computer Science', 2027,
  '{"q1": "Want to bridge tech and business consulting.", "q2": "Developed machine learning models for predictions."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440002',
  '[]', '2024-10-14 11:00:00'),

('770e8400-e29b-41d4-a716-446655440024', 'Hannah', 'Clark', 'hannah.clark@uci.edu', '(949) 555-0124', 'Marketing', 2026,
  '{"q1": "Passionate about strategic marketing and consulting.", "q2": "Led rebranding initiative for campus organization."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440002',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440002", "author_name": "Michael Rodriguez", "content": "Great presentation skills", "created_at": "2024-10-19T14:00:00Z"}]',
  '2024-10-14 13:30:00'),

('770e8400-e29b-41d4-a716-446655440025', 'Nathan', 'Hill', 'nathan.hill@uci.edu', '(949) 555-0125', 'Business Administration', 2025,
  '{"q1": "Eager to develop comprehensive business strategy skills.", "q2": "Won case competition with growth strategy proposal."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440007',
  '[]', '2024-10-13 08:00:00'),

('770e8400-e29b-41d4-a716-446655440026', 'Lily', 'Scott', 'lily.scott@uci.edu', '(949) 555-0126', 'Data Science', 2027,
  '{"q1": "Want to use data analytics in strategic consulting.", "q2": "Analyzed large datasets to identify business insights."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440007',
  '[]', '2024-10-13 09:15:00'),

('770e8400-e29b-41d4-a716-446655440027', 'Owen', 'Green', 'owen.green@uci.edu', '(949) 555-0127', 'Accounting', 2026,
  '{"q1": "Looking to combine accounting expertise with consulting.", "q2": "Completed tax analysis for small businesses."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440008'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440008',
  '[]', '2024-10-13 10:00:00'),

('770e8400-e29b-41d4-a716-446655440028', 'Chloe', 'Adams', 'chloe.adams@uci.edu', '(949) 555-0128', 'International Studies', 2025,
  '{"q1": "Interested in global business strategy.", "q2": "Studied abroad and analyzed international markets."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440013'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440013',
  '[]', '2024-10-13 11:45:00'),

('770e8400-e29b-41d4-a716-446655440029', 'Elijah', 'Baker', 'elijah.baker@uci.edu', '(949) 555-0129', 'Management', 2027,
  '{"q1": "Want to develop leadership and strategic consulting skills.", "q2": "Managed cross-functional team project."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440013'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440013',
  '[]', '2024-10-12 08:30:00'),

('770e8400-e29b-41d4-a716-446655440030', 'Zoe', 'Hall', 'zoe.hall@uci.edu', '(949) 555-0130', 'Psychology', 2026,
  '{"q1": "Fascinated by consumer behavior and decision-making.", "q2": "Conducted psychological research on purchasing patterns."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440014'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440014',
  '[]', '2024-10-12 09:00:00'),

('770e8400-e29b-41d4-a716-446655440031', 'Carter', 'Rivera', 'carter.rivera@uci.edu', '(949) 555-0131', 'Statistics', 2025,
  '{"q1": "Want to apply statistical methods to business problems.", "q2": "Performed A/B testing analysis for optimization."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440016'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440016',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440003", "author_name": "Emily Patel", "content": "Strong quantitative background", "created_at": "2024-10-20T09:00:00Z"}]',
  '2024-10-12 10:15:00'),

('770e8400-e29b-41d4-a716-446655440032', 'Aria', 'Campbell', 'aria.campbell@uci.edu', '(949) 555-0132', 'Informatics', 2027,
  '{"q1": "Excited about tech-enabled business solutions.", "q2": "Developed user interface for productivity app."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440016'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440016',
  '[]', '2024-10-12 11:00:00'),

('770e8400-e29b-41d4-a716-446655440033', 'Mason', 'Mitchell', 'mason.mitchell@uci.edu', '(949) 555-0133', 'Business Economics', 2026,
  '{"q1": "Want to merge economic theory with practical consulting.", "q2": "Analyzed pricing strategies for e-commerce business."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440017'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440017',
  '[]', '2024-10-11 08:00:00'),

('770e8400-e29b-41d4-a716-446655440034', 'Layla', 'Roberts', 'layla.roberts@uci.edu', '(949) 555-0134', 'Cognitive Science', 2025,
  '{"q1": "Interested in behavioral insights for business strategy.", "q2": "Researched cognitive biases in consumer choices."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440017'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440017',
  '[]', '2024-10-11 09:30:00'),

('770e8400-e29b-41d4-a716-446655440035', 'Logan', 'Turner', 'logan.turner@uci.edu', '(949) 555-0135', 'Political Science', 2027,
  '{"q1": "Want to apply policy analysis to corporate strategy.", "q2": "Analyzed regulatory impact on business operations."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440018'], 'interview_scheduled', '550e8400-e29b-41d4-a716-446655440018',
  '[]', '2024-10-11 10:00:00');

-- Group 3: Interview Completed (5)
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
('770e8400-e29b-41d4-a716-446655440036', 'Avery', 'Phillips', 'avery.phillips@uci.edu', '(949) 555-0136', 'Finance', 2026,
  '{"q1": "Want to work on financial consulting projects.", "q2": "Managed investment portfolio simulation."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440003'], 'interview_completed', '550e8400-e29b-41d4-a716-446655440003',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Excellent interview - strong fit", "created_at": "2024-10-21T15:00:00Z"}]',
  '2024-10-10 08:00:00'),

('770e8400-e29b-41d4-a716-446655440037', 'Harper', 'Evans', 'harper.evans@uci.edu', '(949) 555-0137', 'Marketing', 2025,
  '{"q1": "Passionate about brand strategy and consulting.", "q2": "Increased brand awareness through social campaigns."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440009'], 'interview_completed', '550e8400-e29b-41d4-a716-446655440009',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440002", "author_name": "Michael Rodriguez", "content": "Creative thinker with great ideas", "created_at": "2024-10-21T16:30:00Z"}]',
  '2024-10-10 09:00:00'),

('770e8400-e29b-41d4-a716-446655440038', 'Sebastian', 'Edwards', 'sebastian.edwards@uci.edu', '(949) 555-0138', 'Economics', 2027,
  '{"q1": "Want to apply economic principles to business challenges.", "q2": "Analyzed market structures for competition."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440015'], 'interview_completed', '550e8400-e29b-41d4-a716-446655440015',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440003", "author_name": "Emily Patel", "content": "Solid analytical skills", "created_at": "2024-10-22T10:00:00Z"}]',
  '2024-10-10 10:30:00'),

('770e8400-e29b-41d4-a716-446655440039', 'Scarlett', 'Collins', 'scarlett.collins@uci.edu', '(949) 555-0139', 'Data Science', 2026,
  '{"q1": "Excited to use data science in consulting.", "q2": "Built recommendation system using collaborative filtering."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440004'], 'interview_completed', '550e8400-e29b-41d4-a716-446655440004',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Technical skills are impressive", "created_at": "2024-10-22T11:30:00Z"}]',
  '2024-10-09 08:00:00'),

('770e8400-e29b-41d4-a716-446655440040', 'Wyatt', 'Stewart', 'wyatt.stewart@uci.edu', '(949) 555-0140', 'Business Administration', 2025,
  '{"q1": "Looking to build comprehensive consulting expertise.", "q2": "Led strategic planning for student organization."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440010'], 'interview_completed', '550e8400-e29b-41d4-a716-446655440010',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440002", "author_name": "Michael Rodriguez", "content": "Leadership potential is clear", "created_at": "2024-10-22T14:00:00Z"}]',
  '2024-10-09 09:15:00');

-- Group 4: Pending (5) - Just applied, not reviewed yet
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
('770e8400-e29b-41d4-a716-446655440041', 'Victoria', 'Morris', 'victoria.morris@uci.edu', '(949) 555-0141', 'Sociology', 2026,
  '{"q1": "Want to understand organizational culture through consulting.", "q2": "Researched workplace dynamics in tech companies."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013'],
  'pending', NULL, '[]', '2024-10-20 14:00:00'),

('770e8400-e29b-41d4-a716-446655440042', 'Grayson', 'Rogers', 'grayson.rogers@uci.edu', '(949) 555-0142', 'Computer Science', 2027,
  '{"q1": "Interested in tech consulting and digital transformation.", "q2": "Built full-stack web application from scratch."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008'],
  'pending', NULL, '[]', '2024-10-20 15:30:00'),

('770e8400-e29b-41d4-a716-446655440043', 'Addison', 'Reed', 'addison.reed@uci.edu', '(949) 555-0143', 'Urban Studies', 2025,
  '{"q1": "Passionate about sustainable urban development.", "q2": "Proposed urban planning solution for city council."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440016'],
  'pending', NULL, '[]', '2024-10-21 08:00:00'),

('770e8400-e29b-41d4-a716-446655440044', 'Eli', 'Cook', 'eli.cook@uci.edu', '(949) 555-0144', 'Statistics', 2026,
  '{"q1": "Want to leverage statistical analysis for insights.", "q2": "Applied Bayesian methods to forecast trends."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009'],
  'pending', NULL, '[]', '2024-10-21 10:00:00'),

('770e8400-e29b-41d4-a716-446655440045', 'Penelope', 'Morgan', 'penelope.morgan@uci.edu', '(949) 555-0145', 'Business Information Management', 2027,
  '{"q1": "Excited about combining tech and business strategy.", "q2": "Designed information system for inventory management."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440017'],
  'pending', NULL, '[]', '2024-10-21 11:30:00');

-- Group 5: Rejected (3) - Not a good fit
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
('770e8400-e29b-41d4-a716-446655440046', 'Nolan', 'Bell', 'nolan.bell@uci.edu', '(949) 555-0146', 'Art History', 2026,
  '{"q1": "Interested in arts consulting.", "q2": "Curated gallery exhibition."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440001'], 'rejected', NULL,
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Not aligned with consulting focus", "created_at": "2024-10-19T10:00:00Z"}]',
  '2024-10-08 09:00:00'),

('770e8400-e29b-41d4-a716-446655440047', 'Hazel', 'Murphy', 'hazel.murphy@uci.edu', '(949) 555-0147', 'Film Studies', 2025,
  '{"q1": "Want to work in entertainment consulting.", "q2": "Produced short documentary film."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440007'], 'rejected', NULL,
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440002", "author_name": "Michael Rodriguez", "content": "Experience doesnt match requirements", "created_at": "2024-10-19T11:00:00Z"}]',
  '2024-10-08 10:00:00'),

('770e8400-e29b-41d4-a716-446655440048', 'Lincoln', 'Bailey', 'lincoln.bailey@uci.edu', '(949) 555-0148', 'Music', 2027,
  '{"q1": "Interested in music industry business.", "q2": "Performed in multiple concerts."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440013'], 'rejected', NULL,
  '[]', '2024-10-08 11:00:00');

-- Group 6: Accepted (2) - Offered positions
INSERT INTO applicants (
  id, first_name, last_name, email, phone, major, graduation_year,
  frq_responses, available_slots, status, assigned_slot, notes, applied_date
) VALUES
('770e8400-e29b-41d4-a716-446655440049', 'Aurora', 'Cooper', 'aurora.cooper@uci.edu', '(949) 555-0149', 'Economics', 2025,
  '{"q1": "Passionate about strategic economic consulting.", "q2": "Published thesis on market economics."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440005'], 'accepted', '550e8400-e29b-41d4-a716-446655440005',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Outstanding candidate - top choice", "created_at": "2024-10-23T10:00:00Z"}, {"author_id": "660e8400-e29b-41d4-a716-446655440002", "author_name": "Michael Rodriguez", "content": "Offered position", "created_at": "2024-10-23T14:00:00Z"}]',
  '2024-10-07 08:00:00'),

('770e8400-e29b-41d4-a716-446655440050', 'Easton', 'Richardson', 'easton.richardson@uci.edu', '(949) 555-0150', 'Business Administration', 2026,
  '{"q1": "Want to build career in management consulting.", "q2": "Interned at Fortune 500 company strategy team."}',
  ARRAY['550e8400-e29b-41d4-a716-446655440011'], 'accepted', '550e8400-e29b-41d4-a716-446655440011',
  '[{"author_id": "660e8400-e29b-41d4-a716-446655440003", "author_name": "Emily Patel", "content": "Exceptional strategic thinking", "created_at": "2024-10-23T11:00:00Z"}, {"author_id": "660e8400-e29b-41d4-a716-446655440001", "author_name": "Sarah Chen", "content": "Offered position - accepted", "created_at": "2024-10-23T15:30:00Z"}]',
  '2024-10-07 09:00:00');

-- ============================================
-- SECTION 5: Verification Query
-- ============================================
-- Run this to verify your test data was inserted correctly

SELECT
  'Time Slots' as data_type,
  COUNT(*)::text as count,
  STRING_AGG(DISTINCT day_of_week, ', ') as details
FROM time_slots
WHERE is_active = true

UNION ALL

SELECT
  'Officers' as data_type,
  COUNT(*)::text as count,
  STRING_AGG(display_name, ', ') as details
FROM officers

UNION ALL

SELECT
  'Applicants - Total' as data_type,
  COUNT(*)::text as count,
  '' as details
FROM applicants

UNION ALL

SELECT
  'Applicants - ' || status as data_type,
  COUNT(*)::text as count,
  '' as details
FROM applicants
GROUP BY status
ORDER BY data_type;

-- ============================================
-- SUMMARY
-- ============================================
-- Time Slots: 18 (Mon-Thu, varied times)
-- Officers: 3 (+ existing admin = 4 total)
-- Applicants: 50 total
--   - Reviewed: 20 (ready for auto-assign)
--   - Interview Scheduled: 15 (already assigned)
--   - Interview Completed: 5 (finished interviews)
--   - Pending: 5 (just applied)
--   - Rejected: 3 (not a fit)
--   - Accepted: 2 (offered positions)
--
-- Notes:
-- - All emails follow UCI format: firstname.lastname@uci.edu
-- - Phone numbers use (949) 555-01XX format
-- - Graduation years: 2025-2027
-- - Majors are realistic UCI programs
-- - Availability is varied to test auto-assign flexibility algorithm
-- - Some applicants have notes from officers
-- - FRQ responses are realistic and varied
-- ============================================
