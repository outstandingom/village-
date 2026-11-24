-- ============================================================================
-- Migration 006: Row Level Security (RLS) & Storage Policies
-- Enforces least-privilege isolation across citizens, field workers,
-- department officers, and verified district administrators.
-- ============================================================================

-- Helper functions (SECURITY DEFINER with restricted search_path)
CREATE OR REPLACE FUNCTION public.is_verified_district_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.id AND ur.is_active = TRUE
    JOIN public.roles r ON r.id = ur.role_id
    WHERE up.id = p_user_id
      AND up.verification_status = 'approved'
      AND r.code = 'district_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_department_access(p_user_id UUID, p_department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_verified_district_admin(p_user_id)
  OR EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.department_memberships dm ON dm.user_id = up.id AND dm.is_active = TRUE
    WHERE up.id = p_user_id
      AND up.verification_status = 'approved'
      AND dm.department_id = p_department_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_village_access(p_user_id UUID, p_village_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_verified_district_admin(p_user_id)
  OR EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.village_assignments va ON va.user_id = up.id AND va.is_active = TRUE
    WHERE up.id = p_user_id
      AND up.verification_status = 'approved'
      AND va.village_id = p_village_id
  );
$$;

-- Enable RLS on ALL exposed tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tehsils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gram_panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read-only directory policies (non-sensitive reference tables)
CREATE POLICY "public_read_districts" ON public.districts FOR SELECT USING (TRUE);
CREATE POLICY "public_read_villages" ON public.villages FOR SELECT USING (TRUE);
CREATE POLICY "public_read_active_schemes" ON public.schemes FOR SELECT USING (is_active = TRUE OR public.is_verified_district_admin(auth.uid()));
CREATE POLICY "public_read_scheme_rules" ON public.scheme_eligibility_rules FOR SELECT USING (TRUE);
CREATE POLICY "public_read_departments" ON public.departments FOR SELECT USING (is_active = TRUE OR public.is_verified_district_admin(auth.uid()));

-- User profiles: own profile or verified district admin
CREATE POLICY "user_profiles_select_self_or_admin" ON public.user_profiles
  FOR SELECT USING (id = auth.uid() OR public.is_verified_district_admin(auth.uid()));

CREATE POLICY "user_profiles_update_self" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND verification_status = (SELECT verification_status FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "user_profiles_admin_manage" ON public.user_profiles
  FOR ALL USING (public.is_verified_district_admin(auth.uid()));

-- Departments: only verified district admin can create/update
CREATE POLICY "departments_admin_write" ON public.departments
  FOR ALL USING (public.is_verified_district_admin(auth.uid()));

-- Data records: strict department + village isolation (citizens have ZERO access)
CREATE POLICY "data_records_scoped_select" ON public.data_records
  FOR SELECT USING (
    public.is_verified_district_admin(auth.uid())
    OR (
      public.has_department_access(auth.uid(), department_id)
      AND public.has_village_access(auth.uid(), village_id)
    )
  );

CREATE POLICY "data_records_scoped_insert" ON public.data_records
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()
    AND (
      public.is_verified_district_admin(auth.uid())
      OR (
        public.has_department_access(auth.uid(), department_id)
        AND public.has_village_access(auth.uid(), village_id)
      )
    )
  );

-- Citizen profiles & Households: strictly owner or verified district admin
CREATE POLICY "citizen_profiles_owner_only" ON public.citizen_profiles
  FOR ALL USING (user_id = auth.uid() OR public.is_verified_district_admin(auth.uid()));

CREATE POLICY "households_owner_or_admin" ON public.households
  FOR ALL USING (head_user_id = auth.uid() OR public.is_verified_district_admin(auth.uid()));

CREATE POLICY "household_members_owner_or_admin" ON public.household_members
  FOR ALL USING (
    public.is_verified_district_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.head_user_id = auth.uid()
    )
  );

-- Dynamic form schemas: readable by verified department members & admin, writable by officers/admin
CREATE POLICY "data_schemas_dept_access" ON public.data_schemas
  FOR SELECT USING (public.has_department_access(auth.uid(), department_id));

CREATE POLICY "data_schemas_admin_write" ON public.data_schemas
  FOR ALL USING (public.is_verified_district_admin(auth.uid()));

CREATE POLICY "data_schema_versions_dept_access" ON public.data_schema_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.data_schemas ds
      WHERE ds.id = data_schema_versions.schema_id
        AND public.has_department_access(auth.uid(), ds.department_id)
    )
  );

CREATE POLICY "data_schema_versions_admin_write" ON public.data_schema_versions
  FOR ALL USING (public.is_verified_district_admin(auth.uid()));

-- Record verifications & history: readable by scoped department/village staff or admin
CREATE POLICY "record_verifications_scoped_select" ON public.record_verifications
  FOR SELECT USING (
    public.is_verified_district_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.data_records dr
      WHERE dr.id = record_verifications.record_id
        AND public.has_department_access(auth.uid(), dr.department_id)
        AND public.has_village_access(auth.uid(), dr.village_id)
    )
  );

CREATE POLICY "record_history_scoped_select" ON public.record_history
  FOR SELECT USING (
    public.is_verified_district_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.data_records dr
      WHERE dr.id = record_history.record_id
        AND public.has_department_access(auth.uid(), dr.department_id)
        AND public.has_village_access(auth.uid(), dr.village_id)
    )
  );

-- Public scheme knowledge chunks readable by authenticated users; admin manages
CREATE POLICY "knowledge_chunks_authenticated_read" ON public.knowledge_chunks
  FOR SELECT TO authenticated USING (scheme_id IS NOT NULL OR public.is_verified_district_admin(auth.uid()));

CREATE POLICY "knowledge_chunks_admin_write" ON public.knowledge_chunks
  FOR ALL USING (public.is_verified_district_admin(auth.uid()));

CREATE POLICY "scheme_applications_owner_or_admin" ON public.scheme_applications
  FOR ALL USING (citizen_user_id = auth.uid() OR public.is_verified_district_admin(auth.uid()));

-- Documents: uploader, assigned department officer, or verified district admin
CREATE POLICY "documents_scoped_select" ON public.documents
  FOR SELECT USING (
    uploaded_by = auth.uid()
    OR public.is_verified_district_admin(auth.uid())
    OR (department_id IS NOT NULL AND public.has_department_access(auth.uid(), department_id))
  );

-- AI Conversations: strictly private to each user
CREATE POLICY "ai_conversations_owner_only" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "ai_messages_owner_only" ON public.ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- Notifications: strictly private to each user
CREATE POLICY "notifications_owner_only" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: read-only for verified district admins; inserts via server
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT USING (public.is_verified_district_admin(auth.uid()));

-- Storage bucket for secure documents (private bucket, signed URLs required)
INSERT INTO storage.buckets (id, name, public)
VALUES ('district-documents', 'district-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_docs_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'district-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_docs_owner_or_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'district-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_verified_district_admin(auth.uid())
    )
  );
