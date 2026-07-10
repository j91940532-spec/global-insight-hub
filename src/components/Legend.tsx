import { Eye, EyeOff } from "lucide-react";
import { useDashboardStore, PIN_CATEGORY_META, type PinCategory } from "@/store/dashboardStore";

function Legend() {
  const { visibleCategories, toggleCategory, pins } = useDashboardStore();

  const counts = pins.reduce<Record<PinCategory, number>>(
    (acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }),
    { port: 0, energy: 0, airspace: 0, waterway: 0, custom: 0 },
  );

  return (
    <div
      className="absolute left-4 bottom-4 z-20 w-52 pointer-events-auto"
      style={{
        background: "rgba(10,14,20,0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-hair)",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 h-8"
        style={{ borderBottom: "1px solid rgba(45,229,217,0.15)" }}
      >
        <span className="font-heading text-[11px] tracking-widest text-zinc-300">LEGEND</span>
        <span className="font-mono text-[10px] text-zinc-600">{pins.length} PINS</span>
      </div>
      <div className="py-1">
        {(Object.keys(PIN_CATEGORY_META) as PinCategory[]).map((c) => {
          const meta = PIN_CATEGORY_META[c];
          const on = visibleCategories[c];
          return (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className="w-full flex items-center gap-2 px-3 py-1.5 group hover:bg-white/5 transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: on ? meta.color : "transparent",
                  border: `1px solid ${meta.color}`,
                  boxShadow: on ? `0 0 6px ${meta.glow}` : "none",
                }}
              />
              <span
                className="flex-1 text-left font-mono text-[11px] tracking-wider"
                style={{ color: on ? "#e4e4e7" : "#52525b" }}
              >
                {meta.label.toUpperCase()}
              </span>
              <span className="font-mono text-[10px] text-zinc-600 tabular-nums w-4 text-right">
                {counts[c]}
              </span>
              {on ? (
                <Eye className="w-3 h-3 text-zinc-500 group-hover:text-accent-cyan" strokeWidth={1.5} />
              ) : (
                <EyeOff className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400" strokeWidth={1.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Legend;
