// Phase 4 — Chokepoint hotspot configuration.
//
// NOTE: The current Spline scene does NOT contain named hotspot marker objects
// (verified via the "[Spline] Object names:" console log — no chokepoint markers
// are present in the loaded scene). Until dedicated hotspot objects are added
// in the Spline editor, `splineObjectName` is left null and click detection is
// handled via HTML overlays positioned on top of the canvas (see HotspotOverlays).
//
// When hotspot objects are added to the Spline scene, populate `splineObjectName`
// and the code in MainCanvas will attach real Spline object click handlers.

export type LocationId =
  | "hormuz"
  | "malacca"
  | "suez"
  | "bab-el-mandeb"
  | "panama";

export interface LayerData {
  ports: string[];
  energy: string[];
  air: string[];
  waterways: string[];
}

export interface CameraTarget {
  // Position/rotation the Spline camera should tween to on select.
  // Values are placeholders — populate once the Spline scene exposes a
  // named "Camera" object and hotspot markers to zoom toward.
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export interface Location {
  id: LocationId;
  name: string;
  region: string;
  lat: number;
  lon: number;
  // Screen-space position as a fraction of the canvas (0..1) — used by
  // the HTML overlay pins until real Spline hotspot objects exist.
  screen: { x: number; y: number };
  splineObjectName: string | null;
  cameraTarget: CameraTarget;
  layers: LayerData;
  sampleDataNote?: string;
}

export const LOCATIONS: Location[] = [
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    region: "Persian Gulf",
    lat: 26.566,
    lon: 56.25,
    screen: { x: 0.63, y: 0.46 },
    splineObjectName: null,
    cameraTarget: {
      position: { x: 320, y: 120, z: 240 },
      rotation: { x: -0.35, y: 0.9, z: 0 },
    },
    layers: {
      ports: [
        "Bandar Abbas (IRN) — throughput 2.6M TEU/yr",
        "Jebel Ali (UAE) — 19.3M TEU/yr, tier-1 transshipment",
        "Khasab (OMN) — naval + patrol staging",
      ],
      energy: [
        "Kharg Island Oil Terminal (IRN)",
        "Fujairah Bunkering Complex (UAE)",
        "Das Island LNG Facility (UAE)",
        "South Pars/North Dome Gas Field",
      ],
      air: [
        "Corridor B449 — Doha ⇄ Karachi",
        "Corridor P975 — Muscat ⇄ Tehran",
        "Corridor N571 — Dubai ⇄ Delhi",
      ],
      waterways: [
        "IMO Traffic Separation Scheme — 2 nm inbound / 2 nm outbound",
        "Narrowest width: 21 nm (Larak Island channel)",
        "Daily transit: ~14 crude tankers, ~4 LNG carriers",
        "Est. 21% of global petroleum liquids transit here",
      ],
    },
    sampleDataNote: "Illustrative sample data — not live feed.",
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    region: "SE Asia",
    lat: 2.5,
    lon: 101.5,
    screen: { x: 0.76, y: 0.55 },
    splineObjectName: null,
    cameraTarget: {
      position: { x: 480, y: 140, z: -180 },
      rotation: { x: -0.3, y: 1.6, z: 0 },
    },
    layers: {
      ports: ["Port Klang (MYS)", "Singapore (SGP)", "Belawan (IDN)"],
      energy: ["Regional refining hubs (placeholder)"],
      air: ["Corridor L642 — Singapore ⇄ Bangkok"],
      waterways: ["Narrowest width: ~1.5 nm (Phillips Channel)", "~94k vessels/yr"],
    },
    sampleDataNote: "Sample data — depth pending.",
  },
  {
    id: "suez",
    name: "Suez Canal",
    region: "Egypt",
    lat: 30.5,
    lon: 32.35,
    screen: { x: 0.55, y: 0.41 },
    splineObjectName: null,
    cameraTarget: {
      position: { x: 220, y: 180, z: 260 },
      rotation: { x: -0.4, y: 0.6, z: 0 },
    },
    layers: {
      ports: ["Port Said (EGY)", "Suez (EGY)"],
      energy: ["SUMED Pipeline terminal"],
      air: ["Corridor UL620"],
      waterways: ["Length: 193 km", "~50 vessels/day avg"],
    },
    sampleDataNote: "Sample data — depth pending.",
  },
  {
    id: "bab-el-mandeb",
    name: "Bab-el-Mandeb",
    region: "Red Sea / Gulf of Aden",
    lat: 12.58,
    lon: 43.33,
    screen: { x: 0.58, y: 0.52 },
    splineObjectName: null,
    cameraTarget: {
      position: { x: 260, y: 100, z: 300 },
      rotation: { x: -0.3, y: 0.75, z: 0 },
    },
    layers: {
      ports: ["Djibouti (DJI)", "Aden (YEM)"],
      energy: ["Regional bunkering (placeholder)"],
      air: ["Corridor UM688"],
      waterways: ["Narrowest width: 16 nm", "Perim Island splits channel"],
    },
    sampleDataNote: "Sample data — depth pending.",
  },
  {
    id: "panama",
    name: "Panama Canal",
    region: "Central America",
    lat: 9.08,
    lon: -79.68,
    screen: { x: 0.24, y: 0.54 },
    splineObjectName: null,
    cameraTarget: {
      position: { x: -280, y: 160, z: 320 },
      rotation: { x: -0.35, y: -0.75, z: 0 },
    },
    layers: {
      ports: ["Balboa (PAN)", "Colón (PAN)"],
      energy: ["Regional LPG transshipment"],
      air: ["Corridor UA321"],
      waterways: ["Length: 82 km", "Neopanamax locks — 366m × 49m"],
    },
    sampleDataNote: "Sample data — depth pending.",
  },
];

export const getLocation = (id: LocationId | null): Location | null =>
  id ? (LOCATIONS.find((l) => l.id === id) ?? null) : null;
