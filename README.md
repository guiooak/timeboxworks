# Timebox Works ⏳

> Improve your meeting time with focus only on what matters.

A tool for running **timeboxed meetings**: set up an event (name, start/end time,
weighted goals, description), run a live dashboard (countdown + burndown chart +
goal decision collector + side‑topic parking lot), then get a shareable report.
A React rewrite of the original Vue app, with Google sign‑in and Firebase
Realtime Database persistence (including a per‑user history of past meetings).

## Stack

- **React 19 + Vite + TypeScript**
- **Yarn 4** (Corepack‑pinned) with supply‑chain hardening
- **date-fns** (dates), **Recharts** (burndown chart), **Zustand** (state),
  **React Router** (routing) — all hidden behind `src/common/services/*`
- **Firebase** Auth (Google) + Realtime Database
- Plain CSS via **CSS Modules**; design tokens in `src/common/tokens/`

## Architecture

Two layers, with a build‑time boundary between them:

- **`src/common/`** — app‑agnostic foundation.
  - `components/` — the hand‑built internal component library (layout, forms,
    overlay/dialogs, time, datepicker, chart surface, …).
  - `services/<lib>/` — one folder per wrapped external library, each exposing
    **our own interface**. A feature imports `common/services/datetime`, never
    `date-fns`.
  - `tokens/` — design‑system CSS custom properties.
- **`src/features/`** + **`src/app/`** — the Timebox Works application, depending
  only on `common/`.

**Enforcement:** ESLint `no-restricted-imports` bans every wrapped library
(`date-fns`, `firebase`, `recharts`, `zustand`, `react-router*`) across `src/**`,
re‑enabling each one only inside the folder that owns it. A feature that imports a
library directly fails `yarn lint`.

## Getting started

```bash
corepack enable          # use the repo-pinned Yarn 4
yarn install
cp .env.example .env.local   # fill in your Firebase web config
yarn dev
```

### Firebase setup

1. Create a Firebase project; enable **Google** as an Authentication provider and
   create a **Realtime Database**.
2. Put the web app config into `.env.local` (`VITE_FIREBASE_*`).
3. Deploy the database rules from `database.rules.json` (restrict each user to
   `users/$uid`): `firebase deploy --only database`.

## Scripts

| Script | Purpose |
| --- | --- |
| `yarn dev` | Start the dev server |
| `yarn build` | Type‑check (`tsc -b`) and build for production |
| `yarn preview` | Preview the production build |
| `yarn lint` | ESLint (incl. the import‑boundary rules) |
| `yarn typecheck` | `tsc -b` only |
| `yarn test` / `yarn test:coverage` | Vitest |
| `yarn format` / `yarn format:check` | Prettier |

## Supply‑chain hardening

`.yarnrc.yml` keeps install scripts disabled by default (`enableScripts: false`)
so a compromised dependency can't run code at install time, and refuses npm
versions published less than three days ago (`npmMinimalAgeGate: "3d"`). The exact
Yarn release is pinned in‑repo (`yarnPath`).

## CI / Deploy

- **`.github/workflows/ci.yml`** — lint, typecheck, test (+ coverage to Codecov),
  format check, and build, on every push/PR to `main`.
- **`.github/workflows/deploy.yml`** — builds and deploys to **Firebase Hosting**
  (live channel on `main`, preview channel on PRs). Requires repo secrets:
  `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, and the `VITE_FIREBASE_*`
  build vars.

## Not included yet

PWA support and the full unit/integration test suite are planned as a follow‑up
(see `.ai/plans/2026-06-03-02-timebox-works-pwa-and-tests.md`).
