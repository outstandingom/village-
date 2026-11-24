# Deployment Instructions

## 1. Database (Supabase)
Apply `supabase/migrations/001` through `007` in the Supabase SQL Editor or via `supabase db push`, then run `supabase/tests/rls_isolation_tests.sql` to verify RLS health.

## 2. Backend API (`apps/api`)
- Build: `npm run build:packages && npm run build --workspace=@betul/api`
- Run: `node apps/api/dist/index.js`
- Required environment variables: `PORT`, `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET`, `AI_SERVICE_URL`.

## 3. Python AI & Document Service (`apps/ai-services`)
- Install: `pip install -r requirements.txt`
- Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Configure `TRANSCRIPTION_PROVIDER` and API keys when enabling cloud speech-to-text (e.g., `gpt-transcribe`).

## 4. Frontend (`apps/web`)
- Build: `npm run build --workspace=@betul/web`
- Deploy static `apps/web/dist/` to Cloudflare Pages, Vercel, Netlify, or government NIC hosting.
- Required environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.

## Features Requiring Government Approval / External API Access
- Official LGD / Census / SECC live data import (currently clearly marked as Demonstration Data)
- Aadhaar eKYC / Samagra ID / DigiLocker / PM-KISAN / PMAY-G live portal integrations
- Official NIC / MP State SSL certificates and production SMS OTP gateway
