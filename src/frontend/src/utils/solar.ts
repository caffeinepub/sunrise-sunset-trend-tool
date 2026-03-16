import SunCalc from "suncalc";

export interface WeeklyPoint {
  weekIndex: number;
  date: Date;
  dateLabel: string;
  hours: number;
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

export function hoursToTimeLabel(h: number): string {
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
    const srHours = toIANAHours(times.sunrise, timezone);
    const ssHours = toIANAHours(times.sunset, timezone);
    const label = formatDateLabel(date);
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
    const d1 = series1[i].hours - series2[i].hours;
    const d2 = series1[i + 1].hours - series2[i + 1].hours;
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
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < series.length; i++) {
    if (series[i].hours > series[maxIdx].hours) maxIdx = i;
    if (series[i].hours < series[minIdx].hours) minIdx = i;
  }
  return {
    max: {
      weekIndex: series[maxIdx].weekIndex,
      dateLabel: series[maxIdx].dateLabel,
      hours: series[maxIdx].hours,
      type: "max",
    },
    min: {
      weekIndex: series[minIdx].weekIndex,
      dateLabel: series[minIdx].dateLabel,
      hours: series[minIdx].hours,
      type: "min",
    },
  };
}

export function formatDaylightHours(totalHours: number): string {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${h}h ${m}m`;
}
