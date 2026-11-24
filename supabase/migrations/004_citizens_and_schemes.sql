-- ============================================================================
-- Migration 004: Citizens, Households, Government Schemes & Applications
-- Keeps sensitive citizen PII isolated from public village aggregate data.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  household_code TEXT UNIQUE,
  head_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  housing_status TEXT CHECK (housing_status IN ('kutcha', 'semi_pucca', 'pucca', 'homeless')),
  annual_income_band TEXT CHECK (annual_income_band IN ('below_1L', '1L_to_2_5L', '2_5L_to_5L', 'above_5L')),
  bpl_card_holder BOOLEAN DEFAULT FALSE,
  landholding_acres NUMERIC(8, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  occupation TEXT,
  education_level TEXT,
  category TEXT CHECK (category IN ('general', 'sc', 'st', 'obc')),
  seeking_employment BOOLEAN DEFAULT FALSE,
  is_woman_head_of_household BOOLEAN DEFAULT FALSE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relation_to_head TEXT NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  occupation TEXT,
  education_level TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  department_category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('central', 'state', 'district')),
  summary_en TEXT NOT NULL,
  summary_hi TEXT NOT NULL DEFAULT '',
  benefit_details_en TEXT NOT NULL,
  benefit_details_hi TEXT NOT NULL DEFAULT '',
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  application_url TEXT,
  source_document TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  last_verified_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_active_category ON public.schemes(is_active, department_category);
CREATE INDEX IF NOT EXISTS idx_schemes_fts ON public.schemes USING GIN (
  to_tsvector('english', name_en || ' ' || summary_en || ' ' || department_category)
);

CREATE TABLE IF NOT EXISTS public.scheme_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('eq', 'neq', 'lte', 'gte', 'in', 'exists')),
  rule_value JSONB NOT NULL,
  label_en TEXT NOT NULL,
  label_hi TEXT NOT NULL DEFAULT '',
  is_exclusion BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scheme_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'application_submitted' CHECK (
    status IN ('application_submitted', 'under_review', 'application_approved', 'rejected', 'benefit_received')
  ),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
