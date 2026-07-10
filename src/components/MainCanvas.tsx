import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import { RefreshCw, AlertTriangle, RotateCcw, Crosshair } from "lucide-react";
import gsap from "gsap";
import { useDashboardStore } from "@/store/dashboardStore";
import { getLocation, LOCATIONS } from "@/config/locations";
import HotspotOverlays from "./HotspotOverlays";
import PinOverlays, { PinDraftDialog } from "./PinOverlays";
import Legend from "./Legend";

const SCENE_URL = import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined;

type LoadState = "loading" | "ready" | "error";

// Illustrative equirectangular projection of normalized screen (0..1)
// to approximate lat/lon — flagged as approximate in the pin UI since
// the underlying Spline scene is a 3D globe, not a flat map.
function screenToLatLon(sx: number, sy: number) {
  return { lat: (0.5 - sy) * 180, lon: (sx - 0.5) * 360 };
}


function GridTexture() {
  return (
    <div
      className="absolute inset-0"
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
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
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
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(45,229,217,0.4)", boxShadow: "inset 0 0 12px rgba(45,229,217,0.15)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" style={{ boxShadow: "0 0 8px var(--accent-cyan)" }} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-xs text-accent-cyan tracking-widest" style={{ textShadow: "0 0 8px rgba(45,229,217,0.4)" }}>
          INITIALIZING GLOBE FEED<span className="animate-pulse">...</span>
        </span>
        <span className="font-mono text-[10px] text-zinc-600">ACQUIRING SATELLITE UPLINK</span>
      </div>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <GridTexture />
      <AlertTriangle className="w-10 h-10 text-amber-400" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 8px rgba(255,176,32,0.5))" }} />
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-sm text-amber-400 tracking-wider">SCENE LOAD FAILURE</span>
        <span className="font-mono text-[10px] text-zinc-500">Globe feed could not be established</span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-accent-cyan transition-all duration-150 hover:bg-accent-cyan/10"
        style={{ border: "1px solid var(--border-hair)" }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        RETRY UPLINK
      </button>
    </div>
  );
}

function PlaceholderCanvas() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <GridTexture />
      <div className="relative">
        <div className="w-16 h-16 rounded-full" style={{ border: "1px dashed rgba(45,229,217,0.3)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent-cyan/30 animate-pulse" />
        </div>
      </div>
      <span className="font-mono text-xs text-zinc-600 tracking-widest">GLOBE VIEWPORT</span>
      <span className="font-mono text-[10px] text-zinc-700">SPLINE_SCENE_URL not configured</span>
    </div>
  );
}

// Default camera baseline captured at scene load; used by Reset View.
interface CameraSnapshot {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

function MainCanvas() {
  const {
    setSplineApp,
    splineApp,
    selectedLocationId,
    selectLocation,
    addPinMode,
    toggleAddPinMode,
    addPin,
  } = useDashboardStore();
  const [loadState, setLoadState] = useState<LoadState>(SCENE_URL ? "loading" : "ready");
  const [retryKey, setRetryKey] = useState(0);
  const [hasScene, setHasScene] = useState(!!SCENE_URL);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const defaultCamRef = useRef<CameraSnapshot | null>(null);


  useEffect(() => {
    setHasScene(!!SCENE_URL);
  }, [retryKey]);

  const handleLoad = useCallback(
    (app: Application) => {
      setSplineApp(app);
      setLoadState("ready");
      try {
        const objects = app.getAllObjects();
        const names = objects.map((o) => o.name).filter(Boolean);
        console.log("[Spline] Scene loaded. Object count:", objects.length);
        console.log("[Spline] Object names:", names);

        // Capture default camera pose for Reset View. Spline exposes the
        // camera as a named object; if not present we fall back to overlay-only.
        const cam =
          app.findObjectByName("Camera") ??
          objects.find((o) => o.name?.toLowerCase().includes("camera"));
        if (cam) {
          defaultCamRef.current = {
            position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
            rotation: { x: cam.rotation.x, y: cam.rotation.y, z: cam.rotation.z },
          };
          console.log("[Spline] Camera baseline captured:", defaultCamRef.current);
        } else {
          console.warn("[Spline] No Camera object found — Reset View will only clear panel.");
        }

        // Attempt to attach real Spline object click handlers when hotspot
        // marker objects exist in the scene. Currently none of the locations
        // define splineObjectName (all null), so this loop is a no-op today
        // and safely activates when hotspots are added in the Spline editor.
        LOCATIONS.forEach((loc) => {
          if (!loc.splineObjectName) return;
          const obj = app.findObjectByName(loc.splineObjectName);
          if (obj) {
            app.addEventListener("mouseDown", (e: { target?: { name?: string } }) => {
              if (e.target?.name === loc.splineObjectName) selectLocation(loc.id);
            });
          } else {
            console.warn(`[Spline] Hotspot object "${loc.splineObjectName}" not found in scene.`);
          }
        });
      } catch (e) {
        console.warn("[Spline] Could not enumerate objects", e);
      }
    },
    [setSplineApp, selectLocation],
  );

  // Camera fly-to on selection change.
  useEffect(() => {
    if (!splineApp) return;
    const loc = getLocation(selectedLocationId);
    if (!loc) return;

    const cam =
      splineApp.findObjectByName("Camera") ??
      splineApp.getAllObjects().find((o) => o.name?.toLowerCase().includes("camera"));

    if (!cam) {
      console.warn(
        "[Phase 4] Camera fly-to requested but no Camera object exists in the Spline scene. " +
          "Add a named 'Camera' object in the Spline editor to enable cinematic zoom.",
      );
      return;
    }

    gsap.to(cam.position, {
      x: loc.cameraTarget.position.x,
      y: loc.cameraTarget.position.y,
      z: loc.cameraTarget.position.z,
      duration: 1.5,
      ease: "power3.inOut",
    });
    gsap.to(cam.rotation, {
      x: loc.cameraTarget.rotation.x,
      y: loc.cameraTarget.rotation.y,
      z: loc.cameraTarget.rotation.z,
      duration: 1.5,
      ease: "power3.inOut",
    });
  }, [selectedLocationId, splineApp]);

  const handleReset = () => {
    if (splineApp && defaultCamRef.current) {
      const cam =
        splineApp.findObjectByName("Camera") ??
        splineApp.getAllObjects().find((o) => o.name?.toLowerCase().includes("camera"));
      if (cam) {
        gsap.to(cam.position, { ...defaultCamRef.current.position, duration: 1.3, ease: "power3.inOut" });
        gsap.to(cam.rotation, { ...defaultCamRef.current.rotation, duration: 1.3, ease: "power3.inOut" });
      }
    }
    selectLocation(null);
  };

  const handleRetry = () => {
    setLoadState("loading");
    setRetryKey((k) => k + 1);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addPinMode || loadState !== "ready") return;
    // Ignore clicks on overlay children (hotspots, existing pins).
    if ((e.target as HTMLElement).closest("[data-overlay-marker]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDraft({ x, y });
  };

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-bg-base"
      style={{ cursor: addPinMode ? "crosshair" : "default" }}
      onClick={handleCanvasClick}
    >
      <div ref={sceneRef} className="absolute inset-0">
        {hasScene && loadState !== "error" && (
          <Suspense fallback={<ScanLoader />}>
            <Spline
              key={retryKey}
              scene={SCENE_URL!}
              onLoad={handleLoad}
              onError={() => setLoadState("error")}
              style={{
                width: "100%",
                height: "100%",
                opacity: loadState === "ready" ? 1 : 0,
                transition: "opacity 0.6s ease",
              }}
            />
          </Suspense>
        )}
        {hasScene && loadState === "loading" && <ScanLoader />}
        {hasScene && loadState === "error" && <ErrorPanel onRetry={handleRetry} />}
        {!hasScene && <PlaceholderCanvas />}
      </div>

      {/* Phase 4: fixed chokepoint hotspots */}
      {loadState === "ready" && (
        <div data-overlay-marker>
          <HotspotOverlays />
        </div>
      )}

      {/* Phase 5: user-placed pins */}
      {loadState === "ready" && (
        <div data-overlay-marker>
          <PinOverlays />
        </div>
      )}

      {/* Phase 5: pin draft dialog */}
      {draft && (
        <div data-overlay-marker>
          <PinDraftDialog
            screen={draft}
            onCancel={() => setDraft(null)}
            onConfirm={(label, cat) => {
              const { lat, lon } = screenToLatLon(draft.x, draft.y);
              addPin({ label, category: cat, screen: draft, lat, lon });
              setDraft(null);
            }}
          />
        </div>
      )}

      {/* Phase 5: add-pin mode banner */}
      {addPinMode && !draft && (
        <div
          data-overlay-marker
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 pointer-events-auto"
          style={{
            background: "rgba(10,14,20,0.9)",
            border: "1px solid var(--accent-amber)",
            boxShadow: "0 0 16px rgba(255,176,32,0.3)",
          }}
        >
          <Crosshair className="w-4 h-4 text-accent-amber" strokeWidth={1.5} />
          <span className="font-mono text-[11px] tracking-widest text-accent-amber">
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

      {/* Phase 4: Reset View */}
      {selectedLocationId && (
        <button
          data-overlay-marker
          onClick={handleReset}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-accent-cyan tracking-widest bg-bg-panel/80 backdrop-blur-md transition-all duration-150 hover:bg-accent-cyan/10 hover:shadow-[0_0_16px_rgba(45,229,217,0.4)]"
          style={{ border: "1px solid var(--border-hair)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET VIEW
        </button>
      )}

      {/* Phase 5: category legend */}
      {loadState === "ready" && (
        <div data-overlay-marker>
          <Legend />
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(5,7,10,0.5) 100%)" }}
      />
    </main>
  );
}

export default MainCanvas;

