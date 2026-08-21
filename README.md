# نظام إدارة القافلة الطبية (Caravane Médicale)

Next.js 14 + SQLite (`better-sqlite3`) app for managing a one-day Red Crescent medical caravan: registration, medical triage/routing, and admin reporting — fully in Arabic with RTL layout, with Excel and PDF export.

## What's included

- **مكتب الاستقبال** (`/welcome`) — registration form (first name, last name, age, phone, address), auto-incrementing queue number starting at 1.
- **المكتب الطبي** (`/medical`) — lists patients awaiting routing, assigns each to a specialty (dropdown populated from Admin's list), which moves them into that specialty's live waiting list. Includes a "تم الكشف" (seen) button to mark a patient done.
- **لوحة التحكم** (`/admin`, password-gated) — add/edit/delete specialties; view and export all patients or filter by one specialty; export to **Excel (.xlsx)** and **PDF**, both rendering Arabic correctly (PDF export snapshots the actual rendered Arabic table, so there's no font-embedding issue).
- Data lives in a local SQLite file at `data/caravan.db` — zero external services, zero cost.

## Run it right now (local machine)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — the database file and default specialties (طب عام، طب أطفال، طب نساء وتوليد، طب أسنان، طب عيون، صيدلية) are created automatically on first run. Edit/delete/add specialties from `/admin` before the event starts.

Admin dashboard password defaults to `admin123`. To change it, copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_ADMIN_PASSWORD=your_password`, then restart the dev server.

## Running it tomorrow with multiple desks on one WiFi network (recommended)

Since this is a one-day event, the simplest zero-cost setup is: run the app on **one laptop** connected to the venue's WiFi, and have the other desks (reception, medical, admin) open it from their own phone/laptop browser pointed at that laptop's local IP address. Everyone shares the same live database.

1. On the host laptop:
   ```bash
   npm install
   npm run build
   npm run start
   ```
   (`npm run start` binds to `0.0.0.0` so it's reachable from other devices on the network.)
2. Find the host laptop's local IP address:
   - Windows: `ipconfig` → look for "IPv4 Address" (e.g. `192.168.1.23`)
3. On every other device (same WiFi), open a browser to:
   ```
   http://192.168.1.23:3000
   ```
4. Bookmark `/welcome`, `/medical`, and `/admin` on the respective desks' devices.

**Backup tip:** periodically copy `data/caravan.db` to a USB drive or cloud folder during the event as a safety backup.

## Free cloud deployment (optional, if you want it reachable outside the venue WiFi)

SQLite's local file won't persist on serverless platforms like Vercel (their filesystem resets on every deploy/cold start), so for a real cloud deployment you'd swap the DB layer for a free-tier hosted Postgres:

1. Create a free database at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Replace `lib/db.js`'s `better-sqlite3` calls with a Postgres client (e.g. `@neondatabase/serverless` or `pg`), keeping the same table shapes.
3. Deploy the repo to [Vercel](https://vercel.com) (free tier) — connect your GitHub repo, add the DB connection string as an environment variable, and it deploys in a couple of minutes.

Given the timeline (event is tomorrow), the **LAN setup above is the safer, faster path** — it requires no code changes, no external accounts, and no internet dependency at the venue (WiFi/hotspot without internet access still works, since devices only need to reach the host laptop, not the outside internet).

## Project structure

```
app/
  page.js              → home (links to the three desks)
  welcome/page.js       → مكتب الاستقبال (registration)
  medical/page.js        → المكتب الطبي (triage/routing)
  admin/page.js          → لوحة التحكم (specialties + reports/export)
  api/patients/           → REST endpoints for patients
  api/specialties/        → REST endpoints for specialties
lib/
  db.js                 → SQLite schema + connection (auto-seeds specialties)
  exportUtils.js        → Excel (SheetJS) + PDF (html2canvas+jsPDF) export helpers
data/
  caravan.db             → the SQLite database file (created on first run)
```

## Notes

- Next.js is pinned to `14.2.30` (latest patched 14.x). `npm audit` will still flag some advisories related to Server Actions/Middleware/Image Optimization — none of those features are used in this app (no `middleware.js`, no `next/image`, no Server Actions), so they don't apply to this deployment. Upgrading to Next 15/16 involves breaking API changes (async route params) not worth risking the night before the event.
- The admin password gate is a lightweight client-side check, not real authentication — fine for a trusted-staff one-day event, not for a public-internet deployment.
