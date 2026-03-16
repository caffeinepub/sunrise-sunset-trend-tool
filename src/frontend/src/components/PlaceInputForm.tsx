import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Sun } from "lucide-react";

interface Props {
  place1: string;
  place2: string;
  year: number;
  loading: boolean;
  onPlace1Change: (v: string) => void;
  onPlace2Change: (v: string) => void;
  onYearChange: (v: number) => void;
  onGenerate: () => void;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

export default function PlaceInputForm({
  place1,
  place2,
  year,
  loading,
  onPlace1Change,
  onPlace2Change,
  onYearChange,
  onGenerate,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: "var(--loc1)" }}
            />
            Location 1
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="place.input.1"
              className="pl-9"
              placeholder="e.g. Riniken Switzerland"
              value={place1}
              onChange={(e) => onPlace1Change(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && onGenerate()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: "var(--loc2)" }}
            />
            Location 2
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="place.input.2"
              className="pl-9"
              placeholder="e.g. Kaustinen Finland"
              value={place2}
              onChange={(e) => onPlace2Change(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && onGenerate()}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Year</Label>
          <Select
            value={String(year)}
            onValueChange={(v) => onYearChange(Number(v))}
            disabled={loading}
          >
            <SelectTrigger data-ocid="year.select" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          data-ocid="generate.primary_button"
          onClick={onGenerate}
          disabled={loading || !place1.trim() || !place2.trim()}
          className="flex items-center gap-2 px-8"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          {loading ? "Computing..." : "Generate Charts"}
        </Button>
      </div>
    </div>
  );
}
