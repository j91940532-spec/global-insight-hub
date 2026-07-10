import { X, MapPin, Anchor, Zap, Plane, Save as Waves, TriangleAlert as AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { useDashboardStore, type LayerChip } from "@/store/dashboardStore";
import { getLocation } from "@/config/locations";
import { LOCATION_INTELLIGENCE, type CriticalityLevel } from "@/config/intelligenceData";

const CHIPS: { id: LayerChip; label: string; icon: typeof Anchor }[] = [
  { id: "ports", label: "Ports", icon: Anchor },
  { id: "energy", label: "Energy Infrastructure", icon: Zap },
  { id: "air", label: "Air Routes", icon: Plane },
  { id: "waterways", label: "Waterways", icon: Waves },
];

const CRITICALITY_COLORS: Record<CriticalityLevel, { color: string; bg: string; border: string }> = {
  LOW: { color: "#34D399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.4)" },
  ELEVATED: { color: "#FFB020", bg: "rgba(255,176,32,0.08)", border: "rgba(255,176,32,0.4)" },
  HIGH: { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.5)" },
  SEVERE: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.6)" },
};

function RightSlidePanel() {
  const {
    layersPanelOpen,
    setLayersPanelOpen,
    selectedLocationId,
    activeChips,
    toggleChip,
    selectLocation,
  } = useDashboardStore();

  const location = getLocation(selectedLocationId);
  const intel = selectedLocationId ? LOCATION_INTELLIGENCE[selectedLocationId] : null;

  const handleClose = () => {
    setLayersPanelOpen(false);
    if (selectedLocationId) selectLocation(null);
  };

  return (
    <>
      {layersPanelOpen && (
        <div className="fixed inset-0 z-40" onClick={handleClose} />
      )}
      <aside
        className="fixed right-0 top-14 bottom-7 z-40 w-[420px] transition-transform duration-300 ease-out"
        style={{ transform: layersPanelOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div
          className="relative h-full flex flex-col"
          style={{
            background: "rgba(10,14,20,0.85)",
            backdropFilter: "blur(16px)",
            borderLeft: "1px solid var(--border-hair)",
            boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-4 h-12 shrink-0"
            style={{ borderBottom: "1px solid rgba(45,229,217,0.15)" }}
          >
            <span className="font-heading text-sm tracking-wider text-zinc-200">
              LAYERS<span className="text-accent-cyan">/DETAIL</span>
            </span>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-accent-cyan transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {location ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* location header */}
              <div className="px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(45,229,217,0.1)" }}>
                <div className="font-mono text-[10px] text-zinc-500 tracking-widest mb-1">
                  {location.region.toUpperCase()}
                </div>
                <h2
                  className="font-heading text-lg text-zinc-100 tracking-tight"
                  style={{ textShadow: "0 0 12px rgba(45,229,217,0.15)" }}
                >
                  {location.name}
                </h2>
                <div className="font-mono text-[11px] text-accent-cyan mt-2 tabular-nums">
                  {location.lat.toFixed(4)}° N · {location.lon.toFixed(4)}° E
                </div>
              </div>

              {/* chip toggles */}
              <div className="px-4 py-3 flex flex-wrap gap-2 shrink-0" style={{ borderBottom: "1px solid rgba(45,229,217,0.1)" }}>
                {CHIPS.map(({ id, label, icon: Icon }) => {
                  const active = activeChips[id];
                  return (
                    <button
                      key={id}
                      onClick={() => toggleChip(id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] tracking-wider transition-all duration-150"
                      style={{
                        border: `1px solid ${active ? "var(--accent-cyan)" : "rgba(45,229,217,0.15)"}`,
                        background: active ? "rgba(45,229,217,0.1)" : "transparent",
                        color: active ? "var(--accent-cyan)" : "#71717a",
                        boxShadow: active ? "0 0 10px rgba(45,229,217,0.2)" : "none",
                      }}
                    >
                      <Icon className="w-3 h-3" strokeWidth={1.5} />
                      {label.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {/* scrollable content */}
              <div className="flex-1 overflow-y-auto">

                {/* ── CRITICALITY + NEWS ───────────────────────────────── */}
                {intel && (
                  <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid rgba(45,229,217,0.08)" }}>
                    {/* criticality badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <PanelSectionLabel>SITUATION REPORT</PanelSectionLabel>
                    </div>
                    <CriticalityBadge level={intel.criticality} justification={intel.criticalityJustification} />

                    {/* news items */}
                    <ul className="space-y-2 mt-1">
                      {intel.news.map((item, i) => (
                        <li
                          key={i}
                          className="pl-3 py-1.5 space-y-0.5"
                          style={{ borderLeft: "1px solid rgba(45,229,217,0.2)" }}
                        >
                          <div className="font-mono text-[10px] text-zinc-500 tracking-wider">
                            [{item.source}] · {item.date}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-300 leading-relaxed">
                            "{item.headline}"
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="font-mono text-[10px] text-zinc-700 italic">Demo/illustrative news — not a live feed.</p>
                  </div>
                )}

                {/* ── ALTERNATE ROUTES (HIGH / SEVERE only) ────────────── */}
                {intel && intel.alternateRoutes && (intel.criticality === "HIGH" || intel.criticality === "SEVERE") && (
                  <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid rgba(45,229,217,0.08)" }}>
                    <PanelSectionLabel>ALTERNATE ROUTES / RECOMMENDED ACTIONS</PanelSectionLabel>
                    {intel.alternateRoutes.map((route, i) => (
                      <div
                        key={i}
                        className="pl-3 py-2 space-y-1"
                        style={{
                          borderLeft: `2px solid ${CRITICALITY_COLORS[intel.criticality].color}`,
                          background: CRITICALITY_COLORS[intel.criticality].bg,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: CRITICALITY_COLORS[intel.criticality].color }} strokeWidth={2} />
                          <span className="font-heading text-[11px] text-zinc-100">{route.route}</span>
                          <span
                            className="ml-auto font-mono text-[10px] shrink-0 px-1.5 py-0.5"
                            style={{
                              color: CRITICALITY_COLORS[intel.criticality].color,
                              border: `1px solid ${CRITICALITY_COLORS[intel.criticality].border}`,
                            }}
                          >
                            {route.addedDays}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 leading-relaxed pl-5">
                          {route.action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── LAYER DATA LIST ───────────────────────────────────── */}
                <div className="px-4 py-3 space-y-4" style={{ borderBottom: "1px solid rgba(45,229,217,0.08)" }}>
                  {CHIPS.map(({ id, label, icon: Icon }) => {
                    if (!activeChips[id]) return null;
                    const items = location.layers[id];
                    return (
                      <section key={id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-3.5 h-3.5 text-accent-cyan" strokeWidth={1.5} />
                          <span className="font-heading text-[11px] tracking-widest text-zinc-300">
                            {label.toUpperCase()}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-600 ml-auto">
                            {items.length}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {items.map((item, i) => (
                            <li
                              key={i}
                              className="font-mono text-[11px] text-zinc-400 pl-3 py-1.5"
                              style={{ borderLeft: "1px solid rgba(45,229,217,0.2)" }}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                  {location.sampleDataNote && (
                    <p className="font-mono text-[10px] text-zinc-600 italic">
                      {location.sampleDataNote}
                    </p>
                  )}
                </div>

                {/* ── HISTORICAL PRECEDENT ─────────────────────────────── */}
                {intel?.historicalPrecedent && (
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(45,229,217,0.08)" }}>
                    <PanelSectionLabel>HISTORICAL PRECEDENT</PanelSectionLabel>
                    {!intel.historicalPrecedent.isReal && (
                      <p className="font-mono text-[10px] text-zinc-700 italic mb-2">Illustrative placeholder — no verified real event for this location.</p>
                    )}
                    <div className="mt-3 space-y-3">
                      {/* Event name + description */}
                      <div className="pl-3" style={{ borderLeft: "2px solid var(--accent-cyan)" }}>
                        <div className="font-heading text-xs text-zinc-100">{intel.historicalPrecedent.eventName}</div>
                        <div className="font-mono text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                          {intel.historicalPrecedent.eventDescription}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div
                        className="relative flex items-center gap-0 mt-2"
                        style={{ borderTop: "1px solid rgba(45,229,217,0.1)", paddingTop: "12px" }}
                      >
                        {/* Left marker */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="px-2 py-1.5"
                            style={{ border: "1px solid var(--accent-cyan)", background: "rgba(45,229,217,0.06)" }}
                          >
                            <div className="font-mono text-[9px] text-zinc-500 tracking-widest mb-0.5">OUR SYSTEM FLAGGED</div>
                            <div className="font-mono text-[11px] text-accent-cyan tabular-nums">{intel.historicalPrecedent.systemFlagDate}</div>
                          </div>
                        </div>

                        {/* Center pill */}
                        <div className="flex flex-col items-center shrink-0 px-2">
                          <div
                            className="flex flex-col items-center px-2 py-1 gap-0.5"
                            style={{ border: "1px solid var(--accent-amber)", background: "rgba(255,176,32,0.08)" }}
                          >
                            <Clock className="w-3 h-3" style={{ color: "var(--accent-amber)" }} strokeWidth={1.5} />
                            <span className="font-heading text-base font-bold tabular-nums" style={{ color: "var(--accent-amber)" }}>
                              {intel.historicalPrecedent.leadDays}d
                            </span>
                            <span className="font-mono text-[8px] text-zinc-500 tracking-widest">EARLIER</span>
                          </div>
                        </div>

                        {/* Right marker */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="px-2 py-1.5"
                            style={{ border: "1px solid rgba(45,229,217,0.3)", background: "rgba(45,229,217,0.02)" }}
                          >
                            <div className="font-mono text-[9px] text-zinc-500 tracking-widest mb-0.5">PUBLIC NEWS BROKE</div>
                            <div className="font-mono text-[11px] text-zinc-300 tabular-nums">{intel.historicalPrecedent.publicNewsDate}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ border: "1px dashed rgba(45,229,217,0.2)" }}
              >
                <MapPin className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-xs text-zinc-500 tracking-wider text-center">
                No location selected
              </span>
              <span className="font-mono text-[10px] text-zinc-700 text-center max-w-[240px]">
                Click a hotspot on the globe to view layered intelligence data for that region.
              </span>
            </div>
          )}

          {/* footer */}
          <div
            className="px-4 py-2 flex items-center justify-between shrink-0"
            style={{ borderTop: "1px solid rgba(45,229,217,0.15)" }}
          >
            <span className="font-mono text-[10px] text-zinc-600">PANEL::LAYERS</span>
            <span className="font-mono text-[10px] text-zinc-600">v0.5</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function PanelSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-3.5 h-px" style={{ background: "var(--accent-cyan)" }} />
      <span className="font-heading text-[11px] tracking-widest text-zinc-300">{children}</span>
    </div>
  );
}

function CriticalityBadge({ level, justification }: { level: CriticalityLevel; justification: string }) {
  const c = CRITICALITY_COLORS[level];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} strokeWidth={2} />
        <span
          className="font-heading text-xs tracking-widest px-2 py-0.5"
          style={{ color: c.color, border: `1px solid ${c.border}`, background: c.bg }}
        >
          {level}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">CRITICALITY</span>
      </div>
      <div
        className="font-mono text-[10px] text-zinc-400 leading-relaxed pl-3 py-1.5"
        style={{ borderLeft: `2px solid ${c.color}` }}
      >
        {justification}
      </div>
    </div>
  );
}

export default RightSlidePanel;
