-- ============================================
-- Email Templates Migration
-- ============================================
-- This migration updates the config table's email_templates structure
-- to support the new status flow with 4 distinct email templates

-- IMPORTANT: Run this in your Supabase SQL Editor
-- This will update the email_templates JSONB field to use the new structure

-- ============================================
-- UPDATE EMAIL TEMPLATES STRUCTURE
-- ============================================
-- The email_templates field should now have 4 keys:
-- - interview: For scheduled applicants (confirms interview time and location)
-- - rejected: For applicants rejected before interview stage
-- - rejected_after_interview: For applicants rejected after interviewing
-- - accepted: For accepted applicants (congratulations message)

UPDATE config
SET email_templates = jsonb_build_object(
  'interview',
  'Dear Applicant,

Congratulations! You have been selected for an interview with our club.

Interview Details:
Time: {{slot}}
Location: {{location}}

Please arrive 5 minutes early and bring a copy of your resume.

We look forward to meeting you!

Best regards,
The ICG Team',

  'rejected',
  'Dear Applicant,

Thank you for applying to Irvine Consulting Group. We appreciate the time and effort you put into your application.

After careful review, we regret to inform you that we will not be moving forward with your application at this time. We received an overwhelming number of qualified applicants, and unfortunately, we are unable to offer interviews to all candidates.

We encourage you to continue pursuing your interests in consulting and wish you the best in your future endeavors.

Best regards,
The ICG Team',

  'rejected_after_interview',
  'Dear Applicant,

Thank you for taking the time to interview with Irvine Consulting Group. We enjoyed learning more about you and your experiences.

After careful consideration, we have decided not to extend an offer at this time. We had many strong candidates and had to make difficult decisions.

We appreciate your interest in our organization and wish you success in your future endeavors.

Best regards,
The ICG Team',

  'accepted',
  'Dear Applicant,

Congratulations! We are thrilled to offer you a position with Irvine Consulting Group!

Your interview demonstrated your strong qualifications and passion for consulting, and we are excited to have you join our team.

Next Steps:
- You will receive an onboarding email with more details soon
- Our first general meeting is [DATE/TIME]
- Please confirm your acceptance by replying to this email

Welcome to ICG!

Best regards,
The ICG Team'
)
WHERE id = (SELECT id FROM config LIMIT 1);

-- ============================================
-- VERIFY THE UPDATE
-- ============================================
-- Run this query to verify the email templates were updated correctly:

SELECT
  id,
  cycle_name,
  email_templates->>'interview' as interview_template,
  email_templates->>'rejected' as rejected_template,
  email_templates->>'rejected_after_interview' as rejected_after_interview_template,
  email_templates->>'accepted' as accepted_template
FROM config;

-- ============================================
-- NOTES
-- ============================================
-- Template Variables:
-- - {{slot}}: Replaced with interview time slot (e.g., "Monday 2-3pm")
-- - {{location}}: Replaced with interview location (entered by user in Email view)
--
-- You can customize these templates in Supabase by directly editing the
-- email_templates JSONB field in the config table, or by creating a
-- settings UI in your application.
-- ============================================
