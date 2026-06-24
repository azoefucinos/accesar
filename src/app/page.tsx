"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, MobileNav } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAppStore } from "@/lib/store";
import { useUrlSync } from "@/hooks/use-url-sync";
import { HomeView } from "@/components/views/home-view";
import { MapView } from "@/components/views/map-view";
import { ReportView } from "@/components/views/report-view";
import { IndexView } from "@/components/views/index-view";
import { StatsView } from "@/components/views/stats-view";
import { AboutView } from "@/components/views/about-view";
import { NeighborhoodView } from "@/components/views/neighborhood-view";
import { DeeplinkReportDialog } from "@/components/deeplink-report-dialog";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { SearchCommand } from "@/components/search-command";

const viewVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const viewTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };

export default function Home() {
  const view = useAppStore((s) => s.view);
  useUrlSync();

  const View = (() => {
    switch (view) {
      case "home":
        return <HomeView />;
      case "mapa":
        return <MapView />;
      case "reportar":
        return <ReportView />;
      case "indice":
        return <IndexView />;
      case "estadisticas":
        return <StatsView />;
      case "sobre":
        return <AboutView />;
      case "barrio":
        return <NeighborhoodView />;
      default:
        return <HomeView />;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={viewTransition}
          >
            {View}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileNav />
      <DeeplinkReportDialog />
      <OnboardingDialog />
      <SearchCommand />
    </div>
  );
}
