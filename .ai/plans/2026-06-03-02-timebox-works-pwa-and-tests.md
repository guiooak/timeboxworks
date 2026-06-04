# Timebox Works — PWA & Test Specs (Plan 2)

## Context

This is the **deferred** companion to `2026-06-03-01-timebox-works-react-rewrite.md`. The rewrite (plan 1) intentionally leaves out two things to keep the first milestone focused:
- **PWA** (installability, offline, service worker).
- **Test specs** — the actual **unit + integration** suites (no e2e).

Plan 1 only stands up the test *tooling* (Vitest + React Testing Library config and a single smoke test so CI's `test` job is green, with Codecov non-gating). This plan adds the real coverage and turns the app into an installable PWA. It assumes plan 1 has landed: the React 19 + Vite app with the `common/` abstraction layer (`datetime`, `auth`, `database`, `chart`, `state`, `router`), the meeting feature, and the Firebase Hosting CI/CD pipeline.

---

## A. PWA

Goal: an installable, offline-capable app served from the Firebase Hosting root domain (`*.web.app`).

1. **Plugin & manifest**
   - Add `vite-plugin-pwa` (Workbox under the hood). Configure `registerType: 'autoUpdate'` (or prompt — see step 3); SW `scope`/`base` default to root `/` (Firebase Hosting), so no subpath juggling.
   - Author the **web app manifest** from the legacy `public/manifest.json`: name "Timebox Works", short name, theme/background colors (reuse the design tokens), display `standalone`, start URL respecting the base path.
   - Reuse the **icon set** already copied into `src/assets` from legacy (`android-chrome-192/512`, `apple-touch-icon*`, `favicon-16/32`, `mstile`, `safari-pinned-tab`). Wire the maskable icon.

2. **Service worker / caching**
   - Precache the built app shell (JS/CSS/HTML/icons) via Workbox `precacheManifest`.
   - Runtime caching: cache-first for static assets/fonts; network-first (or stale-while-revalidate) for the `index.html`/navigation so deep links resolve offline (the Firebase Hosting SPA rewrite handles them online).
   - Replaces the legacy `registerServiceWorker.js`.

3. **Update flow**
   - Detect a waiting SW and surface an "update available — reload" prompt (reuse the `common/components` Dialog/Modal). Confirm → `skipWaiting` + reload. (If `autoUpdate` is chosen instead, document the trade-off: silent refresh on next load.)

4. **Firebase offline**
   - Enable RTDB offline behavior in `common/services/database`: keep-synced refs / on-disk persistence and **write queueing** so starting/finishing goals during a meeting survives a dropped connection; reconcile on reconnect. Keep this inside the database abstraction (no Firebase imports leak out — same ESLint boundary as plan 1).
   - Decide conflict behavior for the single `currentMeeting` (last-write-wins is acceptable for a single-user-per-account app).

5. **Verification**
   - Lighthouse PWA audit passes (installable, offline, manifest, icons).
   - Install on desktop + mobile; load offline and confirm an in-progress meeting (countdown/goals) keeps working and syncs when back online.
   - Confirm SW scope/precache paths are correct at the root domain (and on PR preview-channel URLs).

---

## B. Test specs (unit + integration only — no e2e)

Tooling already exists from plan 1 (Vitest + RTL + `@testing-library/jest-dom` + jsdom + `@vitest/coverage-v8`). This plan writes the suites and tightens CI.

### Unit tests
- **Services** (`common/services` + `features/meeting/domain`):
  - `datetime` — formatting, ISO round-trips, `getDiffOf`, duration, `isSameDay` (incl. DST/edge cases).
  - `meetingValidator` (zod) — valid/invalid meeting + goal shapes.
  - `timeDisplayFeedbackRules` — every band boundary (very late / late / a little late / on target / advanced) and the non-number guard.
  - `BurndownChartService` — `getLabels`, `getTotalWeight`, `updateProgressData` (ordering by `finishedAt`, add/update/remove), projection average of remaining weights.
  - `uid` — uniqueness/shape.
- **Components** — the set the legacy unit-tested, plus the new DatePicker:
  Button, Col, Container, Form, FormField, FormDatetimePicker, FormInput, FormInputsList, FormResetButton, FormSubmitButton, FormTextarea, Heading, Label, Page, Row, DatePicker.
  Focus on the **Form engine**: per-field validation, dirty/submitted state, and `buildOutput()` grouping (`inputsGroupKey` → array, `inputsSubGroupKey` → sub-objects).

### Integration tests (RTL)
- Drive the three flows against **in-memory fakes** of `common/services/{auth, database}` (the abstraction makes this clean — no real Firebase, or optionally the **RTDB emulator**):
  - **Form → Dashboard → Report**: fill form (goals with/without weights), submit, start meeting, complete goals, finish, land on report with correct time cards + burndown.
  - **Goal completion → burndown**: checking goals steps the Progress line and updates Projection; "all done" prompts finish.
  - **History reopen/clone**: finished meeting reopens (resumable) and clones into a prefilled draft with new goal ids and reset times.
  - **Auth gating**: unauthenticated → `/login`; signed-in → app.

### CI tightening
- Add coverage thresholds (e.g. lines/branches ≥ 80%) in `vitest.config`.
- Flip Codecov to gating (`fail_ci_if_error: true`) and remove the plan-1 smoke test once the suite is meaningful.

### Verification
- `yarn test` / `yarn test:coverage` green locally and in CI; coverage meets thresholds; Codecov report uploads.

---

## Open Items
- **Update strategy**: `autoUpdate` vs prompt-to-reload — pick during implementation (prompt recommended so an in-progress meeting isn't disrupted).
- **Emulator vs fakes**: default to in-memory fakes for speed; add a small emulator-backed suite if we want to exercise real RTDB rules.
