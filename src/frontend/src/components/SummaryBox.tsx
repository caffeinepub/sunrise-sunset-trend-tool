import { formatDaylightHours } from "@/utils/solar";
import type { WeeklyPoint } from "@/utils/solar";
import { Clock } from "lucide-react";

interface Props {
  label1: string;
  label2: string;
  sunrise1: WeeklyPoint[];
  sunrise2: WeeklyPoint[];
  sunset1: WeeklyPoint[];
  sunset2: WeeklyPoint[];
  year: number;
}

function computeYearlyDaylight(
  sunrise: WeeklyPoint[],
  sunset: WeeklyPoint[],
): number {
  let total = 0;
  for (let i = 0; i < sunrise.length; i++) {
    total += (sunset[i].hours - sunrise[i].hours) * 7;
  }
  return total;
}

const LOC1 = "#60a5fa";
const LOC2 = "#fb923c";

export default function SummaryBox({
  label1,
  label2,
  sunrise1,
  sunrise2,
  sunset1,
  sunset2,
  year,
}: Props) {
  const d1 = computeYearlyDaylight(sunrise1, sunset1);
  const d2 = computeYearlyDaylight(sunrise2, sunset2);
  const diff = Math.abs(d1 - d2);
  const more = d1 > d2 ? label1 : label2;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 md:p-6"
      data-ocid="summary.panel"
    >
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Yearly Summary — {year}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: `${LOC1}55`, background: `${LOC1}11` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: LOC1 }}
          >
            {label1}
          </p>
          <p className="text-3xl font-bold text-foreground font-mono">
            {formatDaylightHours(d1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            total sun time (sunrise to sunset)
          </p>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: `${LOC2}55`, background: `${LOC2}11` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: LOC2 }}
          >
            {label2}
          </p>
          <p className="text-3xl font-bold text-foreground font-mono">
            {formatDaylightHours(d2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            total sun time (sunrise to sunset)
          </p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground border-t border-border pt-4">
        <span className="font-medium text-foreground">{more}</span> receives{" "}
        <span className="font-medium text-foreground">
          {formatDaylightHours(diff)}
        </span>{" "}
        more sunlight per year.
      </div>
    </div>
  );
}
