# Security & Authorization Architecture

1. **Zero Self-Granted Privileges:** Selecting `government` or `field` during registration never grants administrative roles. Accounts remain `pending_verification` until explicitly approved by a verified `district_admin`.
2. **Row Level Security (RLS):** Every exposed PostgreSQL table has RLS enabled (`006_rls_and_storage_policies.sql`). Verified via `supabase/tests/rls_isolation_tests.sql`.
3. **Strict Multi-Axis Isolation:**
   - Citizens cannot read or write internal administrative records (`403 Forbidden`).
   - Field employees cannot submit or view records for unassigned villages.
   - Department officers cannot verify records belonging to another department.
4. **AI Safety & Prompt-Injection Defense:**
   - AI never executes raw user-generated SQL; it uses predefined, role-scoped functions only.
   - Prompt-injection patterns in chat messages and uploaded documents are detected, flagged, and logged in `audit_logs`.
   - Administrative actions (e.g., creating a department via voice/text) require an explicit preview + short-lived confirmation token bound to the verified `district_admin`.
5. **Document & OCR Safety:**
   - Strict extension/MIME allowlist and 15 MB upload limit.
   - SHA-256 deduplication prevents duplicate uploads.
   - OCR output is never auto-written into official records; it remains in `pending_review` until an authorized officer approves it.
6. **Secret Hygiene:**
   - Only `VITE_SUPABASE_PUBLISHABLE_KEY` is used in the browser.
   - `SUPABASE_SECRET_KEY` is strictly server-side and excluded from git via `.gitignore`.
