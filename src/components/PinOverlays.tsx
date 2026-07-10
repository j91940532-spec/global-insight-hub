import { useState } from "react";
import { X, Trash2, FilePlus, MapPin as PinIcon } from "lucide-react";
import { useDashboardStore, PIN_CATEGORY_META, type PinCategory } from "@/store/dashboardStore";

/**
 * Overlays user-placed pins on the globe canvas.
 * Same fallback pattern as HotspotOverlays — HTML markers positioned via
 * normalized screen coordinates, since the Spline scene does not expose
 * click surfaces we can raycast to lat/lon.
 */
function PinOverlays() {
  const {
    pins,
    selectedPinId,
    selectPin,
    removePin,
    visibleCategories,
    queuePinForReport,
    reportQueue,
  } = useDashboardStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {pins.map((pin) => {
        if (!visibleCategories[pin.category]) return null;
        const meta = PIN_CATEGORY_META[pin.category];
        const selected = selectedPinId === pin.id;
        return (
          <div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pin.screen.x * 100}%`, top: `${pin.screen.y * 100}%` }}
          >
            <button
              onClick={() => selectPin(selected ? null : pin.id)}
              className="relative pointer-events-auto group"
              aria-label={pin.label}
            >
              {/* pulse */}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  left: -9,
                  top: -9,
                  border: `1px solid ${meta.color}`,
                  animation: "hotspotPulse 2.4s ease-in-out infinite",
                }}
              />
              <PinIcon
                className="relative transition-all duration-150"
                style={{
                  width: selected ? 20 : 16,
                  height: selected ? 20 : 16,
                  color: meta.color,
                  filter: `drop-shadow(0 0 6px ${meta.glow})`,
                  strokeWidth: 2,
                }}
              />
              {!selected && (
                <span
                  className="absolute left-5 top-1/2 -translate-y-1/2 px-2 py-0.5 font-mono text-[10px] text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "rgba(10,14,20,0.95)",
                    border: `1px solid ${meta.color}55`,
                  }}
                >
                  {pin.label.toUpperCase()}
                </span>
              )}
            </button>

            {selected && (
              <div
                className="pointer-events-auto absolute left-6 top-0 w-64 z-30"
                style={{
                  background: "rgba(10,14,20,0.95)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${meta.color}66`,
                  boxShadow: `0 0 24px ${meta.glow}`,
                }}
              >
                <div
                  className="flex items-center justify-between px-3 h-8"
                  style={{ borderBottom: `1px solid ${meta.color}33` }}
                >
                  <span
                    className="font-mono text-[10px] tracking-widest"
                    style={{ color: meta.color }}
                  >
                    {meta.label.toUpperCase()}
                  </span>
                  <button
                    onClick={() => selectPin(null)}
                    className="text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="px-3 py-2 space-y-1">
                  <div className="font-heading text-sm text-zinc-100 truncate">{pin.label}</div>
                  <div className="font-mono text-[10px] text-zinc-500 tabular-nums">
                    {pin.lat.toFixed(3)}°, {pin.lon.toFixed(3)}°
                    <span className="ml-1 text-zinc-700">(approx)</span>
                  </div>
                  <div className="font-mono text-[10px] text-zinc-600">
                    {new Date(pin.createdAt).toISOString().replace("T", " ").slice(0, 19)}Z
                  </div>
                </div>
                <div
                  className="flex"
                  style={{ borderTop: `1px solid ${meta.color}33` }}
                >
                  <button
                    onClick={() => removePin(pin.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-mono text-[10px] text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    REMOVE
                  </button>
                  <div style={{ borderLeft: `1px solid ${meta.color}22` }} />
                  <button
                    onClick={() => queuePinForReport(pin.id)}
                    disabled={reportQueue.includes(pin.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-mono text-[10px] text-zinc-400 hover:text-accent-cyan disabled:opacity-40 transition-colors"
                    style={{
                      color: reportQueue.includes(pin.id) ? "var(--accent-cyan)" : undefined,
                    }}
                  >
                    <FilePlus className="w-3 h-3" />
                    {reportQueue.includes(pin.id) ? "QUEUED" : "ADD TO REPORT"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PinDraftDialogProps {
  screen: { x: number; y: number };
  onConfirm: (label: string, cat: PinCategory) => void;
  onCancel: () => void;
}

export function PinDraftDialog({ screen, onConfirm, onCancel }: PinDraftDialogProps) {
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState<PinCategory>("custom");

  return (
    <div
      className="absolute z-40 w-72 pointer-events-auto"
      style={{
        left: `${screen.x * 100}%`,
        top: `${screen.y * 100}%`,
        transform: "translate(-50%, -110%)",
        background: "rgba(10,14,20,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--accent-cyan)",
        boxShadow: "0 0 24px rgba(45,229,217,0.4)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 h-8"
        style={{ borderBottom: "1px solid rgba(45,229,217,0.3)" }}
      >
        <span className="font-mono text-[10px] tracking-widest text-accent-cyan">
          NEW PIN
        </span>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-200">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div>
          <label className="block font-mono text-[10px] text-zinc-500 mb-1">LABEL_</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Recon site A"
            className="w-full px-2 py-1.5 font-mono text-xs bg-transparent outline-none text-zinc-100"
            style={{ border: "1px solid rgba(45,229,217,0.3)", caretColor: "var(--accent-cyan)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && label.trim()) onConfirm(label.trim(), cat);
              if (e.key === "Escape") onCancel();
            }}
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-zinc-500 mb-1">CATEGORY_</label>
          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(PIN_CATEGORY_META) as PinCategory[]).map((c) => {
              const m = PIN_CATEGORY_META[c];
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className="py-1 font-mono text-[9px] tracking-wider transition-all"
                  style={{
                    border: `1px solid ${active ? m.color : "rgba(45,229,217,0.15)"}`,
                    background: active ? `${m.color}22` : "transparent",
                    color: active ? m.color : "#71717a",
                    boxShadow: active ? `0 0 8px ${m.glow}` : "none",
                  }}
                  title={m.label}
                >
                  {m.label.slice(0, 4).toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => label.trim() && onConfirm(label.trim(), cat)}
          disabled={!label.trim()}
          className="w-full py-2 font-heading text-xs tracking-widest transition-all"
          style={{
            border: "1px solid var(--accent-cyan)",
            background: label.trim() ? "transparent" : "rgba(45,229,217,0.05)",
            color: label.trim() ? "var(--accent-cyan)" : "rgba(45,229,217,0.4)",
          }}
        >
          DROP PIN
        </button>
      </div>
    </div>
  );
}

export default PinOverlays;
