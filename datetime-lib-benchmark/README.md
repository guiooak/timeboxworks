# Datetime Library Benchmark

An interactive, self-contained report comparing **Luxon**, **date-fns**, and **Day.js**
(plus native `Date` and Moment for reference) for a time-tracking app — across **bundle
size**, **runtime speed**, **interval logic**, and **DST correctness**.

## View the report

Just open `index.html` in a browser — it's static, needs no build step and no network:

```bash
# from this folder
xdg-open index.html        # Linux
# or: open index.html      # macOS
# or serve it:
python3 -m http.server 8080   # then visit http://localhost:8080
```

Files:

| File | What it is |
|------|------------|
| `index.html` | The report page |
| `styles.css` | Styling |
| `data.js` | All measured benchmark data (edit to refresh after re-running) |
| `report.js` | Renders the charts/tables |
| `scripts/` | The reproducible benchmark scripts |

## Reproduce the numbers

```bash
cd scripts
npm install
npm run all        # runs bench + bundle + interval + dst
```

Individual runs: `npm run bench`, `npm run bundle`, `npm run interval`, `npm run dst`.

Numbers in `data.js` were measured on Node 24.14 (Linux). Re-running will vary by
machine; update `data.js` to refresh the page.

## TL;DR

1. **date-fns** 🥇 — best fit for interval/duration-heavy work: fastest library at the
   operations a tracker does most, has `areIntervalsOverlapping`, tree-shakes, DST via
   `date-fns-tz`.
2. **Luxon** 🥈 — richest domain model (`Interval`/`Duration`), DST built-in, closest to
   the future Temporal API; costs ~21 KB gzip and is the slowest (still sub-ms).
3. **Day.js** 🥉 — smallest bundle and fastest at parse/diff/format, but weakest for
   interval logic (no helpers) — best for display-heavy apps.

> Suggested approach: store epoch millis / UTC ISO, use **date-fns** for parse/format/compare,
> add **date-fns-tz** only where timezones matter.
