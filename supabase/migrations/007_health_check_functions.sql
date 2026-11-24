-- ============================================================================
-- Migration 007: Database Health Check & Parameterized AI Analytics Functions
-- AI tools invoke ONLY these predefined allowlisted functions (never raw SQL).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.db_health_check()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rls_disabled_count INTEGER;
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM pg_tables
  WHERE schemaname = 'public';

  SELECT COUNT(*) INTO v_rls_disabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = FALSE;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_rls_disabled_count = 0 THEN 'healthy' ELSE 'warning' END,
    'public_tables', v_table_count,
    'tables_without_rls', v_rls_disabled_count,
    'checked_at', NOW()
  );
END;
$$;

-- Parameterized pilot progress summary (respects caller scope)
CREATE OR REPLACE FUNCTION public.get_pilot_village_progress(p_department_code TEXT DEFAULT NULL)
RETURNS TABLE (
  village_id UUID,
  village_name_en TEXT,
  lgd_code TEXT,
  total_records BIGINT,
  verified_records BIGINT,
  pending_records BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id AS village_id,
    v.name_en AS village_name_en,
    v.lgd_code,
    COUNT(dr.id) AS total_records,
    COUNT(dr.id) FILTER (WHERE dr.status = 'verified') AS verified_records,
    COUNT(dr.id) FILTER (WHERE dr.status IN ('submitted', 'under_review', 'requires_correction')) AS pending_records
  FROM public.villages v
  LEFT JOIN public.data_records dr ON dr.village_id = v.id
  LEFT JOIN public.departments d ON d.id = dr.department_id
  WHERE v.is_pilot_village = TRUE
    AND (p_department_code IS NULL OR d.code = p_department_code)
  GROUP BY v.id, v.name_en, v.lgd_code
  ORDER BY v.name_en;
$$;
