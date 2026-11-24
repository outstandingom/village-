# Supabase Database Setup & Migration Guide

## Target Project
- **Supabase URL:** `https://ufxlojhllrvbtcrgfxsn.supabase.co`

## Execution Order (Non-Destructive)

Execute the SQL files in `supabase/migrations/` in numerical order using either the **Supabase SQL Editor** or **Supabase CLI** (`supabase db push`):

1. `supabase/migrations/001_core_schema.sql` — Organizations, Districts, Blocks, Tehsils, Gram Panchayats, Villages (LGD codes), User Profiles, Roles & Permissions
2. `supabase/migrations/002_departments_and_pilot.sql` — Configurable Departments, Memberships, Village & Department Assignments
3. `supabase/migrations/003_dynamic_forms_and_records.sql` — Versioned Dynamic Form Schemas, Data Records, Verification History, and Verified-Overwrite Protection Trigger
4. `supabase/migrations/004_citizens_and_schemes.sql` — Isolated Citizen & Household Profiles, Government Scheme Catalogue, Structured Eligibility Rules, Applications
5. `supabase/migrations/005_documents_ai_and_audit.sql` — Documents, Extraction Review Queue, `pgvector` Knowledge Chunks, AI Conversations, Notifications, Audit Logs
6. `supabase/migrations/006_rls_and_storage_policies.sql` — Row Level Security (RLS) on every exposed table + private `district-documents` Storage bucket policies
7. `supabase/migrations/007_health_check_functions.sql` — `db_health_check()` and allowlisted parameterized analytics functions

## Optional Demonstration Seed

Run `supabase/seed/001_betul_demo_seed.sql` to initialize roles, Betul District (LGD `421`), 18 initial department categories, and 5 pilot villages (explicitly flagged `is_demo_data = TRUE`).

## Verify RLS Isolation

Run `supabase/tests/rls_isolation_tests.sql` in the SQL Editor. It asserts that zero tables in `public` lack Row Level Security.
