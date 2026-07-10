import { useEffect, useState } from "react";
import { TriangleAlert as AlertTriangle, X } from "lucide-react";
import { useDashboardStore, type ActiveAlert } from "@/store/dashboardStore";
import type { CriticalityLevel } from "@/config/intelligenceData";

const LEVEL_COLOR: Record<CriticalityLevel, string> = {
  LOW: "#34D399",
  ELEVATED: "#FFB020",
  HIGH: "#F97316",
  SEVERE: "#EF4444",
};

const LEVEL_BG: Record<CriticalityLevel, string> = {
  LOW: "rgba(52,211,153,0.08)",
  ELEVATED: "rgba(255,176,32,0.08)",
  HIGH: "rgba(249,115,22,0.1)",
  SEVERE: "rgba(239,68,68,0.12)",
};

function SingleAlertBanner({ alert }: { alert: ActiveAlert }) {
  const { dismissAlert } = useDashboardStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const color = LEVEL_COLOR[alert.criticality];
  const bg = LEVEL_BG[alert.criticality];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        background: bg,
        borderBottom: `1px solid ${color}33`,
      }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="font-heading text-[10px] tracking-widest px-1.5 py-px"
            style={{ color, border: `1px solid ${color}66`, background: `${color}11` }}
          >
            {alert.criticality}
          </span>
          <span className="font-mono text-[11px] text-zinc-200 truncate">{alert.locationName}</span>
        </div>
        <div className="font-mono text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
          {alert.headline}
        </div>
      </div>
      <button
        onClick={() => dismissAlert(alert.id)}
        className="shrink-0 mt-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AlertBannerStack() {
  const activeAlerts = useDashboardStore((s) => s.activeAlerts);
  const undismissed = activeAlerts.filter((a) => !a.dismissed);

  if (undismissed.length === 0) return null;

  return (
    <div
      className="fixed top-14 left-16 right-0 z-50 pointer-events-auto"
      style={{
        borderBottom: "1px solid rgba(239,68,68,0.3)",
        background: "rgba(10,14,20,0.97)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 h-6"
        style={{ borderBottom: "1px solid rgba(239,68,68,0.2)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#EF4444", boxShadow: "0 0 6px #EF4444" }}
        />
        <span className="font-mono text-[9px] text-zinc-500 tracking-widest">ACTIVE ALERTS — {undismissed.length} UNACKNOWLEDGED</span>
      </div>
      {undismissed.map((a) => (
        <SingleAlertBanner key={a.id} alert={a} />
      ))}
    </div>
  );
}

export default AlertBannerStack;
