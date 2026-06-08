import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Chart, InfoButton, type ChartSeries } from '../../../common/components';
import { useDialog } from '../../../common/components';
import { formatTime, toTimestamp } from '../../../common/services/datetime';
import {
  buildProgress,
  buildProjection,
  buildTendency,
  getTotalWeight,
  type BurndownItem,
} from '../domain/burndown';
import styles from './BurndownChart.module.css';

export type BurndownChartProps = {
  startTime: string;
  endTime: string;
  items: BurndownItem[];
  showProjection?: boolean;
  height?: number;
};

export const BurndownChart = forwardRef<HTMLDivElement, BurndownChartProps>(
  function BurndownChart({ startTime, endTime, items, showProjection, height }, ref) {
    const dialog = useDialog();

    // While the projection is live it extends to "now"; re-tick so it keeps
    // moving even when nothing else changes.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
      if (!showProjection) {
        return;
      }
      const id = setInterval(() => setNow(Date.now()), 10_000);
      return () => clearInterval(id);
    }, [showProjection]);

    const series = useMemo<ChartSeries[]>(() => {
      const startTs = toTimestamp(startTime);
      const endTs = toTimestamp(endTime);
      const total = getTotalWeight(items);
      const progress = buildProgress(items, startTs, total);

      const result: ChartSeries[] = [
        {
          id: 'tendency',
          name: 'Tendency',
          color: '#adb5bd',
          data: buildTendency(startTs, endTs, total),
          strokeWidth: 1,
          dashed: true,
        },
        {
          id: 'progress',
          name: 'Your progress',
          color: '#0d6efd',
          data: progress,
          strokeWidth: 2,
        },
      ];

      if (showProjection) {
        const projection = buildProjection(items, progress[progress.length - 1], now);
        if (projection) {
          result.push({
            id: 'projection',
            name: 'Projection',
            color: '#28a745',
            data: projection,
            strokeWidth: 2,
            dashed: true,
          });
        }
      }
      return result;
    }, [startTime, endTime, items, showProjection, now]);

    const xDomain = useMemo<[number, number]>(
      () => [toTimestamp(startTime), toTimestamp(endTime)],
      [startTime, endTime],
    );

    const onInfo = () =>
      dialog.alert({
        title: 'This is your Burndown Chart 📉',
        text: 'The grey line is the ideal tendency from total work down to zero across the event. The blue line steps down as you complete goals. The green projection estimates your next completion. When your progress sits above the tendency line, the event is trending late — so speed up or trim scope.',
        buttonText: 'Got it',
        closeOnOverlayClick: true,
      });

    return (
      <div className={styles.wrapper}>
        <Chart
          ref={ref}
          series={series}
          height={height}
          xDomain={xDomain}
          xTickFormatter={(value) => formatTime(value)}
          renderTooltip={(entries) => (
            <div className={styles.tooltip}>
              {entries.map((entry) => (
                <div key={entry.name} className={styles.tooltipRow}>
                  <span className={styles.dot} style={{ background: entry.color }} />
                  <span>{entry.point.label ?? entry.name}</span>
                  <strong>{entry.point.y ?? '—'}</strong>
                </div>
              ))}
            </div>
          )}
        />
        <div className={styles.info}>
          <InfoButton onClick={onInfo} />
        </div>
      </div>
    );
  },
);
