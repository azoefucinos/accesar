"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DatePreset } from "@/lib/store";
import { Calendar } from "lucide-react";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "180d", label: "6m" },
];

export function DateFilter({
  value,
  onChange,
  className,
}: {
  value: DatePreset;
  onChange: (v: DatePreset) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-input bg-background p-0.5",
        className
      )}
      role="group"
      aria-label="Filtrar por período"
    >
      <Calendar className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-ring",
            value === p.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export const DATE_PRESET_DAYS: Record<DatePreset, number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
};
