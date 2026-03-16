import { hoursToTimeLabel } from "@/utils/solar";
import type {
  CrossingAnnotation,
  PeakAnnotation,
  WeeklyPoint,
} from "@/utils/solar";
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
  title: string;
  dataOcid: string;
  chartType: "sunrise" | "sunset";
  series1: WeeklyPoint[];
  series2: WeeklyPoint[];
  label1: string;
  label2: string;
  crossings: CrossingAnnotation[];
  peaks1: { max: PeakAnnotation; min: PeakAnnotation };
  peaks2: { max: PeakAnnotation; min: PeakAnnotation };
}

const LOC1_COLOR = "#60a5fa";
const LOC2_COLOR = "#fb923c";
const GRID_COLOR = "rgba(255,255,255,0.08)";
const TICK_COLOR = "#94a3b8";
const CROSSING_COLOR = "#94a3b8";

interface ChartEntry {
  weekIndex: number;
  dateLabel: string;
  hours1: number;
  hours2: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}:{" "}
            <span className="font-mono">{hoursToTimeLabel(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SunChart({
  title,
  dataOcid,
  chartType,
  series1,
  series2,
  label1,
  label2,
  crossings,
  peaks1,
  peaks2,
}: Props) {
  const data: ChartEntry[] = series1.map((pt, i) => ({
    weekIndex: pt.weekIndex,
    dateLabel: pt.dateLabel,
    hours1: pt.hours,
    hours2: series2[i].hours,
  }));

  // Compute dynamic Y-axis bounds from actual data
  const allHours = data.flatMap((d) => [d.hours1, d.hours2]);
  const dataMin = Math.min(...allHours);
  const dataMax = Math.max(...allHours);

  let yMin: number;
  let yMax: number;

  if (chartType === "sunrise") {
    // Always start from midnight (0), end at ceiling of max sunrise hour
    yMin = 0;
    yMax = Math.ceil(dataMax);
  } else {
    // Always end at midnight (24), start at floor of min sunset hour
    yMin = Math.floor(dataMin);
    yMax = 24;
  }

  // Build 1-hour increment ticks
  const tickCount = yMax - yMin + 1;
  const yTicks = Array.from({ length: tickCount }, (_, i) => yMin + i);

  const xTicks: number[] = [];
  let lastMonth = -1;
  for (const pt of series1) {
    const month = pt.date.getMonth();
    if (month !== lastMonth) {
      xTicks.push(pt.weekIndex);
      lastMonth = month;
    }
  }

  const xTickFormatter = (idx: number) => {
    const pt = series1[idx];
    if (!pt) return "";
    const months = [
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
    return months[pt.date.getMonth()];
  };

  const yTickFormatter = (h: number) => hoursToTimeLabel(h);

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 md:p-6"
      data-ocid={dataOcid}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 40, bottom: 20, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="weekIndex"
            ticks={xTicks}
            tickFormatter={xTickFormatter}
            tick={{ fontSize: 12, fill: TICK_COLOR }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={{ stroke: GRID_COLOR }}
            label={{
              value: "Week",
              position: "insideBottom",
              offset: -10,
              fontSize: 12,
              fill: TICK_COLOR,
            }}
          />
          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            tickFormatter={yTickFormatter}
            tick={{
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              fill: TICK_COLOR,
            }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={{ stroke: GRID_COLOR }}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 13, color: TICK_COLOR }}>{value}</span>
            )}
          />

          <Line
            type="monotone"
            dataKey="hours1"
            name={label1}
            stroke={LOC1_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="hours2"
            name={label2}
            stroke={LOC2_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />

          {crossings.map((c) => (
            <ReferenceLine
              key={`cross-${c.weekIndex}-${c.dateLabel}`}
              x={c.weekIndex}
              stroke={CROSSING_COLOR}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{
                value: c.dateLabel,
                position: "top",
                fontSize: 11,
                fill: CROSSING_COLOR,
                fontFamily: "'DM Mono', monospace",
              }}
            />
          ))}

          <ReferenceDot
            x={peaks1.max.weekIndex}
            y={peaks1.max.hours}
            r={5}
            fill={LOC1_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks1.max.dateLabel,
              position: "top",
              fontSize: 11,
              fill: LOC1_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <ReferenceDot
            x={peaks1.min.weekIndex}
            y={peaks1.min.hours}
            r={5}
            fill={LOC1_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks1.min.dateLabel,
              position: "bottom",
              fontSize: 11,
              fill: LOC1_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />

          <ReferenceDot
            x={peaks2.max.weekIndex}
            y={peaks2.max.hours}
            r={5}
            fill={LOC2_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks2.max.dateLabel,
              position: "top",
              fontSize: 11,
              fill: LOC2_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <ReferenceDot
            x={peaks2.min.weekIndex}
            y={peaks2.min.hours}
            r={5}
            fill={LOC2_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks2.min.dateLabel,
              position: "bottom",
              fontSize: 11,
              fill: LOC2_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
