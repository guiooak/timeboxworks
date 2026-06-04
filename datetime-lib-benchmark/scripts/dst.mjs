import { DateTime } from 'luxon';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc.js';
import dayjsTz from 'dayjs/plugin/timezone.js';
import momentTz from 'moment-timezone';
import { fromZonedTime } from 'date-fns-tz';

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTz);

const ZONE = 'America/New_York';

// Scenarios: [label, startWall, endWall, wall-clock hrs, TRUE physical hrs]
const CASES = [
  ['spring-forward', '2026-03-08T01:30:00', '2026-03-08T03:30:00', 2, 1],
  ['fall-back', '2026-11-01T00:30:00', '2026-11-01T03:30:00', 3, 4],
  ['normal day', '2026-06-03T09:00:00', '2026-06-03T11:30:00', 2.5, 2.5],
];

const hrs = (ms) => +(ms / 3_600_000).toFixed(2);

// ---- Each computes PHYSICAL elapsed ms from two wall-clock times in ZONE ----

// luxon: named zones built in
const luxonElapsed = (s, e) =>
  DateTime.fromISO(e, { zone: ZONE }).diff(DateTime.fromISO(s, { zone: ZONE })).toMillis();

// date-fns: needs date-fns-tz package
const dfnsElapsed = (s, e) => fromZonedTime(e, ZONE) - fromZonedTime(s, ZONE);

// dayjs: needs utc + timezone plugins
const dayjsElapsed = (s, e) => dayjs.tz(e, ZONE).diff(dayjs.tz(s, ZONE));

// moment: needs moment-timezone package
const momentElapsed = (s, e) => momentTz.tz(e, ZONE).diff(momentTz.tz(s, ZONE));

// native NAIVE: treat wall time as UTC (the common mistake) -> gives wall-clock delta
const nativeNaive = (s, e) => new Date(e + 'Z') - new Date(s + 'Z');

// native CORRECT: hand-rolled zoned-wall -> UTC instant via Intl
const offsetMs = (date, zone) => {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).reduce((a, x) => ((a[x.type] = x.value), a), {});
  const asUTC = Date.UTC(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - date.getTime();
};
const zonedWallToUtc = (wall, zone) => {
  const guess = new Date(wall + 'Z').getTime();
  return new Date(guess - offsetMs(new Date(guess), zone));
};
const nativeCorrect = (s, e) => zonedWallToUtc(e, ZONE) - zonedWallToUtc(s, ZONE);

const impls = {
  luxon: { fn: luxonElapsed, needs: 'built-in' },
  'date-fns': { fn: dfnsElapsed, needs: '+date-fns-tz pkg' },
  dayjs: { fn: dayjsElapsed, needs: '+utc +timezone plugins' },
  moment: { fn: momentElapsed, needs: '+moment-timezone pkg' },
  'native (naive)': { fn: nativeNaive, needs: 'none (WRONG)' },
  'native (Intl, hand-rolled)': { fn: nativeCorrect, needs: '~18 lines of Intl' },
};

for (const [label, s, e, wallH, trueH] of CASES) {
  console.log(`\n### ${label}  (wall clock ${wallH}h  →  TRUE elapsed ${trueH}h)`);
  const rows = Object.entries(impls).map(([lib, { fn, needs }]) => {
    const got = hrs(fn(s, e));
    return { lib, 'computed (h)': got, correct: got === trueH ? '✅' : '❌', requires: needs };
  });
  console.table(rows);
}
