# Betul District Intelligence API Reference

Base URL: `http://localhost:4000/api/v1`

## Health & Analytics
- `GET /health` — Service health, Supabase config check, and Python AI service status
- `GET /analytics/overview` — Role-scoped KPI cards & 5-village pilot verification chart

## Authentication & Registration
- `POST /auth/register` — Register as `citizen`, `field`, or `government`. Government/field accounts start as `pending_verification` with `citizen` role until verified.
- `POST /auth/login` — Authenticate and receive Bearer token
- `GET /auth/me` — Return authenticated user profile

## District Administration (`district_admin` only)
- `GET /admin/users` — List registered users
- `PATCH /admin/users/:userId/verify` — Approve, reject, suspend, or revoke user; assign roles, departments, and villages
- `GET /admin/audit-logs` — Inspect security and activity audit trail

## Departments & Dynamic Forms
- `GET /departments` — List configurable departments (18 initial categories)
- `POST /departments` — Create new department (`district_admin` only; blocks duplicates)
- `GET /departments/:departmentId/schemas` — List versioned dynamic form schemas
- `POST /departments/:departmentId/schemas` — Create a new form schema version

## Five-Village Pilot
- `GET /villages?pilot=true` — List Betul pilot villages (citizens receive public directory only; officers receive verification progress)
- `PATCH /villages/:villageId/pilot-config` — Assign departments & coordinators (`district_admin` only)

## Data Collection & Verification (Officers & Field Only)
- `GET /records` — Scoped records filtered by assigned departments and villages (citizens receive `403`)
- `POST /records` — Submit village record validated against versioned schema & village/department scope
- `PATCH /records/:recordId/verify` — Approve, flag for correction, or reject record

## Citizen Schemes & Deterministic Eligibility
- `GET /schemes` — List active government schemes (inactive/expired schemes excluded for non-admins)
- `GET /schemes/profile` & `PUT /schemes/profile` — Save citizen profile and immediately evaluate eligible schemes
- `POST /schemes/check-eligibility` — Run deterministic rules engine with explainable matched/failed/missing reasons
- `GET /schemes/applications` & `POST /schemes/applications` — Submit & track preliminary applications

## Documents & OCR Review Queue
- `GET /documents` — List scoped uploaded documents
- `POST /documents/upload` — Upload file (max 15 MB), validate MIME/extension, detect SHA-256 duplicates, extract via Python FastAPI service, flag prompt injections, queue for human review
- `PATCH /documents/:docId/verify` — Officer approves or rejects extracted document

## AI & Voice Assistant
- `POST /assistant/query` — Role-scoped conversational query, ambiguity clarification, prompt-injection defense, and confirmation-gated department creation
- `POST /assistant/voice/normalize` — Normalize Hindi/English/Hinglish voice transcripts
