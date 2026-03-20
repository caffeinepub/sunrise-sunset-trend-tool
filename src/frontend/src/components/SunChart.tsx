import { useIsMobile } from "@/hooks/use-mobile";
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
  hours1: number | null;
  hours2: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}:{" "}
            <span className="font-mono">
              {entry.value !== null && entry.value !== undefined
                ? hoursToTimeLabel(entry.value)
                : "Polar night"}
            </span>
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
  const isMobile = useIsMobile();

  const chartHeight = isMobile ? 260 : 360;
  const marginLeft = isMobile ? 10 : 20;
  const marginRight = isMobile ? 10 : 40;
  const yAxisWidth = isMobile ? 48 : 55;
  const tickFontSize = isMobile ? 10 : 12;
  const annotFontSize = isMobile ? 9 : 11;
  const legendFontSize = isMobile ? 11 : 13;

  const data: ChartEntry[] = series1.map((pt, i) => ({
    weekIndex: pt.weekIndex,
    dateLabel: pt.dateLabel,
    hours1: pt.hours,
    hours2: series2[i].hours,
  }));

  // Compute dynamic Y-axis bounds from non-null data only
  const allHours = data
    .flatMap((d) => [d.hours1, d.hours2])
    .filter((h): h is number => h !== null);
  const dataMin = allHours.length > 0 ? Math.min(...allHours) : 0;
  const dataMax = allHours.length > 0 ? Math.max(...allHours) : 24;

  let yMin: number;
  let yMax: number;

  if (chartType === "sunrise") {
    yMin = 0;
    yMax = Math.ceil(dataMax);
  } else {
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

  const visibleXTicks = isMobile
    ? xTicks.filter((_, i) => i % 2 === 0)
    : xTicks;

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
      className="rounded-xl border border-border bg-card p-3 md:p-6"
      data-ocid={dataOcid}
    >
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{
            top: isMobile ? 14 : 20,
            right: marginRight,
            bottom: isMobile ? 16 : 20,
            left: marginLeft,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="weekIndex"
            ticks={visibleXTicks}
            tickFormatter={xTickFormatter}
            tick={{ fontSize: tickFontSize, fill: TICK_COLOR }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={{ stroke: GRID_COLOR }}
          />
          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            tickFormatter={yTickFormatter}
            tick={{
              fontSize: tickFontSize,
              fontFamily: "'DM Mono', monospace",
              fill: TICK_COLOR,
            }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={{ stroke: GRID_COLOR }}
            width={yAxisWidth}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: legendFontSize, color: TICK_COLOR }}>
                {value}
              </span>
            )}
            wrapperStyle={{
              fontSize: legendFontSize,
              paddingTop: isMobile ? 4 : 8,
            }}
          />

          <Line
            type="monotone"
            dataKey="hours1"
            name={label1}
            stroke={LOC1_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: isMobile ? 4 : 5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="hours2"
            name={label2}
            stroke={LOC2_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: isMobile ? 4 : 5 }}
            connectNulls={false}
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
                fontSize: annotFontSize,
                fill: CROSSING_COLOR,
                fontFamily: "'DM Mono', monospace",
              }}
            />
          ))}

          <ReferenceDot
            x={peaks1.max.weekIndex}
            y={peaks1.max.hours}
            r={isMobile ? 4 : 5}
            fill={LOC1_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks1.max.dateLabel,
              position: "top",
              fontSize: annotFontSize,
              fill: LOC1_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <ReferenceDot
            x={peaks1.min.weekIndex}
            y={peaks1.min.hours}
            r={isMobile ? 4 : 5}
            fill={LOC1_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks1.min.dateLabel,
              position: "bottom",
              fontSize: annotFontSize,
              fill: LOC1_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />

          <ReferenceDot
            x={peaks2.max.weekIndex}
            y={peaks2.max.hours}
            r={isMobile ? 4 : 5}
            fill={LOC2_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks2.max.dateLabel,
              position: "top",
              fontSize: annotFontSize,
              fill: LOC2_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <ReferenceDot
            x={peaks2.min.weekIndex}
            y={peaks2.min.hours}
            r={isMobile ? 4 : 5}
            fill={LOC2_COLOR}
            stroke="#1e293b"
            strokeWidth={2}
            label={{
              value: peaks2.min.dateLabel,
              position: "bottom",
              fontSize: annotFontSize,
              fill: LOC2_COLOR,
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
