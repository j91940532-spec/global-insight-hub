import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { RotateCcw, Crosshair, X, Trash2, FilePlus, MapPin as PinIcon } from "lucide-react";
import { useDashboardStore, PIN_CATEGORY_META, type PinCategory } from "@/store/dashboardStore";
import { getLocation, LOCATIONS, type Location } from "@/config/locations";
import {
  PORT_POINTS,
  ENERGY_POINTS,
  AIR_ROUTES,
  WATERWAY_PATHS,
  type PortPoint,
  type EnergyPoint,
  type ArcRoute,
  type WaterwayPath,
} from "@/config/layerOverlayData";
import Legend from "./Legend";

const DEFAULT_POV = { lat: 20, lng: 20, altitude: 2.4 };
const CYAN = "#2DE5D9";
const AMBER = "#FFB020";
const DARK_EARTH = "//unpkg.com/three-globe/example/img/earth-dark.jpg";

const IDLE_RESUME_MS = 3000;

// Layer accent colors
const COLOR_PORTS = "#2DE5D9"; // cyan
const COLOR_ENERGY = "#FFB020"; // amber
const COLOR_AIR = "#A78BFA"; // violet
const COLOR_WATERWAY = "#34D399"; // emerald

interface GlobePoint {
  kind: "hotspot" | "pin";
  id: string;
  lat: number;
  lng: number;
  color: string;
  glow: string;
  label: string;
  size: number;
}

function GridTexture() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(45,229,217,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,229,217,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}

function ScanLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
      <GridTexture />
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(45,229,217,0.2)" }} />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(45,229,217,0.6) 350deg, transparent 360deg)",
            maskImage: "radial-gradient(circle, transparent 58%, black 60%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 58%, black 60%)",
            animationDuration: "1.2s",
          }}
        />
      </div>
      <span className="font-mono text-xs text-accent-cyan tracking-widest">
        INITIALIZING GLOBE FEED<span className="animate-pulse">...</span>
      </span>
    </div>
  );
}

// Inject a THREE.Points starfield into the globe's underlying scene
function addStarfield(scene: THREE.Scene) {
  const count = 2400;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Random point on a sphere with large radius so it's always behind the globe
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 900 + Math.random() * 200;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Mostly white/pale-blue, low opacity encoded as brightness
    const isCyan = Math.random() < 0.15;
    if (isCyan) {
      colors[i * 3] = 0.45;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.85;
    } else {
      const b = 0.55 + Math.random() * 0.45;
      colors[i * 3] = b;
      colors[i * 3 + 1] = b;
      colors[i * 3 + 2] = b + 0.05;
    }

    // Mostly tiny, some slightly larger
    sizes[i] = Math.random() < 0.06 ? 2.2 : 0.9 + Math.random() * 0.8;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.name = "orbital-starfield";
  scene.add(stars);
}

function MainCanvas() {
  const {
    selectedLocationId,
    selectLocation,
    addPinMode,
    toggleAddPinMode,
    addPin,
    pins,
    visibleCategories,
    selectedPinId,
    selectPin,
    removePin,
    queuePinForReport,
    reportQueue,
    activeChips,
  } = useDashboardStore();

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const starfieldAddedRef = useRef(false);

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Configure controls once the globe is mounted
  const handleGlobeReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
      minDistance: number;
      maxDistance: number;
      addEventListener: (ev: string, cb: () => void) => void;
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    });
    controls.addEventListener("end", () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        controls.autoRotate = true;
      }, IDLE_RESUME_MS);
    });
    g.pointOfView(DEFAULT_POV, 0);

    // Add starfield to Three.js scene (one-time)
    if (!starfieldAddedRef.current) {
      const scene = g.scene() as unknown as THREE.Scene;
      if (scene) {
        addStarfield(scene);
        starfieldAddedRef.current = true;
      }
    }

    setReady(true);
  }, []);

  // Fly-to when a chokepoint is selected
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const loc = getLocation(selectedLocationId);
    if (!loc) return;
    globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lon, altitude: 0.9 }, 1500);
  }, [selectedLocationId, ready]);

  // ── Hotspot + custom pin points ──────────────────────────────────────────────
  const hotspotAndPinPoints = useMemo<GlobePoint[]>(() => {
    const hotspotPoints: GlobePoint[] = LOCATIONS.map((loc: Location) => ({
      kind: "hotspot",
      id: loc.id,
      lat: loc.lat,
      lng: loc.lon,
      color: CYAN,
      glow: "rgba(45,229,217,0.6)",
      label: loc.name,
      size: 0.55,
    }));
    const pinPoints: GlobePoint[] = pins
      .filter((p) => visibleCategories[p.category])
      .map((p) => {
        const meta = PIN_CATEGORY_META[p.category];
        return {
          kind: "pin",
          id: p.id,
          lat: p.lat,
          lng: p.lon,
          color: meta.color,
          glow: meta.glow,
          label: p.label,
          size: 0.4,
        };
      });
    return [...hotspotPoints, ...pinPoints];
  }, [pins, visibleCategories]);

  // ── Layer overlay data — driven by activeChips toggles ──────────────────────

  // Ports layer — point markers
  const portPoints = useMemo<PortPoint[]>(
    () => (activeChips.ports ? PORT_POINTS : []),
    [activeChips.ports],
  );

  // Energy layer — point markers
  const energyPoints = useMemo<EnergyPoint[]>(
    () => (activeChips.energy ? ENERGY_POINTS : []),
    [activeChips.energy],
  );

  // Air routes layer — arcs
  const airArcs = useMemo<ArcRoute[]>(
    () => (activeChips.air ? AIR_ROUTES : []),
    [activeChips.air],
  );

  // Waterways layer — paths
  const waterwayPaths = useMemo<WaterwayPath[]>(
    () => (activeChips.waterways ? WATERWAY_PATHS : []),
    [activeChips.waterways],
  );

  const rings = useMemo(
    () =>
      LOCATIONS.map((loc) => ({
        lat: loc.lat,
        lng: loc.lon,
        maxR: 4,
        propagationSpeed: 2,
        repeatPeriod: 1800,
      })),
    [],
  );

  const handlePointClick = useCallback(
    (point: object) => {
      const p = point as GlobePoint;
      if (p.kind === "hotspot") {
        selectLocation(p.id as (typeof LOCATIONS)[number]["id"]);
      } else {
        selectPin(p.id);
        const pin = pins.find((x) => x.id === p.id);
        if (pin) {
          globeRef.current?.pointOfView({ lat: pin.lat, lng: pin.lon, altitude: 0.9 }, 1400);
        }
      }
    },
    [selectLocation, selectPin, pins],
  );

  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (addPinMode) {
        setDraft({ lat, lng });
      }
    },
    [addPinMode],
  );

  const handleReset = () => {
    globeRef.current?.pointOfView(DEFAULT_POV, 1300);
    selectLocation(null);
    selectPin(null);
  };

  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  return (
    <main className="relative h-full w-full overflow-hidden bg-bg-base" style={{ cursor: addPinMode ? "crosshair" : "default" }}>
      <div ref={containerRef} className="absolute inset-0">
        {dims.w > 0 && (
          <Globe
            ref={globeRef}
            width={dims.w}
            height={dims.h}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={DARK_EARTH}
            showAtmosphere
            atmosphereColor={CYAN}
            atmosphereAltitude={0.18}
            onGlobeReady={handleGlobeReady}
            onGlobeClick={handleGlobeClick}

            // ── Hotspots + custom pins ──
            pointsData={hotspotAndPinPoints}
            pointLat={(d: object) => (d as GlobePoint).lat}
            pointLng={(d: object) => (d as GlobePoint).lng}
            pointColor={(d: object) => (d as GlobePoint).color}
            pointAltitude={(d: object) => ((d as GlobePoint).kind === "hotspot" ? 0.02 : 0.015)}
            pointRadius={(d: object) => (d as GlobePoint).size}
            pointLabel={(d: object) => {
              const p = d as GlobePoint;
              return `<div style="font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;padding:6px 10px;background:rgba(10,14,20,0.95);border:1px solid ${p.color}66;color:${p.color};text-transform:uppercase;box-shadow:0 0 12px ${p.glow}">${p.label}</div>`;
            }}
            onPointClick={handlePointClick}

            // ── Rings ──
            ringsData={rings}
            ringColor={() => "rgba(45,229,217,0.6)"}
            ringMaxRadius="maxR"
            ringPropagationSpeed="propagationSpeed"
            ringRepeatPeriod="repeatPeriod"

            // ── Port + Energy layer (objectsData — auto-positioned by lat/lng) ──
            objectsData={[
              ...portPoints.map((p) => ({ ...p, _layer: "port" })),
              ...energyPoints.map((p) => ({ ...p, _layer: "energy" })),
            ]}
            objectLat={(d: object) => (d as PortPoint & { _layer: string }).lat}
            objectLng={(d: object) => (d as PortPoint & { _layer: string }).lng}
            objectAltitude={0.01}
            objectThreeObject={(d: object) => {
              const item = d as (PortPoint | EnergyPoint) & { _layer: string };
              const color = item._layer === "port" ? COLOR_PORTS : COLOR_ENERGY;
              const geo = new THREE.SphereGeometry(0.28, 8, 8);
              const mat = new THREE.MeshBasicMaterial({ color });
              return new THREE.Mesh(geo, mat);
            }}
            objectLabel={(d: object) => {
              const item = d as (PortPoint | EnergyPoint) & { _layer: string };
              const color = item._layer === "port" ? COLOR_PORTS : COLOR_ENERGY;
              return `<div style="font-family:ui-monospace,monospace;font-size:10px;padding:4px 8px;background:rgba(10,14,20,0.95);border:1px solid ${color}66;color:${color};text-transform:uppercase">${item.name}</div>`;
            }}

            // ── Air routes (arcs) ──
            arcsData={airArcs}
            arcStartLat={(d: object) => (d as ArcRoute).startLat}
            arcStartLng={(d: object) => (d as ArcRoute).startLng}
            arcEndLat={(d: object) => (d as ArcRoute).endLat}
            arcEndLng={(d: object) => (d as ArcRoute).endLng}
            arcColor={() => `${COLOR_AIR}99`}
            arcAltitude={0.12}
            arcStroke={0.4}
            arcLabel={(d: object) => {
              const a = d as ArcRoute;
              return `<div style="font-family:ui-monospace,monospace;font-size:10px;padding:4px 8px;background:rgba(10,14,20,0.95);border:1px solid ${COLOR_AIR}66;color:${COLOR_AIR}">${a.label}</div>`;
            }}

            // ── Waterways (paths) ──
            pathsData={waterwayPaths}
            pathPoints="coords"
            pathPointLat={(coord: unknown) => (coord as [number, number])[0]}
            pathPointLng={(coord: unknown) => (coord as [number, number])[1]}
            pathColor={() => `${COLOR_WATERWAY}cc`}
            pathStroke={1.2}
            pathAltitude={0.005}
            pathLabel={(d: object) => {
              const w = d as WaterwayPath;
              return `<div style="font-family:ui-monospace,monospace;font-size:10px;padding:4px 8px;background:rgba(10,14,20,0.95);border:1px solid ${COLOR_WATERWAY}66;color:${COLOR_WATERWAY}">${w.label}</div>`;
            }}
          />
        )}
        {!ready && <ScanLoader />}
      </div>

      {/* Add-pin mode banner */}
      {addPinMode && !draft && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 pointer-events-auto"
          style={{
            background: "rgba(10,14,20,0.9)",
            border: `1px solid ${AMBER}`,
            boxShadow: "0 0 16px rgba(255,176,32,0.3)",
          }}
        >
          <Crosshair className="w-4 h-4" style={{ color: AMBER }} strokeWidth={1.5} />
          <span className="font-mono text-[11px] tracking-widest" style={{ color: AMBER }}>
            ADD-PIN MODE — CLICK GLOBE TO DROP
          </span>
          <button
            onClick={toggleAddPinMode}
            className="ml-2 px-2 py-0.5 font-mono text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
            style={{ border: "1px solid rgba(255,176,32,0.3)" }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Pin draft dialog */}
      {draft && (
        <PinDraftDialog
          lat={draft.lat}
          lng={draft.lng}
          onCancel={() => setDraft(null)}
          onConfirm={(label, cat) => {
            addPin({
              label,
              category: cat,
              lat: draft.lat,
              lon: draft.lng,
              screen: { x: 0.5, y: 0.5 },
            });
            setDraft(null);
          }}
        />
      )}

      {/* Selected custom pin info card */}
      {selectedPin && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-72 pointer-events-auto"
          style={{
            background: "rgba(10,14,20,0.95)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${PIN_CATEGORY_META[selectedPin.category].color}66`,
            boxShadow: `0 0 24px ${PIN_CATEGORY_META[selectedPin.category].glow}`,
          }}
        >
          <div className="flex items-center justify-between px-3 h-8" style={{ borderBottom: `1px solid ${PIN_CATEGORY_META[selectedPin.category].color}33` }}>
            <div className="flex items-center gap-2">
              <PinIcon className="w-3 h-3" style={{ color: PIN_CATEGORY_META[selectedPin.category].color }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: PIN_CATEGORY_META[selectedPin.category].color }}>
                {PIN_CATEGORY_META[selectedPin.category].label.toUpperCase()}
              </span>
            </div>
            <button onClick={() => selectPin(null)} className="text-zinc-500 hover:text-zinc-200">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="px-3 py-2 space-y-1">
            <div className="font-heading text-sm text-zinc-100 truncate">{selectedPin.label}</div>
            <div className="font-mono text-[10px] text-zinc-500 tabular-nums">
              {selectedPin.lat.toFixed(3)}°, {selectedPin.lon.toFixed(3)}°
            </div>
          </div>
          <div className="flex" style={{ borderTop: `1px solid ${PIN_CATEGORY_META[selectedPin.category].color}33` }}>
            <button
              onClick={() => removePin(selectedPin.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-mono text-[10px] text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              REMOVE
            </button>
            <button
              onClick={() => queuePinForReport(selectedPin.id)}
              disabled={reportQueue.includes(selectedPin.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-mono text-[10px] text-zinc-400 hover:text-accent-cyan disabled:opacity-40 transition-colors"
              style={{ color: reportQueue.includes(selectedPin.id) ? CYAN : undefined }}
            >
              <FilePlus className="w-3 h-3" />
              {reportQueue.includes(selectedPin.id) ? "QUEUED" : "ADD TO REPORT"}
            </button>
          </div>
        </div>
      )}

      {/* Reset View */}
      {(selectedLocationId || selectedPinId) && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-accent-cyan tracking-widest bg-bg-panel/80 backdrop-blur-md transition-all duration-150 hover:bg-accent-cyan/10 hover:shadow-[0_0_16px_rgba(45,229,217,0.4)]"
          style={{ border: "1px solid var(--border-hair)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET VIEW
        </button>
      )}

      {ready && <Legend />}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,7,10,0.55) 100%)" }}
      />
    </main>
  );
}

interface PinDraftDialogProps {
  lat: number;
  lng: number;
  onConfirm: (label: string, cat: PinCategory) => void;
  onCancel: () => void;
}

function PinDraftDialog({ lat, lng, onConfirm, onCancel }: PinDraftDialogProps) {
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState<PinCategory>("custom");

  return (
    <div
      className="absolute z-40 w-72 pointer-events-auto"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(10,14,20,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--accent-cyan)",
        boxShadow: "0 0 24px rgba(45,229,217,0.4)",
      }}
    >
      <div className="flex items-center justify-between px-3 h-8" style={{ borderBottom: "1px solid rgba(45,229,217,0.3)" }}>
        <span className="font-mono text-[10px] tracking-widest text-accent-cyan">NEW PIN</span>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-200">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div className="font-mono text-[10px] text-zinc-500 tabular-nums">
          {lat.toFixed(3)}°, {lng.toFixed(3)}°
        </div>
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

export default MainCanvas;
