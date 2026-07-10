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


export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardPage,
});

function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate({ to: "/" });
  }, [isLoaded, isSignedIn, navigate]);

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
