import type { ReactNode } from 'react';

export type ChartPoint = {
  x: number;
  y: number | null;
  label?: string;
};

export type ChartSeries = {
  id: string;
  name: string;
  color: string;
  data: ChartPoint[];
  strokeWidth?: number;
  dashed?: boolean;
  connectNulls?: boolean;
};

export type ChartTooltipEntry = {
  name: string;
  color: string;
  point: ChartPoint;
};

export type LineChartProps = {
  series: ChartSeries[];
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number | 'auto'];
  xTickFormatter?: (value: number) => string;
  yTickFormatter?: (value: number) => string;
  renderTooltip?: (entries: ChartTooltipEntry[]) => ReactNode;
};
