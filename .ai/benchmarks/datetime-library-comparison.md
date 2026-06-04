# Datetime Library Comparison — Luxon vs date-fns vs Day.js

**Context:** Choosing a datetime library for a time-tracking app (sessions, durations,
per-day totals). Candidates benchmarked: **Luxon**, **date-fns**, **Day.js**, with native
`Date` and **Moment** included for reference.

- **Measured on:** Node 24.14 (Linux), 2026-06-04
- **Versions:** luxon 3.7.2 · date-fns 4.4.0 · dayjs 1.11.21 · moment 2.30.1
- **Reproducible scripts:** `datetime-lib-benchmark/scripts/` (+ interactive report at `datetime-lib-benchmark/index.html`)

---

## TL;DR

| Rank | Library | Why |
|------|---------|-----|
| 🥇 | **date-fns** | Best fit for interval/duration-heavy work: fastest library at the hot-path ops, has `areIntervalsOverlapping`, tree-shakes, DST via `date-fns-tz`. |
| 🥈 | **Luxon** | Richest domain model (`Interval`/`Duration`), DST built-in, closest to TC39 Temporal. ~21 KB gzip; slowest, but sub-ms in absolute terms. |
| 🥉 | **Day.js** | Smallest bundle + fastest parse/diff/format, but weakest for interval logic (no helpers). Best for display-heavy apps. |

**Suggested approach:** store epoch millis / UTC ISO, use **date-fns** for
parse/format/compare, add **date-fns-tz** only where timezones matter.

---

## 1. Bundle size

Tree-shaken + minified, realistic time-tracker entrypoint (parse + diff + duration format
+ timestamp format). Lower is better.

| Library | minified | min + gzip |
|---------|---------:|-----------:|
| native | 0.2 KB | 0.2 KB |
| **Day.js** | 12.5 KB | **4.8 KB** 🥇 |
| **date-fns** | 24.8 KB | **7.7 KB** 🥈 |
| Moment | 60.4 KB | 19.7 KB |
| **Luxon** | 69.4 KB | **21.6 KB** 🥉 |

> Moment shown bare-core; with locales (its default) it commonly balloons to 60–70 KB
> gzip. Day.js / date-fns / Luxon all use the browser's `Intl` for timezones, shipping no
> extra TZ data.

## 2. Runtime speed (ops/sec, higher = better)

| Operation | Day.js | date-fns | Luxon | (native) |
|-----------|-------:|---------:|------:|---------:|
| Parse ISO | **1,414,321** 🥇 | 326,736 | 172,736 | 2,178,096 |
| Diff start→end | **435,315** 🥇 | 155,111 | 51,487 | 904,041 |
| Sum 200 durations | 17,278 | **71,650** 🥇 | 5,589 | 2,708,542 |
| Format duration | **1,099,329** 🥇 | 58,340 | 72,733 | 17,081,293 |
| Format timestamp | **184,400** 🥇 | 113,043 | 84,133 | 329,315 |

Day.js leads the headline ops; date-fns wins durations. **Reality check:** even Luxon's
slowest case here is sub-millisecond per call — speed is rarely the deciding factor for a
UI app.

## 3. Interval stress test (ops/sec) — the time-tracker core

| Operation | Day.js | date-fns | Luxon |
|-----------|-------:|---------:|------:|
| Overlap detection | 409,236 | 643,163 | **937,186** 🥇 |
| Split across midnight | 57,706 | **236,855** 🥇 | 29,102 |
| Sum 100 sessions + format | 8,669 | **25,675** 🥇 | 2,110 |
| Built-in overlap helper? | ❌ hand-roll | ✅ `areIntervalsOverlapping` | ✅ `Interval.overlaps` |

This is where the headline-speed story flips: **Day.js is weakest** (no interval helpers,
slow duration methods). **Luxon reads best but is slowest** (immutable allocations per
iteration). **date-fns is the best balance** of helper availability + speed.

## 4. DST correctness — physical elapsed across a transition

Wall-clock local times in `America/New_York`; correct answer is the actual elapsed time.

| Scenario | wall clock | TRUE | Day.js | date-fns | Luxon | native (naive) | native (hand-rolled Intl) |
|----------|-----------:|-----:|:------:|:--------:|:-----:|:--------------:|:-------------------------:|
| Spring-forward | 2h | **1h** | ✅ | ✅ | ✅ | ❌ 2h | ❌ 2h |
| Fall-back | 3h | **4h** | ✅ | ✅ | ✅ | ❌ 3h | ❌ 3h |
| Normal day | 2.5h | 2.5h | ✅ | ✅ | ✅ | ✅ | ✅ |

- All three real libraries are **correct** (they delegate to `Intl`/IANA).
- Requirements: Luxon **built-in**; date-fns needs **`date-fns-tz`**; Day.js needs **`utc` + `timezone`** plugins; Moment needs **`moment-timezone`** (ships its own IANA DB → +35–200 KB).
- **Native is the trap:** naive code returns the wall-clock delta (the classic billing
  bug), and even a careful ~18-line hand-rolled `Intl` version is still wrong at the
  boundary (single-pass offset resolution). Strongest argument against "no library."

## 5. Scorecard

| Dimension | Day.js | date-fns | Luxon |
|-----------|:------:|:--------:|:-----:|
| Bundle size | 🟢 best | 🟡 good | 🔴 heavy |
| Raw speed (parse/diff/format) | 🟢 best | 🟡 mid | 🔴 slowest |
| Interval / duration work | 🔴 weakest | 🟢 best | 🟡 expressive but slow |
| Domain model / readability | 🟡 Moment-like | 🟡 functional | 🟢 richest |
| Tree-shakeable | 🔴 no | 🟢 yes | 🔴 no |
| DST / timezone | 🟡 2 plugins | 🟡 1 package | 🟢 built-in |
| Maintenance / future | 🟢 active | 🟢 active | 🟢 active (≈ Temporal) |

---

## Verdict

The app's core entity is the **interval / duration**, and that's where the headline-speed
ranking flips:

- 🥇 **date-fns** — fastest library at the duration/interval work that dominates a tracker,
  ships the one interval helper you want, tree-shakes, correct DST via `date-fns-tz`. Only
  tax: split-at-midnight is a ~6-line loop (still the fastest at it).
- 🥈 **Luxon** — pick it to optimize for readable domain code over bundle/speed; `Interval`
  and `Duration` map directly onto session math, DST is built-in, smoothest path to
  Temporal. Costs 21 KB and is slowest (still sub-ms).
- 🥉 **Day.js** — only if minimal bundle is a hard requirement and duration needs stay
  simple. Great for display-heavy apps; it fights you on rich session math.

> **Recommendation:** store timestamps as epoch millis (or UTC ISO), use **date-fns** for
> parsing / formatting / comparison, and pull in **date-fns-tz** only where you cross
> timezones — near-native size and speed with correct, readable interval logic.
