# Timebox Works — React Rewrite Plan

## Context

Timebox Works is a tool for running **timeboxed meetings**: you set up an event (name, start/end time, weighted goals, description), run a live dashboard (countdown + burndown chart + goal "decision collector" + side-topic parking lot), then get a shareable report. The legacy app (`guiooak/timeboxworks-legacy`) is a Vue 2 + Webpack 4 SPA/PWA with Vuex, vue-router, an in-house ~40-component UI library (`src/library`), and `localStorage` persistence of a single "current meeting".

This rewrite reimplements the app **from scratch in React** with these deliberate changes requested by the user:
1. **React 19 + Vite + TypeScript**, latest versions of everything.
2. **All atomic UI components hand-built from scratch** into the `common/components/` internal library (no Material UI / Chakra / etc.). Exception agreed: the burndown chart uses **Recharts**.
3. **Google login required**, with all data stored in **Firebase Realtime Database**, keeping a **per-user history of past meetings** (legacy only kept the single current meeting).
4. Styling may be **modernized** (keep the spirit/branding, refresh the look).

The legacy code is the behavioral spec; below is the full feature map so the rewrite preserves behavior.

**Scope split — two plan files.** This plan (file 1) covers the React rewrite and CI/CD. Two efforts are deliberately **deferred to a second plan file** (`.ai/plans/2026-06-03-02-timebox-works-pwa-and-tests.md`): the **PWA** (manifest, service worker, offline) and the **test specs** (unit + integration tests). This plan only sets up the test *tooling* (Vitest config + a smoke test to keep CI green); the actual suites live in plan 2.

---

## Legacy Feature Map (behavior to preserve)

### Data model — a "meeting"
```
{ name, description,
  expectedStartTime, expectedEndTime,   // ISO strings
  realStartTime, realEndTime,           // ISO strings ('' until started/finished)
  goals:      [{ id, name, weight, finishedAt, decisions }],
  sideTopics: [{ id, value }] }
```
A meeting is **active** when `realStartTime` is set, **finished** when `realEndTime` is set.

### Flow 1 — Meeting Form (`/meeting/form`, default route)
- Fields: name (required), start time + end time (datetime pickers, default = now and now+1h), a dynamic **goals list** (add/remove rows, each goal optionally weighted), description (auto-growing textarea).
- Cross-field validation: start must be before end (`timeGapCustomValidation`), re-validated on either change.
- "Total weight" line appears once any goal has a weight; on submit, goals left blank get weight `1` (`fillWeightValuesWhenSomeIsFilled`).
- On mount: rehydrate from current meeting; **if a meeting is already active, jump straight to the dashboard**.
- Submit → save meeting → go to dashboard. Reset → confirm dialog → clear meeting.

### Flow 2 — Meeting Dashboard (`/meeting/dashboard`)
- Guards on mount: no name → alert + back to form; already finished → alert + go to report; not yet active → "Are you ready to start?" confirm modal (No → back to form).
- **TimeCountdown** (large): ticks every minute, shows "time left" / "overdue time", theme goes primary→danger when overdue, shows target end time; disabled until meeting active.
- **BurndownChart**: Y = remaining total goal weight, X = event time interval (10 segments). Three datasets — Tendency (straight reference line total→0), Your Progress (steps down as goals are completed at their `finishedAt`), and Projection (green, only while active; extrapolates next finish from avg remaining weight, refreshes each minute). Info button opens an explanatory dialog.
- **TheGoalsDecisionCollector**: collapsible list of goals; each has a "Done" checkbox and a Notes textarea (`decisions`). Checking sets `finishedAt`; in **Automatic** mode it auto-closes the done goal and opens/focuses the next unchecked one. "Open all / Close all" toggle. When all goals are done → "finish this event?" confirm. Automatic on/off persists to local setup storage.
- **Side Topics / parking lot**: add post-it notes (id+value); blur-empty auto-deletes; delete non-empty asks confirm. Layout moves between columns based on a 700px width breakpoint.
- Footer: Cancel (confirm → clear realStartTime → back to form) / Go back / Finish (set realEndTime → report).

### Flow 3 — Meeting Report (`/meeting/report`)
- Guards: no name → form; not finished → dashboard (via alert+redirect).
- Header: title + when it happened (same-day vs multi-day formatting) + description.
- Goals section (with decisions/finish times), Side Topics (if any), Performance = the burndown chart with all tooltips shown, and a **time-cards grid** comparing expected vs real start/end.
- Footer: Back to dashboard (clears realEndTime) / Start new (confirm → clear) / **Copy report to clipboard** → opens `TemplatePreviewModal` rendering a formatted report incl. a **base64 PNG of the chart** (`getChartImageSrc`, canvasService).

### Cross-cutting services
- `timeService` (Moment): factory, format, ISO, `getNow`, `getDiffOf`, `Duration`, `isSameDay`. → **rewrite on date-fns** (`differenceInMilliseconds`, `intervalToDuration`/`formatDuration`, `isSameDay`, `formatISO`/`parseISO`).
- `timeDisplayFeedbackRules`: maps a time diff to {message, theme} bands (very late / late / a little late / on target / advanced). Used for report time cards.
- `meetingValidator`: shape/type validation before persisting. → replace with **TypeScript types + a small validator (zod)**.
- `uidGenerator`: unique ids. → `crypto.randomUUID()`.
- `BrowserStorage` plugin + Vuex store: persistence + a deep watcher syncing the current meeting. → **replaced by Zustand + Firebase RTDB** (see below).
- `formHelpers`, `domService`, `canvasService`: form utilities, DOM helpers, chart→image.

---

## Target Architecture

**Core principle — dependency inversion via a `common/` layer.** Feature code must never import an external library directly. Every external library lives behind an abstraction in `common/` so it can be swapped by touching one folder:
- `common/components/` — the from-scratch, app-agnostic internal component library.
- `common/services/<name>/` — one folder per wrapped library, each exposing **our own interface + types** through its `index.ts`, with the library used only inside the implementation. Features import from `common/services/datetime`, never from `date-fns`.

Abstractions to build: **datetime → date-fns**, **auth + database → Firebase**, **chart → Recharts**, **state → Zustand**, **router → React Router**, plus small internal services (`uid`).

- **React 19 + Vite + TypeScript** (latest of all deps).
- **`common/services/router`** wraps React Router: route definitions, a `navigate` API, and a guarded layout that redirects unauthenticated users to `/login`. Routes: `/login`, `/meeting/form`, `/meeting/dashboard`, `/meeting/report`, `/meetings` (history). Features call our navigation API, not React Router hooks directly.
- **`common/services/state`** wraps Zustand: a `createStore` factory + selector helpers so feature stores don't import Zustand. Feature stores built on it:
  - `authStore` — user, status, `signInWithGoogle`, `signOut` (uses `common/services/auth`).
  - `meetingStore` — mirrors the legacy Vuex contract: `currentMeeting` + actions `updateCurrentMeeting`, `cleanCurrentMeeting`, `setRealStartTime`, `setRealEndTime`, plus `decisionsAutomaticBehavior`. Writes flow through the meeting repository (→ `common/services/database`).
- **`common/services/datetime`** wraps **date-fns** (tree-shakeable pure functions over native `Date`; `intervalToDuration`/`formatDuration` power the countdown, plus `isSameDay`, `formatISO`/`parseISO`). Exposes the legacy `timeService` surface (format, ISO, now, diff, duration, isSameDay) as our own API.
- **`common/services/auth`** + **`common/services/database`** wrap **Firebase** Auth (Google sign-in) and Realtime Database (generic, typed read/write/subscribe). The meeting repository is built on top of `database`.
- **`common/services/chart`** wraps **Recharts** into agnostic chart primitives; the generic `Chart` component (`common/components/chart`) consumes it. The domain-aware `BurndownChart` (knows about goals/projection) lives in the meeting feature and is composed from these primitives.
- **Styling**: **plain CSS only — no preprocessor (no SCSS/Sass/Less).** Component styles use **CSS Modules** (`ComponentName.module.css`, plain CSS syntax, scoped by Vite at build, imported as `styles.foo`). Design-system tokens are concentrated in **`src/common/tokens/`** as CSS custom properties (ported from legacy `_colors`/`_parameters` — colors, spacing, radius, typography), imported globally once; `src/styles/base.css` holds resets/globals. Modernize the visual style (spacing, radius, subtle shadows, refreshed palette) while preserving the Timebox Works logo/branding assets.

### Firebase (Auth + Realtime Database)
- Firebase Web SDK v10+ initialized inside `common/services/database` using `VITE_FIREBASE_*` env vars (`.env.local`, plus `.env.example` committed). User must create a Firebase project, enable **Google** as a sign-in provider, and enable **Realtime Database**.
- **Auth**: `GoogleAuthProvider` + `signInWithPopup`; `onAuthStateChanged` feeds `authStore`. App is gated — unauthenticated → `/login`.
- **RTDB data model** (per-user, with history):
  ```
  users/{uid}/
    currentMeetingId: string | null
    settings/decisionsAutomaticBehavior: boolean
    meetings/{meetingId}/
      name, description,
      expectedStartTime, expectedEndTime, realStartTime, realEndTime,
      goals: { ... }, sideTopics: { ... },
      createdAt, updatedAt, status: 'draft'|'active'|'finished'
  ```
  - The meeting repository wraps reads/writes (`ref`, `set`, `update`, `onValue`, `push`). The current meeting is `users/{uid}/meetings/{currentMeetingId}`; finishing a meeting flips `status` to `finished` and clears `currentMeetingId` while leaving it in `meetings` as **history**.
  - History is the `meetings` list filtered to `status: 'finished'` — surfaced in a "My meetings" view, with two actions per meeting:
    - **Reopen**: set it as the current meeting (`currentMeetingId` → its id) and route to its report (finished) or dashboard; flipping `status` back to `active` and clearing `realEndTime` resumes it live. Guarded by a confirm dialog when another meeting is already active.
    - **Clone**: deep-copy its setup (name+" (copy)", description, goals with **new ids** and cleared `finishedAt`/`decisions`, side topics) into a **new draft** meeting (fresh `meetingId`, reset `real*` times, shifted expected times to now/now+duration) and open the form prefilled. The repository exposes `reopenMeeting(id)` and `cloneMeeting(id)`.
  - RTDB security rules restricting each user to `users/$uid` are a deliverable (`database.rules.json`).
- Arrays (`goals`, `sideTopics`) are stored as keyed objects in RTDB and converted to/from ordered arrays in the repository layer.

---

## Project Structure

Two layers: **`common/`** (app-agnostic — internal component library + library abstractions) and **`features/`** + **`app/`** (the Timebox Works application, depending only on `common/`).

```
/
├─ index.html
├─ vite.config.ts  tsconfig.json  eslint.config.js  .env.example  database.rules.json
└─ src/
   ├─ main.tsx
   ├─ app/                      ← app shell; depends only on common/ + features/
   │  ├─ App.tsx               (AppHeader/AppFooter, router outlet)
   │  └─ routes.tsx            (route table fed to common/services/router)
   ├─ styles/base.css           (resets / global styles — plain CSS)
   ├─ assets/                   (logos/icons copied from legacy)
   │
   ├─ common/
   │  ├─ tokens/                ← design-system tokens as CSS custom properties
   │  │                          (colors.css, spacing.css, typography.css, radius.css → index.css)
   │  ├─ components/            ← internal, agnostic component library (from scratch)
   │  │  ├─ index.ts
   │  │  ├─ layout/      Container, Row, Col, Page, Box, Card, Divider, Header, Footer
   │  │  ├─ typography/  Heading, Paragraph, Article, Label, Anchor
   │  │  ├─ form/        Form (+context), FormField, FormInput, FormTextarea,
   │  │  │               FormDatetimePicker, FormInputsList, FormSubmitButton,
   │  │  │               FormResetButton, Checkbox, SlimCheckbox, Switch
   │  │  ├─ datepicker/  DatePicker (from-scratch calendar + time selection, swappable)
   │  │  ├─ buttons/     Button, CloseButton, InfoButton
   │  │  ├─ overlay/     Modal (+ModalProvider), Dialog (alert/confirm via context), Loader
   │  │  ├─ display/     Collapse, PostIt, List, ListItem, Animation
   │  │  ├─ time/        TimeFormat, TimeDisplay, TimeCountdown   (use services/datetime)
   │  │  └─ chart/       Chart   (agnostic primitives over services/chart)
   │  └─ services/             ← one folder per wrapped library; index.ts = our API
   │     ├─ datetime/   (date-fns)     index.ts, datetime.ts, types.ts
   │     ├─ auth/       (Firebase Auth)
   │     ├─ database/   (Firebase RTDB) + firebase client init lives here
   │     ├─ chart/      (Recharts)
   │     ├─ state/      (Zustand)      createStore factory + selector helpers
   │     ├─ router/     (React Router) route table, navigation API, route guard
   │     └─ uid/        (crypto.randomUUID)
   │
   └─ features/
      ├─ auth/          Login page (uses common/services/auth + state)
      └─ meeting/
         ├─ domain/     meeting types, meetingValidator (zod), timeDisplayFeedbackRules,
         │              meetingRepository (built on common/services/database)
         ├─ store/      meetingStore (built on common/services/state)
         ├─ components/ GoalsDecisionCollector, BurndownChart (domain-aware, uses common Chart)
         ├─ form/       MeetingForm
         ├─ dashboard/  MeetingDashboard (+ Header, Footer, SideTopics)
         ├─ report/     MeetingReport (+ Goals, SideTopics, TimeCardsGrid, Footer, TemplatePreviewModal*)
         └─ history/    MeetingsHistory list (reopen + clone actions)
```
Each component: `ComponentName.tsx`, `ComponentName.module.css` (CSS Modules — plain CSS, no preprocessor), `index.ts`. (Test files — `*.test.tsx` for the components the legacy tested, plus service tests — are authored in **plan 2**, not here.)

## Architecture Enforcement (ESLint)

ESLint 9 flat config (`eslint.config.js`) makes the abstraction boundary a build-time guarantee:
- **Global rule**: `no-restricted-imports` (with `patterns`) bans direct imports of every wrapped library across all of `src/**`: `date-fns`, `date-fns/*`, `firebase`, `firebase/*`, `recharts`, `zustand`, `zustand/*`, `react-router`, `react-router-dom`. Message points the dev at the right `common/services/*` abstraction.
- **Per-abstraction overrides**: scoped config objects re-enable exactly one library in exactly the folder that owns it — date-fns only in `src/common/services/datetime/**`, Firebase only in `src/common/services/{auth,database}/**`, Recharts only in `src/common/services/chart/**` (+ `src/common/components/chart/**`), Zustand only in `src/common/services/state/**`, React Router only in `src/common/services/router/**`. (Each override redeclares `no-restricted-imports` minus the one allowed lib — confinement is per-library, so Firebase still can't leak into the datetime folder.)
- This is config-level, so no scattered `// eslint-disable` comments are needed in the abstraction files; the override files are the only place a library is reachable. `yarn lint` (and CI) fail if a feature imports a banned library.

---

## common/components — rebuild notes (from legacy → React)

- **Layout / typography**: straightforward presentational components; port the legacy flex/gutter/responsive tokens (`_flex`, `_gutters`, `_responsiveTokens`) into `common/tokens` CSS custom properties + per-component CSS Modules (no SCSS). `Heading` keeps `size` (xxs–xl) + `title` slot; `Card`/`Button` keep the `theme` enum (`primary|secondary|success|info|warning|danger|light|dark`) and `Button` keeps `size/outline/block/disabled`.
- **Form system** (the intricate part): replace Vue `provide/inject (formVm)` with a **`FormContext`** — `<Form>` provides `registerField/unregisterField/values/validity`, fields register via a `useFormField` hook. Preserve:
  - per-field validation (`required`, min/max length, `customValidation` returning `true | errorString`), dirty/submitted tracking, submit only when valid.
  - `buildOutput()` grouping: fields with an `inputsGroupKey` (e.g. goals) collect into an array, optionally sub-grouped by `inputsSubGroupKey`.
  - `FormInputsList`: dynamic add/remove rows feeding one group (the goals editor).
  - `FormResetButton` triggers the same "are you sure?" confirm dialog before reset.
- **FormDatetimePicker**: legacy used `vue-datetime`. Build our **own `DatePicker`** in `common/components/datepicker/` from scratch (calendar grid + time selection, no external lib or native `datetime-local`), built on `common/services/datetime` for date math/formatting. `FormDatetimePicker` is the form-aware wrapper that composes `DatePicker` and wires in the custom-validation hook (keeps `timeGapCustomValidation`). Isolating it in its own folder makes it swappable later.
- **Overlay**: `Modal` rebuilt with a React **`ModalProvider`** + portal; reimplement `ModalService` behaviors (background blur on app root, body scroll lock, ESC-to-close, stacked-modal awareness). `Dialog` becomes a `useDialog()` hook exposing `alert(...)` / `confirm(...)` returning a promise/callback — replaces `this.$twDialog`.
- **Time**: `TimeFormat` renders moment-style or duration-style output (`--:--` fallback for invalid); `TimeDisplay` is the card wrapper with header/footer slots + theme; `TimeCountdown` runs the per-minute `setInterval` in a `useEffect`, computes overdue/left + theme, emits the diff. All built on the new `datetime` service.
- **Chart / BurndownChart**: wrap **Recharts** `LineChart` with three `Line` series (Tendency / Your Progress / Projection). Port `BurndownChartService` (labels, total weight, `updateProgressData`, projection avg) verbatim as pure TS. Custom tooltip replicates `getCustomLabels`. Expose a method/ref to export the chart as a base64 PNG for the report's clipboard feature (Recharts → SVG → canvas via `canvas.ts`).

---

## CI/CD & Deployment (modeled on `guiooak/dialogs-valve-react`)

**Tooling conventions:** **Yarn 4.15.0** (latest) pinned via Corepack (`packageManager: "yarn@4.15.0"`) and a committed in-repo release (`yarnPath: .yarn/releases/yarn-4.15.0.cjs`); committed `yarn.lock` with **immutable installs** (`yarn install --immutable`) in CI. `mise.toml` (`node = "lts"`), **Prettier** (`.prettierrc` + `format` / `format:check` scripts), and an **ESLint 9 flat config** built on `@eslint/js` + `typescript-eslint` + `eslint-config-prettier` + `eslint-plugin-import`, carrying the reference's rules: `import/no-default-export` (named exports everywhere — fits our `index.ts` barrels), `consistent-type-definitions: ["error","type"]`, and the `no-unused-vars`/`no-explicit-any` warnings. The architecture-boundary `no-restricted-imports` rules (above) are added to this same config. Package scripts: `dev`, `build`, `preview`, `lint`, `typecheck` (`tsc --noEmit`), `test`, `test:coverage`, `format`, `format:check`.

**Supply-chain hardening (`.yarnrc.yml`):**
```yaml
enableScripts: false
nodeLinker: node-modules
npmMinimalAgeGate: "3d"
yarnPath: .yarn/releases/yarn-4.15.0.cjs
```
- `enableScripts: false` — keep install/postinstall lifecycle scripts disabled by default (Yarn 4's default) so a compromised dependency can't run code at install time. The few packages that genuinely need to build are explicitly allow-listed via `dependenciesMeta.<pkg>.built: true` in `package.json` (e.g. `esbuild` for Vite — confirm the actual set when the lockfile exists).
- `npmMinimalAgeGate: "3d"` — refuse npm versions published less than 3 days ago during `add`/`upgrade` (stronger than Yarn 4's 24h default), blunting fast-moving compromised-release attacks; immutable installs of already-locked versions are unaffected. *(Verify the exact setting key against the Yarn 4.15 docs at implementation time.)*
- `nodeLinker: node-modules` — standard `node_modules` layout for tooling compatibility.
- `yarnPath` — pin the exact Yarn binary in-repo so every machine/CI runs the same release.

**`.github/workflows/ci.yml`** — on push & PR to `main`, parallel jobs mirroring the reference (minus the library-only `changeset` job): `lint`, `typecheck`, `test` (→ `yarn test:coverage`, upload `coverage/lcov.info` to **Codecov** via `codecov/codecov-action@v4` with `CODECOV_TOKEN`), `format` (`format:check`), and `build` (uploads the `dist/` artifact). All jobs: `actions/checkout@v4` → `corepack enable` → `actions/setup-node@v4` (node 20, `cache: yarn`) → `yarn install --immutable`.

**`.github/workflows/deploy.yml`** — **Firebase Hosting**: on push to `main` + `workflow_dispatch`. Steps: `actions/checkout@v4` → `corepack enable` → `actions/setup-node@v4` (node 20, `cache: yarn`) → `yarn install --immutable` → `yarn build` (with Firebase env injected, see below) → deploy via `FirebaseExtended/action-hosting-deploy@v0` (live channel) authenticating with a `FIREBASE_SERVICE_ACCOUNT` repo secret + `projectId`. Publishes to **https://<project>.web.app** (and `<project>.firebaseapp.com`). PRs additionally get an ephemeral **preview channel** URL via the same action (no `live` channel), giving reviewers a deployed preview per PR.

**Firebase Hosting config & specifics:**
- `firebase.json` — `hosting.public: "dist"`, an `ignore` list, and SPA **rewrites**: `[{ "source": "**", "destination": "/index.html" }]` (native deep-link support — no `404.html` hack). `.firebaserc` pins the default project.
- Served at **root**, so Vite uses the default `base: '/'` and the router needs no basename — simpler than a project-subpath deploy.
- **Auth domains**: the `*.web.app` / `*.firebaseapp.com` domains are auto-authorized for Firebase Auth, so Google sign-in works with no extra config (custom domains, when added, just need to be listed once).
- **Firebase web config** is not secret (security comes from RTDB rules + Auth) but is kept out of git as GitHub **repo variables/secrets** (`VITE_FIREBASE_*`), injected into the `yarn build` step. The deploy secret `FIREBASE_SERVICE_ACCOUNT` is a service-account JSON with Hosting deploy rights.
- `database.rules.json` deployed to RTDB via the Firebase CLI/console (can also be wired into the deploy workflow) restricting `users/$uid` to its owner.

## Implementation Phases

1. **Scaffold + enforcement + CI**: Vite + React 19 + TS, **Yarn 4.15 (Corepack)** with the hardened `.yarnrc.yml` (`enableScripts: false`, `npmMinimalAgeGate: "3d"`, `nodeLinker: node-modules`, pinned `yarnPath`) committed up front, `mise.toml`, Prettier, Vitest + React Testing Library *(tooling only + one smoke test)*, the `common/` + `features/` + `app/` folder skeleton, design tokens + base CSS, logo/icon assets. Set up `eslint.config.js` (reference conventions + the `no-restricted-imports` ban + per-abstraction overrides) **first**, so the boundary is enforced from day one. Add `.github/workflows/ci.yml` and `deploy.yml` early so the pipeline grows with the code.
2. **`common/services` abstractions**: `datetime` (date-fns), `uid`, `state` (Zustand factory), `router` (React Router + guard), `auth` + `database` (Firebase init, Google sign-in, typed RTDB access), `chart` (Recharts primitives). Each exposes our own interface via `index.ts`.
3. **Auth flow**: `authStore`, Google sign-in, `/login` page, route guard, `database.rules.json`, `.env.example`.
4. **`common/components`, bottom-up**: layout/typography → buttons → form system → overlay (modal/dialog) → time (on `datetime`) → `Chart` (on `chart`). (Tests deferred to plan 2.)
5. **Meeting domain + store**: types, `meetingValidator` (zod), `timeDisplayFeedbackRules`, `meetingRepository` (on `common/services/database`, current meeting + history), `meetingStore` (Vuex contract on `common/services/state`), `decisionsAutomaticBehavior` setting.
6. **Meeting feature components**: GoalsDecisionCollector, domain-aware BurndownChart, AppHeader/AppFooter/Logo/Menu.
7. **Feature pages**: MeetingForm → MeetingDashboard (+ guards, countdown, burndown, collector, side topics, responsive layout) → MeetingReport (+ time cards, template preview modal, copy-to-clipboard) → MeetingsHistory list with **reopen + clone**.
8. **Polish + ship**: modernized styling pass, README (Firebase project + Hosting/secrets setup). Confirm `yarn lint` passes with zero boundary violations; add `firebase.json` (SPA rewrites) + `.firebaserc`; configure the `FIREBASE_SERVICE_ACCOUNT` + `VITE_FIREBASE_*` repo secrets and verify the deploy workflow publishes to the public `*.web.app` URL (and PR preview channels work). *(PWA is plan 2.)*

---

## Verification

- `yarn dev` and walk the full flow against a real (or emulator) Firebase project:
  1. Visit app → redirected to `/login` → Google sign-in succeeds → lands on form.
  2. Create a meeting with weighted + unweighted goals; confirm start<end validation and total-weight behavior; submit.
  3. Dashboard: "ready to start?" modal → start → countdown ticks and goes overdue/danger past end; complete goals and watch the burndown Progress line step down and Projection update; automatic mode auto-advances goals; add/delete side topics; "all done" finish prompt.
  4. Report: header/time formatting, goals+decisions, time-cards expected-vs-real with correct feedback themes, burndown with tooltips, copy-to-clipboard modal shows chart image.
  5. Reload mid-meeting → state rehydrates from RTDB; finish → meeting appears in **history**, `currentMeetingId` cleared. From history: **reopen** a finished meeting (lands on its report, can resume) and **clone** one (opens a prefilled new draft with new goal ids and reset times).
  6. Confirm RTDB shows data only under `users/{uid}` and rules block cross-user reads.
- `yarn lint` — passes; add a quick negative check (temporarily `import { format } from 'date-fns'` inside a feature file) and confirm ESLint flags it, while the same import inside `common/services/datetime` is allowed.
- `yarn typecheck` and `yarn build` — succeed.
- **CI**: open a PR → all jobs (lint, typecheck, test+coverage→Codecov, format, build) run and pass, and a Firebase **preview channel** URL is posted; merge to `main` → the deploy workflow publishes to `https://<project>.web.app` with deep links (e.g. `/meeting/form`) resolving via the Hosting SPA rewrite and Google sign-in working out of the box on the auto-authorized domain.

---

## Open Items / Assumptions
- **Hosting**: **Firebase Hosting** (root domain, native SPA rewrites, auto-authorized auth domain, PR preview channels). Needs a `FIREBASE_SERVICE_ACCOUNT` repo secret.
- **PWA & tests**: deferred to plan 2 (`2026-06-03-02-timebox-works-pwa-and-tests.md`).
- **Firebase project**: you'll need to provide the project config/env and enable Google auth + RTDB; the app can't run end-to-end without it.
