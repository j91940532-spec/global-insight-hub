import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Command, MapPin, Globe as GlobeIcon } from "lucide-react";
import { useDashboardStore, PIN_CATEGORY_META } from "@/store/dashboardStore";
import { LOCATIONS } from "@/config/locations";

type Result =
  | { kind: "location"; id: string; label: string; sub: string }
  | { kind: "pin"; id: string; label: string; sub: string; color: string };

function CommandPalette() {
  const { commandOpen, setCommandOpen, pins, selectLocation, selectPin } = useDashboardStore();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!useDashboardStore.getState().commandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  useEffect(() => {
    if (commandOpen) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [commandOpen]);

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    const locs: Result[] = LOCATIONS.map((l) => ({
      kind: "location" as const,
      id: l.id,
      label: l.name,
      sub: `${l.region} · ${l.lat.toFixed(2)}°, ${l.lon.toFixed(2)}°`,
    }));
    const pinResults: Result[] = pins.map((p) => ({
      kind: "pin" as const,
      id: p.id,
      label: p.label,
      sub: `${PIN_CATEGORY_META[p.category].label} · ${p.lat.toFixed(2)}°, ${p.lon.toFixed(2)}°`,
      color: PIN_CATEGORY_META[p.category].color,
    }));
    const all = [...locs, ...pinResults];
    if (!needle) return all;
    return all.filter(
      (r) => r.label.toLowerCase().includes(needle) || r.sub.toLowerCase().includes(needle),
    );
  }, [q, pins]);

  const activate = (r: Result) => {
    if (r.kind === "location") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectLocation(r.id as any);
    } else {
      selectPin(r.id);
    }
    setCommandOpen(false);
  };

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4 animate-in fade-in duration-150"
      style={{ background: "rgba(5,7,10,0.7)", backdropFilter: "blur(4px)" }}
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10,14,20,0.98)",
          border: "1px solid var(--accent-cyan)",
          boxShadow: "0 0 40px rgba(45,229,217,0.25)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 h-12"
          style={{ borderBottom: "1px solid rgba(45,229,217,0.2)" }}
        >
          <Search className="w-4 h-4 text-accent-cyan" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                if (results[idx]) activate(results[idx]);
              }
            }}
            placeholder="Search locations and pins…"
            className="flex-1 bg-transparent outline-none font-mono text-sm text-zinc-100 placeholder-zinc-600"
            style={{ caretColor: "var(--accent-cyan)" }}
          />
          <span
            className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 px-2 py-1"
            style={{ border: "1px solid var(--border-hair)" }}
          >
            <Command className="w-3 h-3" />K
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && (
            <div className="px-4 py-6 font-mono text-xs text-zinc-600 text-center">
              NO SIGNAL — nothing matches "{q}"
            </div>
          )}
          {results.map((r, i) => {
            const active = i === idx;
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => activate(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background: active ? "rgba(45,229,217,0.08)" : "transparent",
                  borderLeft: active ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                }}
              >
                {r.kind === "location" ? (
                  <GlobeIcon
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--accent-cyan)" }}
                    strokeWidth={1.5}
                  />
                ) : (
                  <MapPin
                    className="w-4 h-4 shrink-0"
                    style={{ color: r.color }}
                    strokeWidth={2}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-sm text-zinc-100 truncate">{r.label}</div>
                  <div className="font-mono text-[10px] text-zinc-500 truncate">{r.sub}</div>
                </div>
                <span className="font-mono text-[9px] text-zinc-600 tracking-widest">
                  {r.kind === "location" ? "HOTSPOT" : "PIN"}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between px-4 h-8 font-mono text-[10px] text-zinc-600"
          style={{ borderTop: "1px solid rgba(45,229,217,0.15)" }}
        >
          <span>↑↓ NAVIGATE · ⏎ SELECT · ESC CLOSE</span>
          <span>{results.length} RESULTS</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
