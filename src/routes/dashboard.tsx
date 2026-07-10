import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import TopCommandBar from "@/components/TopCommandBar";
import LeftIconRail from "@/components/LeftIconRail";
import MainCanvas from "@/components/MainCanvas";
import RightSlidePanel from "@/components/RightSlidePanel";
import StatusTicker from "@/components/StatusTicker";
import CommandPalette from "@/components/CommandPalette";
import ReportPanel from "@/components/ReportPanel";
import AlertBannerStack from "@/components/AlertBannerStack";
import { useDashboardStore } from "@/store/dashboardStore";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardPage,
});

function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const initAlerts = useDashboardStore((s) => s.initAlerts);

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate({ to: "/" });
  }, [isLoaded, isSignedIn, navigate]);

  // Initialise alert state once on mount
  useEffect(() => {
    initAlerts();
  }, [initAlerts]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="font-mono text-accent-cyan">VERIFYING CLEARANCE...</div>
      </div>
    );
  }
  if (!isSignedIn) return null;

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col overflow-hidden">
      <TopCommandBar />
      <AlertBannerStack />
      <div className="flex flex-1 pt-14 pb-7">
        <LeftIconRail />
        <div className="flex-1 ml-16 relative">
          <MainCanvas />
        </div>
        <RightSlidePanel />
      </div>
      <StatusTicker />
      <CommandPalette />
      <ReportPanel />
    </div>
  );
}
