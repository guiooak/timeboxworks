import { Bench } from 'tinybench';
import { DateTime, Duration, Interval } from 'luxon';
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration.js';
import moment from 'moment';
import {
  parseISO,
  differenceInSeconds,
  intervalToDuration,
  formatDuration,
  format as dfnsFormat,
} from 'date-fns';

dayjs.extend(dayjsDuration);

// --- Sample data: typical time-tracking sessions (ISO strings) ---
const start = '2026-06-03T09:15:00.000Z';
const end = '2026-06-03T11:30:45.000Z';
// 200 sessions to sum, in seconds
const sessionSecs = Array.from({ length: 200 }, (_, i) => 600 + i * 37);

const fmtHM = (totalSec) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
};

const bench = new Bench({ time: 500 });

// ---------- 1. PARSE ISO ----------
bench
  .add('parse | native', () => { new Date(start); })
  .add('parse | luxon', () => { DateTime.fromISO(start); })
  .add('parse | dayjs', () => { dayjs(start); })
  .add('parse | date-fns', () => { parseISO(start); })
  .add('parse | moment', () => { moment(start); });

// ---------- 2. DIFF (duration between two times, in seconds) ----------
bench
  .add('diff | native', () => { (new Date(end) - new Date(start)) / 1000; })
  .add('diff | luxon', () => {
    Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)).length('seconds');
  })
  .add('diff | dayjs', () => { dayjs(end).diff(dayjs(start), 'second'); })
  .add('diff | date-fns', () => { differenceInSeconds(parseISO(end), parseISO(start)); })
  .add('diff | moment', () => { moment(end).diff(moment(start), 'seconds'); });

// ---------- 3. SUM 200 session durations ----------
bench
  .add('sum | native', () => {
    let t = 0; for (const s of sessionSecs) t += s; t;
  })
  .add('sum | luxon', () => {
    let d = Duration.fromObject({ seconds: 0 });
    for (const s of sessionSecs) d = d.plus({ seconds: s });
    d.as('seconds');
  })
  .add('sum | dayjs', () => {
    let d = dayjs.duration(0);
    for (const s of sessionSecs) d = d.add(s, 'second');
    d.asSeconds();
  })
  .add('sum | date-fns', () => {
    let t = 0; for (const s of sessionSecs) t += s; intervalToDuration({ start: 0, end: t * 1000 });
  })
  .add('sum | moment', () => {
    const d = moment.duration(0);
    for (const s of sessionSecs) d.add(s, 'seconds');
    d.asSeconds();
  });

// ---------- 4. FORMAT DURATION as "2h 15m" ----------
const secs = 8145; // 2h 15m 45s
bench
  .add('fmtDur | native', () => { fmtHM(secs); })
  .add('fmtDur | luxon', () => { Duration.fromObject({ seconds: secs }).toFormat("h'h' m'm'"); })
  .add('fmtDur | dayjs', () => { const d = dayjs.duration(secs, 'second'); `${Math.floor(d.asHours())}h ${d.minutes()}m`; })
  .add('fmtDur | date-fns', () => {
    formatDuration(intervalToDuration({ start: 0, end: secs * 1000 }), { format: ['hours', 'minutes'] });
  })
  .add('fmtDur | moment', () => { const d = moment.duration(secs, 'seconds'); `${Math.floor(d.asHours())}h ${d.minutes()}m`; });

// ---------- 5. FORMAT TIMESTAMP for display ----------
bench
  .add('fmtTime | native', () => { new Date(start).toLocaleString('en-US'); })
  .add('fmtTime | luxon', () => { DateTime.fromISO(start).toFormat('yyyy-LL-dd HH:mm'); })
  .add('fmtTime | dayjs', () => { dayjs(start).format('YYYY-MM-DD HH:mm'); })
  .add('fmtTime | date-fns', () => { dfnsFormat(parseISO(start), 'yyyy-MM-dd HH:mm'); })
  .add('fmtTime | moment', () => { moment(start).format('YYYY-MM-DD HH:mm'); });

await bench.run();

// Group + print
const groups = ['parse', 'diff', 'sum', 'fmtDur', 'fmtTime'];
for (const g of groups) {
  console.log(`\n### ${g}`);
  const rows = bench.tasks
    .filter((t) => t.name.startsWith(g + ' '))
    .map((t) => ({
      lib: t.name.split('| ')[1],
      'ops/sec': Math.round(t.result.throughput.mean).toLocaleString(),
      _raw: t.result.throughput.mean,
    }))
    .sort((a, b) => b._raw - a._raw);
  const fastest = rows[0]._raw;
  for (const r of rows) r['vs fastest'] = (r._raw / fastest * 100).toFixed(0) + '%';
  console.table(rows.map(({ _raw, ...r }) => r));
}
