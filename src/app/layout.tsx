import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AccesAR — Plataforma colaborativa de accesibilidad urbana",
  description:
    "AccesAR identifica, visibiliza y mapea barreras urbanas que afectan la accesibilidad y movilidad. Participación ciudadana, datos abiertos e inteligencia artificial para ciudades más inclusivas.",
  applicationName: "AccesAR",
  keywords: [
    "accesibilidad",
    "movilidad reducida",
    "barreras urbanas",
    "ciudad inclusiva",
    "datos abiertos",
    "AccesAR",
    "Buenos Aires",
  ],
  authors: [{ name: "AccesAR" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "AccesAR",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "AccesAR — Ciudades más inclusivas",
    description:
      "Plataforma colaborativa para identificar y visibilizar barreras urbanas que afectan la accesibilidad y movilidad de las personas.",
    siteName: "AccesAR",
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AccesAR — Plataforma colaborativa de accesibilidad urbana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AccesAR — Ciudades más inclusivas",
    description:
      "Plataforma colaborativa para identificar y visibilizar barreras urbanas.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#064e3b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Soporte PWA iOS: pantalla completa */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AccesAR" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
