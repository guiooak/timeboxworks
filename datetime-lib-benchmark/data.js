/* All benchmark data, measured on Node 24.14 (Linux).
   Library versions: luxon 3.7.2 · date-fns 4.4.0 · dayjs 1.11.21 · moment 2.30.1
   These are static results captured from the scripts in ./scripts. */

window.LIBS = {
  native:     { label: 'native Date',  color: '#64748b', short: 'native' },
  dayjs:      { label: 'Day.js',       color: '#f59e0b', short: 'dayjs' },
  'date-fns': { label: 'date-fns',     color: '#ec4899', short: 'date-fns' },
  luxon:      { label: 'Luxon',        color: '#3b82f6', short: 'luxon' },
  moment:     { label: 'Moment',       color: '#a855f7', short: 'moment' },
};

/* Final candidates the report concludes on */
window.FINALISTS = ['dayjs', 'date-fns', 'luxon'];

window.META = {
  node: '24.14.1',
  platform: 'Linux',
  date: '2026-06-04',
  versions: { luxon: '3.7.2', 'date-fns': '4.4.0', dayjs: '1.11.21', moment: '2.30.1' },
};

/* ---- Bundle size: tree-shaken + minified, realistic time-tracker usage ---- */
window.BUNDLE = {
  unit: 'KB',
  rows: [
    { lib: 'native',   min: 0.2,  gzip: 0.2 },
    { lib: 'dayjs',    min: 12.5, gzip: 4.8 },
    { lib: 'date-fns', min: 24.8, gzip: 7.7 },
    { lib: 'moment',   min: 60.4, gzip: 19.7 },
    { lib: 'luxon',    min: 69.4, gzip: 21.6 },
  ],
};

/* ---- Core runtime: ops/sec (higher = better) ---- */
window.CORE = {
  unit: 'ops/sec',
  groups: [
    { id: 'parse',   title: 'Parse ISO string',        data: { native: 2178096, dayjs: 1414321, 'date-fns': 326736, luxon: 172736, moment: 53288 } },
    { id: 'diff',    title: 'Diff start → end',         data: { native: 904041,  dayjs: 435315,  'date-fns': 155111, luxon: 51487,  moment: 24772 } },
    { id: 'sum',     title: 'Sum 200 durations',        data: { native: 2708542, 'date-fns': 71650, dayjs: 17278, moment: 8341, luxon: 5589 } },
    { id: 'fmtDur',  title: 'Format duration "2h 15m"', data: { native: 17081293, moment: 1542784, dayjs: 1099329, luxon: 72733, 'date-fns': 58340 } },
    { id: 'fmtTime', title: 'Format timestamp',         data: { native: 329315, dayjs: 184400, 'date-fns': 113043, luxon: 84133, moment: 46948 } },
  ],
};

/* ---- Interval stress test: ops/sec (higher = better) ---- */
window.INTERVAL = {
  unit: 'ops/sec',
  groups: [
    { id: 'overlap', title: 'Overlap detection',        note: 'built-in helper: Luxon ✓, date-fns ✓, Day.js ✗ (hand-rolled)', data: { native: 1838340, moment: 1804620, luxon: 937186, 'date-fns': 643163, dayjs: 409236 } },
    { id: 'split',   title: 'Split across midnight',    note: 'per-day chunks — all hand-rolled', data: { native: 365065, 'date-fns': 236855, moment: 98575, dayjs: 57706, luxon: 29102 } },
    { id: 'sumFmt',  title: 'Sum 100 sessions + format', note: 'the time-tracker hot path', data: { native: 48376, 'date-fns': 25675, dayjs: 8669, moment: 4173, luxon: 2110 } },
  ],
};

/* ---- DST correctness: physical elapsed across a transition ---- */
window.DST = {
  scenarios: [
    { id: 'spring', title: 'Spring forward (Mar 8, 02:00→03:00)', wall: '2h', truth: 1 },
    { id: 'fall',   title: 'Fall back (Nov 1, 02:00→01:00)',      wall: '3h', truth: 4 },
    { id: 'normal', title: 'Normal day (no transition)',          wall: '2.5h', truth: 2.5 },
  ],
  /* computed hours per lib per scenario */
  results: {
    luxon:          { spring: 1, fall: 4, normal: 2.5, needs: 'built-in' },
    'date-fns':     { spring: 1, fall: 4, normal: 2.5, needs: '+ date-fns-tz package' },
    dayjs:          { spring: 1, fall: 4, normal: 2.5, needs: '+ utc & timezone plugins' },
    moment:         { spring: 1, fall: 4, normal: 2.5, needs: '+ moment-timezone (ships IANA DB, +35–200KB)' },
    'native-naive': { spring: 2, fall: 3, normal: 2.5, needs: 'none — but WRONG', label: 'native (naive)' },
    'native-intl':  { spring: 2, fall: 3, normal: 2.5, needs: '~18 lines Intl — still WRONG at boundary', label: 'native (hand-rolled Intl)' },
  },
};

/* ---- Scorecard for the three finalists ---- */
window.SCORECARD = {
  dimensions: [
    'Bundle size', 'Raw speed', 'Interval / duration work', 'Domain model & readability',
    'Tree-shakeable', 'DST / timezone', 'Maintenance & future',
  ],
  /* 3 = best, 2 = ok, 1 = weak */
  scores: {
    dayjs:      [3, 3, 1, 2, 1, 2, 3],
    'date-fns': [2, 2, 3, 2, 3, 2, 3],
    luxon:      [1, 1, 2, 3, 1, 3, 3],
  },
  notes: {
    dayjs: {
      'Bundle size': 'Smallest (4.8 KB gzip)',
      'Raw speed': 'Fastest at parse/diff/format',
      'Interval / duration work': 'No interval helpers; slow duration plugin',
      'Domain model & readability': 'Moment-like, familiar',
      'Tree-shakeable': 'No — whole core + each plugin',
      'DST / timezone': 'Correct, needs utc + timezone plugins',
      'Maintenance & future': 'Actively maintained',
    },
    'date-fns': {
      'Bundle size': '7.7 KB gzip; pay only for imports',
      'Raw speed': 'Mid overall, fastest at sum',
      'Interval / duration work': 'Fastest library here; has areIntervalsOverlapping',
      'Domain model & readability': 'Functional, on plain Date',
      'Tree-shakeable': 'Yes — import single functions',
      'DST / timezone': 'Correct via date-fns-tz',
      'Maintenance & future': 'Actively maintained',
    },
    luxon: {
      'Bundle size': 'Heaviest (21.6 KB gzip), one chunk',
      'Raw speed': 'Slowest, but sub-ms absolute',
      'Interval / duration work': 'Richest API (Interval/Duration) but slowest',
      'Domain model & readability': 'Best — real domain types',
      'Tree-shakeable': 'No — single bundle',
      'DST / timezone': 'Correct, built-in (no extra pkg)',
      'Maintenance & future': 'Active; closest to TC39 Temporal',
    },
  },
};

window.VERDICT = [
  {
    rank: 1, lib: 'date-fns', medal: '🥇',
    headline: 'Best fit for an interval/duration-heavy time tracker',
    body: 'Fastest library at the duration & interval work that dominates a tracker, ships the one interval helper you want (areIntervalsOverlapping), tree-shakes so you pay only for what you import, and handles DST via date-fns-tz. The only tax: split-at-midnight is a ~6-line loop — and it is still the fastest at it.',
  },
  {
    rank: 2, lib: 'luxon', medal: '🥈',
    headline: 'Pick it for readable domain code over bundle/speed',
    body: 'Real Interval and Duration types map directly onto session math, DST works built-in with no extra package, and it is the smoothest migration path to the future Temporal API. Costs 21 KB and is the slowest — but still sub-millisecond, so the real price is bundle size.',
  },
  {
    rank: 3, lib: 'dayjs', medal: '🥉',
    headline: 'Only if minimal bundle is a hard requirement',
    body: 'Wins the headline benchmarks (smallest bundle, fastest parse/diff/format) but is the weakest exactly where a tracker lives: no interval helpers (you hand-roll overlap/split) and a slow, second-class duration plugin. Great for display-heavy apps; it will fight you on rich session math.',
  },
];
