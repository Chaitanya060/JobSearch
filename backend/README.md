# JobPilot API (Cloudflare Worker)

Backend gateway for JobPilot. The browser uses Firebase **only** for auth; all data and
file operations go through this Worker, which verifies the Firebase ID token, derives the
UID, and talks to Supabase + R2. **No secret ever goes in the frontend or in git.**

Status: **Milestone 1 + backbone.** Implemented: config safety, Firebase ID-token
verification (unit-tested), CORS, `/api/health`, `/api/me`, `/api/profile/me`,
`/api/preferences`, and the initial SQL schema. Other endpoints return `501` until later
milestones (onboarding, R2 resumes, jobs, admin). Nothing is "live" until you configure the
services below and test against them.

## Stack
Hono · jose (JWT/JWKS) · @supabase/supabase-js (server-side) · Zod · Wrangler.

## One-time setup
1. **Secrets (local):** `cp .dev.vars.example .dev.vars` and fill in your dev values:
   - `FIREBASE_PROJECT_ID` — from the Firebase console.
   - `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — Supabase project settings (server secret key).
   - `CORS_ORIGIN=http://localhost:5173`, `APP_ENV=development`.
   `.dev.vars` is gitignored — never commit it or paste secrets anywhere shared.
2. **Database:** open the Supabase SQL editor (dev project) and run
   `migrations/0001_initial_schema.sql`.
3. **R2:** create the private bucket `jobpilot-resumes-dev` (public access disabled). The
   binding `RESUME_BUCKET` is already declared in `wrangler.jsonc`.
4. **Firebase:** ensure `localhost` is in Firebase Authentication → Authorized domains, and
   Email/Password + Google providers are enabled.

## Run
```bash
npm install
npm test        # unit-tests the Firebase token verifier (no services needed)
npm run dev     # wrangler dev on http://localhost:8787
```
Smoke test (needs a real token for the authed routes):
```bash
curl http://localhost:8787/api/health
```

## Production secrets (later)
```bash
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put CORS_ORIGIN
```

## Security model
- UID always comes from the **verified** token, never the request body/query.
- Supabase secret key bypasses RLS, so every user query filters by that verified UID.
- RLS is enabled with no permissive policies: the anon key can't read user tables.

## Troubleshooting

**`wrangler dev` → `CreateDirectory: Access is denied; path = miniflare-email-store` (Windows).**
Windows Defender **Controlled Folder Access** protects `Desktop`/`Documents`/`OneDrive`, so the
local `workerd` runtime can't create its state dir when the project lives there. Fixes, any one:
1. `npx wrangler login` then `npx wrangler dev --remote` — runs the Worker on Cloudflare's edge
   (still at `localhost:8787`), avoiding local `workerd` entirely.
2. Allow `workerd.exe` through Controlled Folder Access (Windows Security → Ransomware protection),
   or toggle that setting off, then `npx wrangler dev`.
3. Move the repo off Desktop/OneDrive (e.g. `C:\dev\JobSearch`), reinstall, and run normally.
