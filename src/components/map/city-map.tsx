"use client";

import * as React from "react";
import dynamic from "next/dynamic";

// Leaflet accede a `window` al importarse, por lo que debe cargarse
// exclusivamente en el cliente (ssr: false) para no romper el SSR de Next.js.

const InnerCityMap = dynamic(
  () => import("./city-map-inner").then((m) => m.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] min-h-[420px] w-full items-center justify-center rounded-xl border border-border bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Cargando mapa…</span>
        </div>
      </div>
    ),
  }
);

const InnerLocationPicker = dynamic(
  () => import("./city-map-inner").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-border bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Cargando mapa…</span>
        </div>
      </div>
    ),
  }
);

type CityMapProps = React.ComponentProps<
  typeof import("./city-map-inner").CityMap
>;
type LocationPickerProps = React.ComponentProps<
  typeof import("./city-map-inner").LocationPicker
>;

export function CityMap(props: CityMapProps) {
  return <InnerCityMap {...props} />;
}

export function LocationPicker(props: LocationPickerProps) {
  return <InnerLocationPicker {...props} />;
}
