import SunCalc from "suncalc";

export interface WeeklyPoint {
  weekIndex: number;
  date: Date;
  dateLabel: string;
  hours: number | null; // null = polar night (no sun); 0/24 used for midnight sun
  timeLabel: string;
}

export interface ElevationPoint {
  weekIndex: number;
  date: Date;
  dateLabel: string;
  elevation: number;
}

export interface CrossingAnnotation {
  weekIndex: number;
  dateLabel: string;
  x: number;
}

export interface PeakAnnotation {
  weekIndex: number;
  dateLabel: string;
  hours: number;
  type: "max" | "min";
}

const MONTH_NAMES = [
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

export function formatDateLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function hoursToTimeLabel(h: number | null): string {
  if (h === null) return "--:--";
  if (h === 24) return "24:00";
  const normalised = ((h % 24) + 24) % 24;
  const hours = Math.floor(normalised);
  const minutes = Math.round((normalised - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toIANAHours(utcDate: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(utcDate);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  let h = get("hour");
  const m = get("minute");
  const s = get("second");
  if (h === 24) h = 0;
  return h + m / 60 + s / 3600;
}

function isMidnightSun(lat: number, lon: number, date: Date): boolean {
  // Check if the sun is above the horizon at local midnight (00:00 UTC of the given day)
  const midnight = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
    ),
  );
  const pos = SunCalc.getPosition(midnight, lat, lon);
  return pos.altitude > 0;
}

function computeNoonElevation(lat: number, lon: number, date: Date): number {
  const times = SunCalc.getTimes(date, lat, lon);
  const pos = SunCalc.getPosition(times.solarNoon, lat, lon);
  return (pos.altitude * 180) / Math.PI;
}

export function computeWeeklySolar(
  lat: number,
  lon: number,
  year: number,
  timezone: string,
): {
  sunrise: WeeklyPoint[];
  sunset: WeeklyPoint[];
  elevation: ElevationPoint[];
} {
  const sunrise: WeeklyPoint[] = [];
  const sunset: WeeklyPoint[] = [];
  const elevation: ElevationPoint[] = [];

  for (let week = 0; week < 52; week++) {
    const date = new Date(Date.UTC(year, 0, 1 + week * 7, 12, 0, 0));
    const times = SunCalc.getTimes(date, lat, lon);
    const label = formatDateLabel(date);

    const srValid = !Number.isNaN(times.sunrise.getTime());
    const ssValid = !Number.isNaN(times.sunset.getTime());

    let srHours: number | null = null;
    let ssHours: number | null = null;

    if (srValid) {
      srHours = toIANAHours(times.sunrise, timezone);
    } else if (isMidnightSun(lat, lon, date)) {
      // Sun never sets -- treat as sunrise at 00:00
      srHours = 0;
    }
    // else polar night: srHours stays null

    if (ssValid) {
      ssHours = toIANAHours(times.sunset, timezone);
    } else if (isMidnightSun(lat, lon, date)) {
      // Sun never sets -- treat as sunset at 24:00
      ssHours = 24;
    }
    // else polar night: ssHours stays null

    sunrise.push({
      weekIndex: week,
      date,
      dateLabel: label,
      hours: srHours,
      timeLabel: hoursToTimeLabel(srHours),
    });
    sunset.push({
      weekIndex: week,
      date,
      dateLabel: label,
      hours: ssHours,
      timeLabel: hoursToTimeLabel(ssHours),
    });
    const elev = computeNoonElevation(lat, lon, date);
    elevation.push({
      weekIndex: week,
      date,
      dateLabel: label,
      elevation: elev,
    });
  }

  return { sunrise, sunset, elevation };
}

export function findCrossings(
  series1: WeeklyPoint[],
  series2: WeeklyPoint[],
): CrossingAnnotation[] {
  const crossings: CrossingAnnotation[] = [];
  for (let i = 0; i < series1.length - 1; i++) {
    const h1a = series1[i].hours;
    const h2a = series2[i].hours;
    const h1b = series1[i + 1].hours;
    const h2b = series2[i + 1].hours;
    if (h1a === null || h2a === null || h1b === null || h2b === null) continue;
    const d1 = h1a - h2a;
    const d2 = h1b - h2b;
    if (d1 * d2 < 0) {
      const t = d1 / (d1 - d2);
      const crossX = i + t;
      const crossDate = new Date(
        series1[i].date.getTime() +
          t * (series1[i + 1].date.getTime() - series1[i].date.getTime()),
      );
      crossings.push({
        weekIndex: Math.round(crossX),
        dateLabel: formatDateLabel(crossDate),
        x: crossX,
      });
    }
  }
  return crossings;
}

export function findElevationCrossings(
  series1: ElevationPoint[],
  series2: ElevationPoint[],
): CrossingAnnotation[] {
  const crossings: CrossingAnnotation[] = [];
  for (let i = 0; i < series1.length - 1; i++) {
    const d1 = series1[i].elevation - series2[i].elevation;
    const d2 = series1[i + 1].elevation - series2[i + 1].elevation;
    if (d1 * d2 < 0) {
      const t = d1 / (d1 - d2);
      const crossX = i + t;
      const crossDate = new Date(
        series1[i].date.getTime() +
          t * (series1[i + 1].date.getTime() - series1[i].date.getTime()),
      );
      crossings.push({
        weekIndex: Math.round(crossX),
        dateLabel: formatDateLabel(crossDate),
        x: crossX,
      });
    }
  }
  return crossings;
}

export function findPeaks(series: WeeklyPoint[]): {
  max: PeakAnnotation;
  min: PeakAnnotation;
} {
  // Find first non-null index as initial reference
  let maxIdx = -1;
  let minIdx = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i].hours !== null) {
      if (maxIdx === -1) maxIdx = i;
      if (minIdx === -1) minIdx = i;
      break;
    }
  }
  // Fallback if all null (shouldn't happen in practice)
  if (maxIdx === -1) maxIdx = 0;
  if (minIdx === -1) minIdx = 0;

  for (let i = 1; i < series.length; i++) {
    const h = series[i].hours;
    if (h === null) continue;
    if (series[maxIdx].hours === null || h > (series[maxIdx].hours as number))
      maxIdx = i;
    if (series[minIdx].hours === null || h < (series[minIdx].hours as number))
      minIdx = i;
  }
  return {
    max: {
      weekIndex: series[maxIdx].weekIndex,
      dateLabel: series[maxIdx].dateLabel,
      hours: series[maxIdx].hours ?? 0,
      type: "max",
    },
    min: {
      weekIndex: series[minIdx].weekIndex,
      dateLabel: series[minIdx].dateLabel,
      hours: series[minIdx].hours ?? 0,
      type: "min",
    },
  };
}

export function formatDaylightHours(totalHours: number): string {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${h}h ${m}m`;
}
