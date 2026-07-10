import { useState, useEffect, useRef, useCallback } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { LOCATION_INTELLIGENCE } from "@/config/intelligenceData";
import { LOCATIONS } from "@/config/locations";
import type { CriticalityLevel } from "@/config/intelligenceData";
import type { LocationId } from "@/config/locations";

const SYSTEM_ITEMS = [
  "SYS NOMINAL",
  "3 ACTIVE FEEDS",
  "LAST SYNC 00:00:12 AGO",
  "UPLINK ENCRYPTED :: AES-256",
  "SAT-LINK STABLE",
  "GEO-MESH RESOLUTION 0.25°",
  "TELEMETRY FLOW NOMINAL",
  "BUFFER HEALTH 98%",
  "NODE LATENCY 12ms",
];

const LEVEL_COLOR: Record<CriticalityLevel, string> = {
  LOW: "#34D399",
  ELEVATED: "#FFB020",
  HIGH: "#F97316",
  SEVERE: "#EF4444",
};

interface AlertFeedItem {
  kind: "alert";
  locationId: LocationId;
  locationName: string;
  criticality: CriticalityLevel;
  text: string;
}

interface SysItem {
  kind: "sys";
  text: string;
}

type FeedItem = AlertFeedItem | SysItem;

function buildAlertItems(): AlertFeedItem[] {
  return LOCATIONS.flatMap((loc) => {
    const intel = LOCATION_INTELLIGENCE[loc.id];
    if (!intel) return [];
    if (intel.criticality === "LOW") return [];
    const newsLine = intel.news[0]?.headline ?? intel.criticalityJustification;
    const trimmed = newsLine.length > 80 ? newsLine.slice(0, 77) + "…" : newsLine;
    return [
      {
        kind: "alert" as const,
        locationId: loc.id,
        locationName: loc.name,
        criticality: intel.criticality,
        text: trimmed,
      },
    ];
  });
}

function StatusTicker() {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const { selectLocation, setLayersPanelOpen } = useDashboardStore();

  useEffect(() => {
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const alertItems = buildAlertItems();

  // Build combined display — alerts first, then sys items, doubled for seamless loop
  const feedItems: FeedItem[] = [
    ...alertItems,
    ...SYSTEM_ITEMS.map((t) => ({
      kind: "sys" as const,
      text: t.startsWith("LAST SYNC") ? `LAST SYNC ${fmt(secondsAgo)} AGO` : t,
    })),
  ];
  const display = [...feedItems, ...feedItems];

  const handleAlertClick = useCallback(
    (item: AlertFeedItem) => {
      selectLocation(item.locationId);
      setLayersPanelOpen(true);
    },
    [selectLocation, setLayersPanelOpen],
  );

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 h-7 flex items-center bg-bg-panel/90 backdrop-blur-md overflow-hidden"
      style={{ borderTop: "1px solid var(--border-hair)" }}
    >
      {/* Label */}
      <div
        className="flex items-center gap-2 px-3 h-full shrink-0"
        style={{ borderRight: "1px solid rgba(45,229,217,0.15)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"
          style={{ boxShadow: "0 0 6px var(--accent-cyan)" }}
        />
        <span className="font-mono text-[10px] text-zinc-500 tracking-widest">FEED</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <div
          className="inline-flex items-center font-mono text-[11px]"
          style={{ animation: "tickerScroll 60s linear infinite" }}
        >
          {display.map((item, i) => {
            if (item.kind === "alert") {
              const color = LEVEL_COLOR[item.criticality];
              return (
                <button
                  key={i}
                  onClick={() => handleAlertClick(item)}
                  className="mx-5 inline-flex items-center gap-1.5 group hover:opacity-90 transition-opacity"
                  style={{ pointerEvents: "auto" }}
                >
                  <span
                    className="font-heading text-[10px] tracking-widest px-1 py-px"
                    style={{ color, border: `1px solid ${color}66` }}
                  >
                    [{item.criticality}]
                  </span>
                  <span className="text-zinc-300 group-hover:text-white transition-colors">
                    {item.locationName}
                  </span>
                  <span className="text-zinc-500">—</span>
                  <span className="text-zinc-500 max-w-[280px] truncate">{item.text}</span>
                </button>
              );
            }
            return (
              <span key={i} className="mx-6 text-zinc-500">
                <span className="text-accent-cyan/60">{">"}</span> {item.text}
              </span>
            );
          })}
        </div>
      </div>
    </footer>
  );
}

export default StatusTicker;
