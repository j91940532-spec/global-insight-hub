import { LOCATIONS } from "@/config/locations";
import { useDashboardStore } from "@/store/dashboardStore";

/**
 * HTML hotspot markers overlaid on the Spline canvas.
 *
 * Phase 4 fallback: the current Spline scene contains no named hotspot
 * marker objects (verified via the "[Spline] Object names:" log), so we
 * cannot attach real Spline object clicks. Instead, we render clickable
 * pins positioned via `location.screen` (normalized 0..1 over the canvas).
 * When hotspot objects are added to the Spline scene, this file will
 * become optional / remove-only.
 */
function HotspotOverlays() {
  const { selectedLocationId, selectLocation } = useDashboardStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {LOCATIONS.map((loc) => {
        const active = selectedLocationId === loc.id;
        return (
          <button
            key={loc.id}
            onClick={() => selectLocation(loc.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group"
            style={{ left: `${loc.screen.x * 100}%`, top: `${loc.screen.y * 100}%` }}
            aria-label={`Zoom to ${loc.name}`}
          >
            {/* pulse ring */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                width: 20,
                height: 20,
                left: -10,
                top: -10,
                border: "1px solid var(--accent-cyan)",
                animation: "hotspotPulse 2s ease-in-out infinite",
              }}
            />
            {/* dot */}
            <span
              className="block rounded-full transition-all duration-150"
              style={{
                width: active ? 12 : 8,
                height: active ? 12 : 8,
                background: "var(--accent-cyan)",
                boxShadow: active
                  ? "0 0 16px var(--accent-cyan), 0 0 32px rgba(45,229,217,0.6)"
                  : "0 0 8px var(--accent-cyan)",
              }}
            />
            {/* hover label */}
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 font-mono text-[10px] text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "rgba(10,14,20,0.95)",
                border: "1px solid var(--border-hair)",
              }}
            >
              {loc.name.toUpperCase()}
              <span className="ml-2 text-zinc-500">
                {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default HotspotOverlays;
