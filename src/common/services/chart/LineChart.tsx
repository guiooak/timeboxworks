import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartTooltipEntry, LineChartProps } from './types';

type TooltipPayloadItem = {
  name?: string;
  color?: string;
  stroke?: string;
  payload?: { x: number; y: number | null; label?: string };
};

function buildTooltip(renderTooltip: LineChartProps['renderTooltip']) {
  return function TooltipContent(props: {
    active?: boolean;
    payload?: TooltipPayloadItem[];
  }) {
    if (!props.active || !props.payload?.length || !renderTooltip) {
      return null;
    }
    const entries: ChartTooltipEntry[] = props.payload
      .filter((item) => item.payload)
      .map((item) => ({
        name: item.name ?? '',
        color: item.color ?? item.stroke ?? '#000',
        point: {
          x: item.payload!.x,
          y: item.payload!.y,
          label: item.payload!.label,
        },
      }));
    return <>{renderTooltip(entries)}</>;
  };
}

/** Agnostic multi-series line chart rendered on top of Recharts. */
export function LineChart({
  series,
  height = 280,
  xDomain,
  yDomain = [0, 'auto'],
  xTickFormatter,
  yTickFormatter,
  renderTooltip,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="x"
          type="number"
          domain={xDomain ?? ['dataMin', 'dataMax']}
          tickFormatter={xTickFormatter}
          tick={{ fontSize: 12 }}
          allowDuplicatedCategory={false}
        />
        <YAxis
          type="number"
          domain={yDomain}
          tickFormatter={yTickFormatter}
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        {renderTooltip ? <Tooltip content={buildTooltip(renderTooltip)} /> : null}
        {series.map((line) => (
          <Line
            key={line.id}
            data={line.data}
            dataKey="y"
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth ?? 2}
            strokeDasharray={line.dashed ? '6 4' : undefined}
            connectNulls={line.connectNulls ?? true}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
