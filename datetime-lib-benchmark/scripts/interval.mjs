import { Bench } from 'tinybench';
import { DateTime, Duration, Interval } from 'luxon';
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import moment from 'moment';
import {
  areIntervalsOverlapping,
  addDays,
  startOfDay,
  isBefore,
  differenceInMilliseconds,
} from 'date-fns';

dayjs.extend(dayjsDuration);
dayjs.extend(isSameOrBefore);

const fmtHM = (ms) => {
  const totalMin = Math.floor(ms / 60000);
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
};

// ---------------- Sample data ----------------
// Overlap: A 09:00-11:00 vs B 10:30-12:00 (overlapping)
const A = ['2026-06-03T09:00:00Z', '2026-06-03T11:00:00Z'];
const B = ['2026-06-03T10:30:00Z', '2026-06-03T12:00:00Z'];

// Split: a session spanning ~2.5 calendar days
const SPAN = ['2026-06-03T22:30:00Z', '2026-06-06T03:00:00Z'];

// Sum+format: 100 sessions of varying length
const SESSIONS = Array.from({ length: 100 }, (_, i) => {
  const start = Date.UTC(2026, 5, 3, 8, 0, 0) + i * 3600_000;
  const end = start + (1800 + i * 17) * 1000;
  return [new Date(start).toISOString(), new Date(end).toISOString()];
});

// ---------------- Pre-parsed inputs (per library) ----------------
const P = {
  native: {
    A: A.map((s) => new Date(s)), B: B.map((s) => new Date(s)),
    span: SPAN.map((s) => new Date(s)),
    sessions: SESSIONS.map(([s, e]) => [new Date(s), new Date(e)]),
  },
  'date-fns': {
    A: A.map((s) => new Date(s)), B: B.map((s) => new Date(s)),
    span: SPAN.map((s) => new Date(s)),
    sessions: SESSIONS.map(([s, e]) => [new Date(s), new Date(e)]),
  },
  luxon: {
    A: A.map((s) => DateTime.fromISO(s)), B: B.map((s) => DateTime.fromISO(s)),
    span: SPAN.map((s) => DateTime.fromISO(s)),
    sessions: SESSIONS.map(([s, e]) => [DateTime.fromISO(s), DateTime.fromISO(e)]),
  },
  dayjs: {
    A: A.map((s) => dayjs(s)), B: B.map((s) => dayjs(s)),
    span: SPAN.map((s) => dayjs(s)),
    sessions: SESSIONS.map(([s, e]) => [dayjs(s), dayjs(e)]),
  },
  moment: {
    A: A.map((s) => moment(s)), B: B.map((s) => moment(s)),
    span: SPAN.map((s) => moment(s)),
    sessions: SESSIONS.map(([s, e]) => [moment(s), moment(e)]),
  },
};

// ====================================================================
// OVERLAP — does session A overlap session B?
// ====================================================================
const overlap = {
  native: ([aS, aE], [bS, bE]) => aS < bE && bS < aE,
  'date-fns': ([aS, aE], [bS, bE]) =>
    areIntervalsOverlapping({ start: aS, end: aE }, { start: bS, end: bE }),
  luxon: ([aS, aE], [bS, bE]) =>
    Interval.fromDateTimes(aS, aE).overlaps(Interval.fromDateTimes(bS, bE)), // built-in
  dayjs: ([aS, aE], [bS, bE]) => aS.isBefore(bE) && bS.isBefore(aE), // hand-rolled
  moment: ([aS, aE], [bS, bE]) => aS.isBefore(bE) && bS.isBefore(aE), // hand-rolled
};

// ====================================================================
// SPLIT — break a session at each calendar midnight (per-day chunks)
// ====================================================================
const split = {
  native: ([start, end]) => {
    const segs = []; let c = new Date(start);
    while (c < end) {
      const nm = new Date(c); nm.setHours(24, 0, 0, 0); // next local midnight
      const segEnd = nm < end ? nm : new Date(end);
      segs.push([new Date(c), segEnd]); c = segEnd;
    }
    return segs;
  },
  'date-fns': ([start, end]) => {
    const segs = []; let c = start;
    while (isBefore(c, end)) {
      const nm = startOfDay(addDays(c, 1));
      const segEnd = isBefore(nm, end) ? nm : end;
      segs.push({ start: c, end: segEnd }); c = segEnd;
    }
    return segs;
  },
  luxon: ([start, end]) => {
    const segs = []; let c = start;
    while (c < end) {
      const nm = c.plus({ days: 1 }).startOf('day');
      const segEnd = nm < end ? nm : end;
      segs.push(Interval.fromDateTimes(c, segEnd)); c = segEnd;
    }
    return segs;
  },
  dayjs: ([start, end]) => {
    const segs = []; let c = start;
    while (c.isBefore(end)) {
      const nm = c.add(1, 'day').startOf('day');
      const segEnd = nm.isBefore(end) ? nm : end;
      segs.push([c, segEnd]); c = segEnd;
    }
    return segs;
  },
  moment: ([start, end]) => {
    const segs = []; let c = start.clone();
    while (c.isBefore(end)) {
      const nm = c.clone().add(1, 'day').startOf('day');
      const segEnd = nm.isBefore(end) ? nm : end.clone();
      segs.push([c.clone(), segEnd.clone()]); c = segEnd;
    }
    return segs;
  },
};

// ====================================================================
// SUM + FORMAT — total 100 sessions, format as "Xh Ym"
// ====================================================================
const sumFmt = {
  native: (sessions) => {
    let ms = 0; for (const [s, e] of sessions) ms += e - s;
    return fmtHM(ms);
  },
  'date-fns': (sessions) => {
    let ms = 0; for (const [s, e] of sessions) ms += differenceInMilliseconds(e, s);
    return fmtHM(ms);
  },
  luxon: (sessions) => {
    let d = Duration.fromMillis(0);
    for (const [s, e] of sessions) d = d.plus(Interval.fromDateTimes(s, e).toDuration());
    return d.toFormat("h'h' m'm'");
  },
  dayjs: (sessions) => {
    let d = dayjs.duration(0);
    for (const [s, e] of sessions) d = d.add(e.diff(s));
    return `${Math.floor(d.asHours())}h ${d.minutes()}m`;
  },
  moment: (sessions) => {
    const d = moment.duration(0);
    for (const [s, e] of sessions) d.add(e.diff(s));
    return `${Math.floor(d.asHours())}h ${d.minutes()}m`;
  },
};

// ---------------- Correctness sanity check ----------------
console.log('### sanity (all libs should agree)');
const libs = ['native', 'date-fns', 'luxon', 'dayjs', 'moment'];
console.table(libs.map((l) => ({
  lib: l,
  overlap: overlap[l](P[l].A, P[l].B),
  'split segments': split[l](P[l].span).length,
  'sum+fmt': sumFmt[l](P[l].sessions),
})));

// ---------------- Benchmark ----------------
const bench = new Bench({ time: 500 });
for (const l of libs) {
  bench.add(`overlap | ${l}`, () => overlap[l](P[l].A, P[l].B));
  bench.add(`split | ${l}`, () => split[l](P[l].span));
  bench.add(`sumFmt | ${l}`, () => sumFmt[l](P[l].sessions));
}
await bench.run();

for (const g of ['overlap', 'split', 'sumFmt']) {
  console.log(`\n### ${g}`);
  const rows = bench.tasks
    .filter((t) => t.name.startsWith(g + ' '))
    .map((t) => ({ lib: t.name.split('| ')[1], _raw: t.result.throughput.mean }))
    .sort((a, b) => b._raw - a._raw);
  const top = rows[0]._raw;
  console.table(rows.map((r) => ({
    lib: r.lib,
    'ops/sec': Math.round(r._raw).toLocaleString(),
    'vs fastest': (r._raw / top * 100).toFixed(0) + '%',
  })));
}
