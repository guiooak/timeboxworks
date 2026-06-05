import { forwardRef } from 'react';
import { LineChart, type LineChartProps } from '../../services/chart';
import styles from './Chart.module.css';

export type ChartProps = LineChartProps;

/**
 * Agnostic chart surface used by features. Wraps the chart service primitive
 * and exposes a ref to the rendered container (for image export).
 */
export const Chart = forwardRef<HTMLDivElement, ChartProps>(function Chart(props, ref) {
  return (
    <div className={styles.chart} ref={ref}>
      <LineChart {...props} />
    </div>
  );
});
