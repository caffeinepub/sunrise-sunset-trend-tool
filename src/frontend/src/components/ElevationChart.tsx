import type { CrossingAnnotation, ElevationPoint } from "@/utils/solar";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  series1: ElevationPoint[];
  series2: ElevationPoint[];
  label1: string;
  label2: string;
  crossings: CrossingAnnotation[];
}

const LOC1 = "#60a5fa";
const LOC2 = "#fb923c";
const GRID = "rgba(255,255,255,0.08)";
const TICK = "#94a3b8";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}:{" "}
            <span className="font-mono">{Number(entry.value).toFixed(1)}°</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ElevationChart({
  series1,
  series2,
  label1,
  label2,
  crossings,
}: Props) {
  const data = series1.map((pt, i) => ({
    weekIndex: pt.weekIndex,
    dateLabel: pt.dateLabel,
    elev1: Number.parseFloat(pt.elevation.toFixed(2)),
    elev2: Number.parseFloat(series2[i].elevation.toFixed(2)),
  }));

  const xTicks: number[] = [];
  let lastMonth = -1;
  for (const pt of series1) {
    const month = pt.date.getMonth();
    if (month !== lastMonth) {
      xTicks.push(pt.weekIndex);
      lastMonth = month;
    }
  }

  const xTickFmt = (idx: number) => {
    const pt = series1[idx];
    return pt ? MONTHS[pt.date.getMonth()] : "";
  };

  let max1 = 0;
  let min1 = 0;
  let max2 = 0;
  let min2 = 0;
  for (let i = 1; i < series1.length; i++) {
    if (series1[i].elevation > series1[max1].elevation) max1 = i;
    if (series1[i].elevation < series1[min1].elevation) min1 = i;
  }
  for (let i = 1; i < series2.length; i++) {
    if (series2[i].elevation > series2[max2].elevation) max2 = i;
    if (series2[i].elevation < series2[min2].elevation) min2 = i;
  }

  const allElevs = [
    ...series1.map((p) => p.elevation),
    ...series2.map((p) => p.elevation),
  ];
  const yMin = Math.floor(Math.min(...allElevs) / 5) * 5 - 5;
  const yMax = Math.ceil(Math.max(...allElevs) / 5) * 5 + 5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / 10) * 10; v <= yMax; v += 10) yTicks.push(v);

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 md:p-6"
      data-ocid="elevation.chart_point"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        ☀️ Max Solar Elevation at Noon
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 40, bottom: 20, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis
            dataKey="weekIndex"
            ticks={xTicks}
            tickFormatter={xTickFmt}
            tick={{ fontSize: 12, fill: TICK }}
            axisLine={{ stroke: GRID }}
            tickLine={{ stroke: GRID }}
            label={{
              value: "Week",
              position: "insideBottom",
              offset: -10,
              fontSize: 12,
              fill: TICK,
            }}
          />
          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            tickFormatter={(v) => `${v}°`}
            tick={{ fontSize: 12, fill: TICK }}
            axisLine={{ stroke: GRID }}
            tickLine={{ stroke: GRID }}
            width={55}
            label={{
              value: "Degrees",
              angle: -90,
              position: "insideLeft",
              offset: -10,
              fontSize: 12,
              fill: TICK,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 13, color: TICK }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="elev1"
            name={label1}
            stroke={LOC1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="elev2"
            name={label2}
            stroke={LOC2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          {crossings.map((c) => (
            <ReferenceLine
              key={`ec-${c.weekIndex}`}
              x={c.weekIndex}
              stroke={TICK}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{
                value: c.dateLabel,
                position: "top",
                fontSize: 11,
                fill: TICK,
              }}
            />
          ))}
          <ReferenceDot
            x={series1[max1].weekIndex}
            y={Number.parseFloat(series1[max1].elevation.toFixed(2))}
            r={5}
            fill={LOC1}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: `${series1[max1].elevation.toFixed(1)}°`,
              position: "top",
              fontSize: 11,
              fill: LOC1,
            }}
          />
          <ReferenceDot
            x={series1[min1].weekIndex}
            y={Number.parseFloat(series1[min1].elevation.toFixed(2))}
            r={5}
            fill={LOC1}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: `${series1[min1].elevation.toFixed(1)}°`,
              position: "bottom",
              fontSize: 11,
              fill: LOC1,
            }}
          />
          <ReferenceDot
            x={series2[max2].weekIndex}
            y={Number.parseFloat(series2[max2].elevation.toFixed(2))}
            r={5}
            fill={LOC2}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: `${series2[max2].elevation.toFixed(1)}°`,
              position: "top",
              fontSize: 11,
              fill: LOC2,
            }}
          />
          <ReferenceDot
            x={series2[min2].weekIndex}
            y={Number.parseFloat(series2[min2].elevation.toFixed(2))}
            r={5}
            fill={LOC2}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: `${series2[min2].elevation.toFixed(1)}°`,
              position: "bottom",
              fontSize: 11,
              fill: LOC2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
