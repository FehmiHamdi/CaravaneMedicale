# نظام إدارة القافلة الطبية (Caravane Médicale)

Next.js 14 + PostgreSQL (Supabase) app for managing a Red Crescent medical caravan: registration, medical triage/routing (including multi-specialty routing), and admin reporting — fully in Arabic with RTL layout, with Excel and PDF export.

## What's included

- **مكتب الاستقبال** (`/welcome`) — registration form (first name, last name, age, phone, address), auto-incrementing **رقم التسجيل** (registration number) starting at 1.
- **المكتب الطبي** (`/medical`) — lists every patient with their current specialty assignments, lets staff route a patient to one or more specialties (each assignment gets its own independent, per-specialty sequence number), and shows a live waiting list per specialty with that specialty-specific number (**الرقم في التخصص**).
- **لوحة التحكم** (`/admin`, password-gated) — add/edit/delete specialties; view and export all patients (with their full list of assigned specialties) or filter by one specialty (showing that specialty's own queue order); export to **Excel (.xlsx)** and **PDF**, both rendering Arabic correctly.
- Data lives in a PostgreSQL database (Supabase free tier) — no local files, works from any device/desk with internet access.

## Data model

- `patients` — one row per registered person. `registration_number` is assigned atomically via a Postgres sequence.
- `specialties` — admin-managed list.
- `patient_specialties` — join table: one row per (patient, specialty) assignment, carrying `specialty_queue_number` (that specialty's own independent counter, starting at 1). A patient can have any number of rows here, i.e. be assigned to multiple specialties at once. Assigning the same patient to the same specialty twice is rejected (409).

Schema is created automatically on first request (`CREATE TABLE IF NOT EXISTS ...` + specialty seed) — no separate migration step needed.

## Set up Supabase (a few minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, go to **Settings → Database → Connection string → Transaction pooler** and copy the URI (port `6543`). This pooled connection string is what makes the app work correctly on serverless hosts like Vercel — using the direct connection (port 5432) instead will exhaust Postgres's connection limit under concurrent traffic.
3. Copy `.env.local.example` to `.env.local` and set:
   ```
   DATABASE_URL=postgresql://postgres.xxxxxxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres
   NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
   ```

## Run it locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Tables and the default specialty list (طب عام، طب أطفال، طب نساء وتوليد، طب أسنان، طب عيون، صيدلية) are created automatically on first request.

## Deploy for free (Vercel)

Because the database is now Supabase (cloud), every desk can just open the deployed URL from any device with internet — no more "host it on one laptop" workaround needed.

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com) (free tier).
3. Add the two environment variables from `.env.local` (`DATABASE_URL`, `NEXT_PUBLIC_ADMIN_PASSWORD`) in the Vercel project settings.
4. Deploy — takes a couple of minutes. Share the resulting URL with all three desks.

## Project structure

```
app/
  page.js                          → home (links to the three desks)
  welcome/page.js                  → مكتب الاستقبال (registration)
  medical/page.js                  → المكتب الطبي (multi-specialty routing)
  admin/page.js                    → لوحة التحكم (specialties + reports/export)
  api/patients/                    → list/create patients
  api/patients/[id]/specialties/   → assign a patient to a specialty (race-safe counter)
  api/specialties/                 → specialty CRUD
lib/
  db.js                            → pg Pool + schema bootstrap (Supabase-ready)
  exportUtils.js                   → Excel (SheetJS) + PDF (html2canvas+jsPDF) export helpers
```

## Notes

- Next.js is pinned to `14.2.30` (latest patched 14.x). `npm audit` still flags advisories tied to Server Actions/Middleware/Image Optimization — none of those features are used here (no `middleware.js`, no `next/image`, no Server Actions).
- The admin password gate is a lightweight client-side check, not real authentication — fine for trusted staff, not for a public-internet deployment that needs to keep out strangers.
- The specialty-assignment endpoint uses a row lock (`SELECT ... FOR UPDATE` on the target specialty) inside a transaction so concurrent assignments from different desks never collide on the same queue number — verified under concurrent load during development.
