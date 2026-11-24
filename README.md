# Betul District Intelligence & Citizen Benefit Platform

A unified, role-aware district governance, 5-village pilot management, and citizen scheme benefit platform for **Betul District, Madhya Pradesh, India**.

## Architecture

- **`apps/web`** — React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts + Leaflet + English/Hindi toggle
- **`apps/api`** — Node.js + Express + TypeScript + Zod + Helmet + Rate Limiting + RBAC/Village/Department isolation + Deterministic Scheme Eligibility Engine + Role-Aware AI Orchestrator
- **`apps/ai-services`** — Python FastAPI service for Hindi/English/Hinglish voice normalization, document extraction (CSV/TXT/PDF/DOCX/Images), SHA-256 deduplication, and prompt-injection screening
- **`packages/*`** — Shared TypeScript types (`@betul/shared-types`), Zod schemas (`@betul/validation`), and AI contracts (`@betul/ai-contracts`)
- **`supabase/`** — Non-destructive versioned PostgreSQL migrations (`001`–`007`), strict Row Level Security (RLS) on every exposed table, storage policies, demo seed data, and RLS verification script

## Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   python -m venv apps/ai-services/.venv
   apps/ai-services/.venv/Scripts/pip install -r apps/ai-services/requirements.txt
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` in `apps/api/` and `apps/web/` (do not commit `.env`).
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY` are safe in frontend code.
   - `SUPABASE_SECRET_KEY` must ONLY live in backend/Python `.env`.

3. **Build shared packages & start services:**
   ```bash
   npm run build:packages
   npm run dev:api          # Express API on http://localhost:4000
   npm run dev:web          # React UI on http://localhost:5173
   # Python AI service on http://localhost:8000:
   cd apps/ai-services && .venv/Scripts/uvicorn app.main:app --port 8000
   ```

4. **Run Automated Test Suites:**
   ```bash
   npm test
   cd apps/ai-services && .venv/Scripts/pytest
   ```

## Demonstration Accounts

Synthetic demonstration accounts are included for testing each role (clearly labelled as Demonstration Data in the UI):

| Role | Email | Password |
|---|---|---|
| District Admin | `collector.betul@demo.gov.in` | `BetulAdmin@2026` |
| Agriculture Officer | `agri.officer@demo.gov.in` | `BetulOfficer@2026` |
| Field Employee | `field.khedi@demo.gov.in` | `BetulField@2026` |
| Citizen (Farmer) | `ramesh.farmer@demo.in` | `BetulCitizen@2026` |

## Documentation

- [Database Setup & Supabase Migrations](docs/database/SETUP.md)
- [REST API Reference](docs/api/API.md)
- [Security & RLS Architecture](docs/security/SECURITY.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
