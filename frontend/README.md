# JobPilot — Frontend

React + Vite + Tailwind CSS v4 frontend for JobPilot. **Phase 1 scaffold**: the whole UI runs
on an in-memory mock data layer, so no Firebase/Supabase/Cloudflare accounts or secrets are needed
to develop it.

## Run

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # production build to dist/
```

## How it's wired

- **All data goes through `src/services/api.js`.** It has a `USE_MOCKS = true` switch. Components
  never import mock files or call `fetch` directly, so wiring the real Cloudflare Worker API later
  is a one-file change (flip the switch, set `VITE_API_BASE_URL`, provide a token via
  `setTokenProvider`). Method signatures already mirror the backend API contracts.
- **Auth** (`src/features/auth/AuthContext.jsx`): uses **real Firebase** when the `VITE_FIREBASE_*`
  web config is present, and falls back to a mock signed-in dev user otherwise so the UI runs with
  no config. When mock data is active, a persistent "DEMO DATA" banner shows. New real-Firebase
  users are routed to `/onboarding` until it's completed; the data endpoints still use mocks until
  Milestone 7. Settings has a dev-only "preview admin" toggle.
- **Match scores** are computed by the deterministic rule in `src/utils/match.js` — the same rule
  the backend will use. Always labelled "Profile match", never a hiring probability.
- **Theme** (`src/app/ThemeProvider.jsx`): Light / Dark / System, persisted to `localStorage`.
  Tokens live in `src/styles/globals.css`.

## Structure

```
src/
  app/            App, router, ThemeProvider
  components/     layout, navigation, ui, forms, feedback, data-display, motion
  features/       auth, jobs (shared browser + detail views)
  pages/          public/, auth/, app/, admin/
  services/       api.js + mock/
  utils/          match, format, cn
  hooks/          useAsync, useReducedMotionPreference
```

## Not in this phase

Real Firebase auth, the Cloudflare Worker API, Supabase, R2 resume uploads, and provider job
collection are **deferred to phase 2**. Resume upload, data export, and account deletion are UI-only
placeholders here.
