import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Realistic time-tracker entrypoints: parse, diff, sum, format duration, format time.
const entries = {
  native: `
    const start = new Date('2026-06-03T09:15:00Z');
    const end = new Date('2026-06-03T11:30:45Z');
    const sec = (end - start) / 1000;
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
    export const out = \`\${h}h \${m}m \` + start.toLocaleString();
  `,
  luxon: `
    import { DateTime, Interval, Duration } from 'luxon';
    const s = DateTime.fromISO('2026-06-03T09:15:00Z');
    const e = DateTime.fromISO('2026-06-03T11:30:45Z');
    const dur = Interval.fromDateTimes(s, e).toDuration(['hours','minutes']);
    export const out = dur.toFormat("h'h' m'm'") + s.toFormat('yyyy-LL-dd HH:mm');
  `,
  dayjs: `
    import dayjs from 'dayjs';
    import duration from 'dayjs/plugin/duration.js';
    dayjs.extend(duration);
    const s = dayjs('2026-06-03T09:15:00Z');
    const e = dayjs('2026-06-03T11:30:45Z');
    const d = dayjs.duration(e.diff(s));
    export const out = \`\${Math.floor(d.asHours())}h \${d.minutes()}m\` + s.format('YYYY-MM-DD HH:mm');
  `,
  'date-fns': `
    import { parseISO, intervalToDuration, formatDuration, format, differenceInSeconds } from 'date-fns';
    const s = parseISO('2026-06-03T09:15:00Z');
    const e = parseISO('2026-06-03T11:30:45Z');
    const dur = intervalToDuration({ start: s, end: e });
    export const out = formatDuration(dur, { format: ['hours','minutes'] }) + format(s, 'yyyy-MM-dd HH:mm') + differenceInSeconds(e, s);
  `,
  moment: `
    import moment from 'moment';
    const s = moment('2026-06-03T09:15:00Z');
    const e = moment('2026-06-03T11:30:45Z');
    const d = moment.duration(e.diff(s));
    export const out = \`\${Math.floor(d.asHours())}h \${d.minutes()}m\` + s.format('YYYY-MM-DD HH:mm');
  `,
};

const dir = join(process.cwd(), '.bundle-entries');
mkdirSync(dir, { recursive: true });
const rows = [];
for (const [name, code] of Object.entries(entries)) {
  const f = join(dir, name.replace('/', '_') + '.js');
  writeFileSync(f, code);
  const res = await build({
    entryPoints: [f],
    bundle: true,
    minify: true,
    format: 'esm',
    treeShaking: true,
    write: false,
    legalComments: 'none',
  });
  const bytes = res.outputFiles[0].contents;
  rows.push({
    library: name,
    'min (KB)': (bytes.length / 1024).toFixed(1),
    'min+gzip (KB)': (gzipSync(bytes).length / 1024).toFixed(1),
  });
}
rows.sort((a, b) => parseFloat(a['min+gzip (KB)']) - parseFloat(b['min+gzip (KB)']));
console.table(rows);
