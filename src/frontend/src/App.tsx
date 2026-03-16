import ElevationChart from "@/components/ElevationChart";
import PlaceInputForm from "@/components/PlaceInputForm";
import SummaryBox from "@/components/SummaryBox";
import SunChart from "@/components/SunChart";
import { geocodePlace } from "@/utils/geocode";
import {
  computeWeeklySolar,
  findCrossings,
  findElevationCrossings,
  findPeaks,
} from "@/utils/solar";
import type {
  CrossingAnnotation,
  ElevationPoint,
  PeakAnnotation,
  WeeklyPoint,
} from "@/utils/solar";
import { AlertCircle, Sun, Sunrise, Sunset } from "lucide-react";
import { useState } from "react";

interface ChartData {
  label1: string;
  label2: string;
  tz1: string;
  tz2: string;
  sunrise1: WeeklyPoint[];
  sunrise2: WeeklyPoint[];
  sunset1: WeeklyPoint[];
  sunset2: WeeklyPoint[];
  elevation1: ElevationPoint[];
  elevation2: ElevationPoint[];
  sunriseCrossings: CrossingAnnotation[];
  sunsetCrossings: CrossingAnnotation[];
  elevationCrossings: CrossingAnnotation[];
  sunrisePeaks1: { max: PeakAnnotation; min: PeakAnnotation };
  sunrisePeaks2: { max: PeakAnnotation; min: PeakAnnotation };
  sunsetPeaks1: { max: PeakAnnotation; min: PeakAnnotation };
  sunsetPeaks2: { max: PeakAnnotation; min: PeakAnnotation };
}

export default function App() {
  const currentYear = new Date().getFullYear();
  const [place1, setPlace1] = useState("Riniken Switzerland");
  const [place2, setPlace2] = useState("Kaustinen Finland");
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setChartData(null);
    try {
      const [geo1, geo2] = await Promise.all([
        geocodePlace(place1),
        geocodePlace(place2),
      ]);
      const solar1 = computeWeeklySolar(
        geo1.lat,
        geo1.lon,
        year,
        geo1.timezone,
      );
      const solar2 = computeWeeklySolar(
        geo2.lat,
        geo2.lon,
        year,
        geo2.timezone,
      );
      setChartData({
        label1: place1.trim(),
        label2: place2.trim(),
        tz1: geo1.timezone,
        tz2: geo2.timezone,
        sunrise1: solar1.sunrise,
        sunrise2: solar2.sunrise,
        sunset1: solar1.sunset,
        sunset2: solar2.sunset,
        elevation1: solar1.elevation,
        elevation2: solar2.elevation,
        sunriseCrossings: findCrossings(solar1.sunrise, solar2.sunrise),
        sunsetCrossings: findCrossings(solar1.sunset, solar2.sunset),
        elevationCrossings: findElevationCrossings(
          solar1.elevation,
          solar2.elevation,
        ),
        sunrisePeaks1: findPeaks(solar1.sunrise),
        sunrisePeaks2: findPeaks(solar2.sunrise),
        sunsetPeaks1: findPeaks(solar1.sunset),
        sunsetPeaks2: findPeaks(solar2.sunset),
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sun className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Teemu's Astronomical tool
            </h1>
            <p className="text-xs text-muted-foreground">
              Compare sunrise, sunset &amp; solar elevation across locations
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-card rounded-2xl border border-border p-6 shadow-xs">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Configure Locations
          </h2>
          <PlaceInputForm
            place1={place1}
            place2={place2}
            year={year}
            loading={loading}
            onPlace1Change={setPlace1}
            onPlace2Change={setPlace2}
            onYearChange={setYear}
            onGenerate={handleGenerate}
          />
        </section>

        {loading && (
          <div
            data-ocid="app.loading_state"
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sun className="absolute inset-0 m-auto w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Geocoding locations, resolving timezones, computing solar data...
            </p>
          </div>
        )}

        {error && !loading && (
          <div
            data-ocid="app.error_state"
            className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-5 text-destructive"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && !chartData && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex gap-4">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Sunrise className="w-10 h-10 text-primary/80" />
              </div>
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Sunset className="w-10 h-10 text-primary/80" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Ready to explore solar patterns
              </h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                Enter two locations above and click Generate Charts to compare
                their sunrise, sunset and elevation trends.
              </p>
            </div>
          </div>
        )}

        {chartData && !loading && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-4 h-0.5"
                  style={{ background: "var(--loc1)" }}
                />
                <span className="text-foreground font-medium">
                  {chartData.label1}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({chartData.tz1})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-4 h-0.5"
                  style={{ background: "var(--loc2)" }}
                />
                <span className="text-foreground font-medium">
                  {chartData.label2}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({chartData.tz2})
                </span>
              </div>
              <span className="text-muted-foreground text-sm ml-auto">
                {year}
              </span>
            </div>

            <SunChart
              title="🌅 Sunrise Trends"
              dataOcid="sunrise.chart_point"
              chartType="sunrise"
              series1={chartData.sunrise1}
              series2={chartData.sunrise2}
              label1={chartData.label1}
              label2={chartData.label2}
              crossings={chartData.sunriseCrossings}
              peaks1={chartData.sunrisePeaks1}
              peaks2={chartData.sunrisePeaks2}
            />

            <SunChart
              title="🌇 Sunset Trends"
              dataOcid="sunset.chart_point"
              chartType="sunset"
              series1={chartData.sunset1}
              series2={chartData.sunset2}
              label1={chartData.label1}
              label2={chartData.label2}
              crossings={chartData.sunsetCrossings}
              peaks1={chartData.sunsetPeaks1}
              peaks2={chartData.sunsetPeaks2}
            />

            <ElevationChart
              series1={chartData.elevation1}
              series2={chartData.elevation2}
              label1={chartData.label1}
              label2={chartData.label2}
              crossings={chartData.elevationCrossings}
            />

            <SummaryBox
              label1={chartData.label1}
              label2={chartData.label2}
              sunrise1={chartData.sunrise1}
              sunrise2={chartData.sunrise2}
              sunset1={chartData.sunset1}
              sunset2={chartData.sunset2}
              year={year}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline underline-offset-2 hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
