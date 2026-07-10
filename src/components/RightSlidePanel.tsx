import { X, MapPin, Anchor, Zap, Plane, Waves } from "lucide-react";
import { useDashboardStore, type LayerChip } from "@/store/dashboardStore";
import { getLocation } from "@/config/locations";

const CHIPS: { id: LayerChip; label: string; icon: typeof Anchor }[] = [
  { id: "ports", label: "Ports", icon: Anchor },
  { id: "energy", label: "Energy Infrastructure", icon: Zap },
  { id: "air", label: "Air Routes", icon: Plane },
  { id: "waterways", label: "Waterways", icon: Waves },
];

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

  const handleClose = () => {
    setLayersPanelOpen(false);
    // If the panel was opened via a hotspot selection, also clear it so the
    // Reset View button state stays in sync with the panel.
    if (selectedLocationId) selectLocation(null);
  };

  return (
    <>
      {layersPanelOpen && (
        <div className="fixed inset-0 z-40" onClick={handleClose} />
      )}
      <aside
        className="fixed right-0 top-14 bottom-7 z-40 w-[400px] transition-transform duration-300 ease-out"
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
            className="flex items-center justify-between px-4 h-12"
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
              <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(45,229,217,0.1)" }}>
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
              <div className="px-4 py-3 flex flex-wrap gap-2" style={{ borderBottom: "1px solid rgba(45,229,217,0.1)" }}>
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

              {/* layer content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
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
                  <p className="font-mono text-[10px] text-zinc-600 italic pt-2">
                    {location.sampleDataNote}
                  </p>
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
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(45,229,217,0.15)" }}
          >
            <span className="font-mono text-[10px] text-zinc-600">PANEL::LAYERS</span>
            <span className="font-mono text-[10px] text-zinc-600">v0.4</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default RightSlidePanel;
