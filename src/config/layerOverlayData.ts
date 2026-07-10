// Layer overlay data — real lat/lng coordinates for globe rendering.
// Ports & Energy → point markers; Air Routes & Waterways → arc/path data.

export interface PortPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface EnergyPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface ArcRoute {
  id: string;
  label: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export interface WaterwayPath {
  id: string;
  label: string;
  coords: [number, number][]; // [lat, lng] pairs
}

// ─── PORTS ────────────────────────────────────────────────────────────────────
export const PORT_POINTS: PortPoint[] = [
  // Persian Gulf / Hormuz
  { id: "bandar-abbas", name: "Bandar Abbas (IRN)", lat: 27.18, lng: 56.28 },
  { id: "jebel-ali", name: "Jebel Ali (UAE)", lat: 24.99, lng: 55.06 },
  { id: "khasab", name: "Khasab (OMN)", lat: 26.19, lng: 56.24 },
  { id: "fujairah", name: "Fujairah (UAE)", lat: 25.12, lng: 56.34 },
  // SE Asia / Malacca
  { id: "port-klang", name: "Port Klang (MYS)", lat: 3.0, lng: 101.4 },
  { id: "singapore", name: "Singapore (SGP)", lat: 1.26, lng: 103.82 },
  { id: "belawan", name: "Belawan (IDN)", lat: 3.79, lng: 98.69 },
  // Suez
  { id: "port-said", name: "Port Said (EGY)", lat: 31.26, lng: 32.28 },
  { id: "suez-port", name: "Suez (EGY)", lat: 29.97, lng: 32.54 },
  // Bab-el-Mandeb
  { id: "djibouti", name: "Djibouti (DJI)", lat: 11.59, lng: 43.15 },
  { id: "aden", name: "Aden (YEM)", lat: 12.78, lng: 44.99 },
  // Panama
  { id: "balboa", name: "Balboa (PAN)", lat: 8.95, lng: -79.57 },
  { id: "colon", name: "Colón (PAN)", lat: 9.36, lng: -79.9 },
];

// ─── ENERGY ───────────────────────────────────────────────────────────────────
export const ENERGY_POINTS: EnergyPoint[] = [
  { id: "kharg-island", name: "Kharg Island Oil Terminal", lat: 29.24, lng: 50.33 },
  { id: "fujairah-bunker", name: "Fujairah Bunkering Complex", lat: 25.12, lng: 56.34 },
  { id: "das-island", name: "Das Island LNG (UAE)", lat: 25.15, lng: 52.87 },
  { id: "south-pars", name: "South Pars Gas Field", lat: 27.12, lng: 52.66 },
  { id: "sumed-pipeline", name: "SUMED Pipeline Terminal", lat: 31.18, lng: 29.87 },
  { id: "aden-refinery", name: "Aden Refinery (YEM)", lat: 12.78, lng: 45.03 },
  { id: "singapore-refinery", name: "Singapore Refining Hub", lat: 1.21, lng: 103.74 },
  { id: "panama-lpg", name: "Panama LPG Transshipment", lat: 9.05, lng: -79.72 },
];

// ─── AIR ROUTES ───────────────────────────────────────────────────────────────
export const AIR_ROUTES: ArcRoute[] = [
  // Hormuz corridor
  { id: "b449", label: "B449 Doha–Karachi", startLat: 25.27, startLng: 51.61, endLat: 24.91, endLng: 67.17 },
  { id: "p975", label: "P975 Muscat–Tehran", startLat: 23.59, startLng: 58.29, endLat: 35.69, endLng: 51.39 },
  { id: "n571", label: "N571 Dubai–Delhi", startLat: 25.25, startLng: 55.36, endLat: 28.56, endLng: 77.1 },
  // Malacca corridor
  { id: "l642", label: "L642 Singapore–Bangkok", startLat: 1.36, startLng: 103.99, endLat: 13.69, endLng: 100.75 },
  { id: "m771", label: "M771 Singapore–Hong Kong", startLat: 1.36, startLng: 103.99, endLat: 22.31, endLng: 113.92 },
  // Suez corridor
  { id: "ul620", label: "UL620 Cairo–Rome", startLat: 30.11, startLng: 31.4, endLat: 41.8, endLng: 12.25 },
  // Bab-el-Mandeb
  { id: "um688", label: "UM688 Djibouti–Addis Ababa", startLat: 11.55, startLng: 43.15, endLat: 9.03, endLng: 38.75 },
  // Panama
  { id: "ua321", label: "UA321 Panama City–Miami", startLat: 8.99, startLng: -79.53, endLat: 25.79, endLng: -80.29 },
];

// ─── WATERWAYS ────────────────────────────────────────────────────────────────
export const WATERWAY_PATHS: WaterwayPath[] = [
  {
    id: "hormuz-tss",
    label: "Strait of Hormuz TSS",
    coords: [
      [26.57, 55.0],
      [26.57, 56.25],
      [26.4, 57.2],
      [25.6, 57.8],
    ],
  },
  {
    id: "malacca-channel",
    label: "Malacca Strait Channel",
    coords: [
      [5.5, 100.5],
      [3.8, 100.8],
      [2.5, 101.5],
      [1.3, 103.8],
    ],
  },
  {
    id: "suez-canal",
    label: "Suez Canal",
    coords: [
      [31.26, 32.32],
      [30.73, 32.34],
      [30.22, 32.37],
      [29.97, 32.54],
    ],
  },
  {
    id: "bab-el-mandeb-channel",
    label: "Bab-el-Mandeb Channel",
    coords: [
      [13.5, 43.0],
      [12.8, 43.2],
      [12.2, 43.5],
      [11.6, 43.8],
    ],
  },
  {
    id: "panama-canal",
    label: "Panama Canal",
    coords: [
      [9.36, -79.9],
      [9.2, -79.85],
      [9.08, -79.68],
      [8.95, -79.57],
    ],
  },
];
