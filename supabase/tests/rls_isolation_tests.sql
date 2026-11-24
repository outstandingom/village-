-- ============================================================================
-- RLS Isolation Verification Script
-- Run in Supabase SQL Editor or psql to verify RLS is enabled on all tables.
-- ============================================================================

SELECT public.db_health_check();

-- Assert zero public tables lack RLS
DO $$
DECLARE
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = FALSE;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'SECURITY FAILURE: % public tables do not have RLS enabled', v_missing;
  END IF;
END $$;
