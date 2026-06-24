"use client";

import { useEffect } from "react";

/**
 * Registra el service worker para soporte PWA.
 * Solo en producción para evitar problemas con hot reload en dev.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Verificar actualizaciones cada 1h
          reg.update();
        })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    };

    // Registrar después del primer idle para no bloquear el primer render
    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(register);
    } else {
      setTimeout(register, 1000);
    }
  }, []);

  return null;
}
