-- ============================================================================
-- Migration 003: Dynamic Versioned Form Schemas, Data Records & Verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  schema_key TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_hi TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, schema_key)
);

CREATE TABLE IF NOT EXISTS public.data_schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES public.data_schemas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  json_schema JSONB NOT NULL,
  fields_definition JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schema_id, version)
);

CREATE TABLE IF NOT EXISTS public.data_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE RESTRICT,
  schema_version_id UUID NOT NULL REFERENCES public.data_schema_versions(id) ON DELETE RESTRICT,
  submitted_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  source TEXT NOT NULL DEFAULT 'field_web' CHECK (
    source IN ('field_web', 'offline_sync', 'document_extraction', 'admin_entry')
  ),
  reference_date DATE NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'under_review', 'requires_correction', 'verified', 'rejected', 'archived')
  ),
  verifier_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  is_demo_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_records_dept_village ON public.data_records(department_id, village_id, status);
CREATE INDEX IF NOT EXISTS idx_data_records_submitted_by ON public.data_records(submitted_by);

CREATE TABLE IF NOT EXISTS public.record_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.data_records(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.record_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.data_records(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent silent overwrites of verified records without explicit version bump
CREATE OR REPLACE FUNCTION public.prevent_silent_verified_overwrite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'verified' AND NEW.payload IS DISTINCT FROM OLD.payload AND NEW.version <= OLD.version THEN
    RAISE EXCEPTION 'Cannot overwrite a verified record without incrementing version and re-verifying.';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_silent_verified_overwrite ON public.data_records;
CREATE TRIGGER trg_prevent_silent_verified_overwrite
BEFORE UPDATE ON public.data_records
FOR EACH ROW EXECUTE FUNCTION public.prevent_silent_verified_overwrite();
