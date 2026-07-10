import { useState, useEffect, useRef } from "react";

const FEED_ITEMS = [
  "SYS NOMINAL",
  "3 ACTIVE FEEDS",
  "LAST SYNC 00:00:12 AGO",
  "UPLINK ENCRYPTED :: AES-256",
  "SAT-LINK STABLE",
  "NO THREATS DETECTED",
  "GEO-MESH RESOLUTION 0.25°",
  "TELEMETRY FLOW NOMINAL",
  "BUFFER HEALTH 98%",
  "NODE LATENCY 12ms",
];

function StatusTicker() {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

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

  const liveFeed = FEED_ITEMS.map((item) =>
    item.startsWith("LAST SYNC") ? `LAST SYNC ${fmt(secondsAgo)} AGO` : item,
  );
  const display = [...liveFeed, ...liveFeed];

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 h-7 flex items-center bg-bg-panel/90 backdrop-blur-md overflow-hidden"
      style={{ borderTop: "1px solid var(--border-hair)" }}
    >
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
      <div ref={tickerRef} className="flex-1 overflow-hidden whitespace-nowrap">
        <div
          className="inline-block font-mono text-[11px] text-zinc-500"
          style={{ animation: "tickerScroll 40s linear infinite" }}
        >
          {display.map((item, i) => (
            <span key={i} className="mx-6">
              <span className="text-accent-cyan/60">{">"}</span> {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default StatusTicker;
