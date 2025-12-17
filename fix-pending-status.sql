-- ============================================
-- Fix Pending Status - Database Cleanup
-- ============================================
-- This script updates any applicants with the old 'pending' status
-- to use the correct 'applied' status value.
--
-- Run this in your Supabase SQL Editor AFTER deploying the code changes.

-- ============================================
-- STEP 1: Check for pending status applicants
-- ============================================
-- Run this first to see how many applicants need updating

SELECT
  COUNT(*) as pending_count,
  'applicants with pending status' as description
FROM applicants
WHERE status = 'pending';

-- ============================================
-- STEP 2: Preview the applicants that will be updated
-- ============================================
-- Review these records before updating

SELECT
  id,
  first_name,
  last_name,
  email,
  status,
  applied_date
FROM applicants
WHERE status = 'pending'
ORDER BY applied_date DESC;

-- ============================================
-- STEP 3: Update pending to applied
-- ============================================
-- This updates all 'pending' status to 'applied'

UPDATE applicants
SET
  status = 'applied',
  last_updated = NOW()
WHERE status = 'pending';

-- ============================================
-- STEP 4: Verify the update
-- ============================================
-- Confirm no more pending statuses exist

SELECT
  COUNT(*) as pending_count
FROM applicants
WHERE status = 'pending';

-- Should return 0 rows

-- ============================================
-- STEP 5: View updated status distribution
-- ============================================
-- Check the new status distribution

SELECT
  status,
  COUNT(*) as count
FROM applicants
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- Expected Results
-- ============================================
-- After running this script:
-- - All 'pending' applicants → 'applied'
-- - No 'pending' status should remain
-- - Status values should be: applied, interviewing, scheduled,
--   accepted, rejected, rejected_after_interview

-- ============================================
-- NOTES
-- ============================================
-- - This is a one-time cleanup script
-- - Safe to run multiple times (idempotent)
-- - The code changes prevent new 'pending' statuses from being created
-- - After this, all applicants will use valid status values
-- ============================================
