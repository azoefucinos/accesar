import * as React from "react";

/**
 * Logo de AccesAR.
 * Visible en modo claro y oscuro: el fondo usa el color primary (esmeralda)
 * y los trazos internos son blanco, por lo que el contraste se mantiene
 * sin depender de currentColor del contenedor padre.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="AccesAR"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fondo esmeralda solido (siempre visible) */}
      <defs>
        <linearGradient id="accesarLogoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#accesarLogoBg)" />
      {/* persona + silla de ruedas accesible (blanco) */}
      <circle cx="15" cy="13" r="3.1" fill="white" />
      <path
        d="M15 17.5v6m0 0l-3.5 6.5m3.5-6.5l4 3m-4-3l4-3"
        stroke="white"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* rampa accesible */}
      <path
        d="M22 29l9-9"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M20 31h13"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}
