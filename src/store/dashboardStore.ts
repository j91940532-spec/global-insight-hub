import { create } from "zustand";
import type { Application } from "@splinetool/runtime";
import type { LocationId } from "@/config/locations";

export type RailView = "globe" | "layers" | "reports" | "search" | "settings";
export type LayerChip = "ports" | "energy" | "air" | "waterways";

// Phase 5 — pin categories. Colors are drawn from the existing accent
// palette (cyan + amber) plus emerald / violet / zinc so they stay in the
// ops-console visual language and never use default red map pins.
export type PinCategory = "port" | "energy" | "airspace" | "waterway" | "custom";

export const PIN_CATEGORY_META: Record<
  PinCategory,
  { label: string; color: string; glow: string }
> = {
  port: { label: "Port", color: "#2DE5D9", glow: "rgba(45,229,217,0.6)" },
  energy: { label: "Energy", color: "#FFB020", glow: "rgba(255,176,32,0.6)" },
  airspace: { label: "Airspace", color: "#A78BFA", glow: "rgba(167,139,250,0.6)" },
  waterway: { label: "Waterway", color: "#34D399", glow: "rgba(52,211,153,0.6)" },
  custom: { label: "Custom", color: "#E4E4E7", glow: "rgba(228,228,231,0.5)" },
};

export interface CustomPin {
  id: string;
  label: string;
  category: PinCategory;
  // Screen-normalized position (0..1) over the globe canvas — matches how
  // fixed hotspots are positioned, since real Spline object placement
  // isn't wired yet (see src/config/locations.ts note).
  screen: { x: number; y: number };
  // Illustrative equirectangular projection of screen -> lat/lon. Marked
  // as approximate in the popup, since the Spline scene isn't a flat map.
  lat: number;
  lon: number;
  createdAt: number;
}

// Phase 6 — Incident reports (session-only history).
export interface GeneratedReport {
  id: string;
  title: string;
  notes: string;
  createdAt: number;
  locationIds: LocationId[];
  activeChips: LayerChip[];
  pinIds: string[];
  // Snapshot of pin data at generation time so history entries remain
  // re-downloadable even if the live pins array changes later this session.
  pinSnapshot: CustomPin[];
}

interface DashboardState {
  activeView: RailView;
  layersPanelOpen: boolean;
  splineApp: Application | null;
  selectedLocationId: LocationId | null;
  activeChips: Record<LayerChip, boolean>;

  // Phase 5
  addPinMode: boolean;
  pins: CustomPin[];
  selectedPinId: string | null;
  visibleCategories: Record<PinCategory, boolean>;
  commandOpen: boolean;
  reportQueue: string[]; // pin ids queued for a future report

  // Phase 6
  reportDraftOpen: boolean;
  reports: GeneratedReport[];

  setActiveView: (view: RailView) => void;
  toggleLayersPanel: () => void;
  setLayersPanelOpen: (open: boolean) => void;
  setSplineApp: (app: Application | null) => void;
  selectLocation: (id: LocationId | null) => void;
  toggleChip: (chip: LayerChip) => void;

  toggleAddPinMode: () => void;
  addPin: (pin: Omit<CustomPin, "id" | "createdAt">) => void;
  removePin: (id: string) => void;
  selectPin: (id: string | null) => void;
  toggleCategory: (cat: PinCategory) => void;
  setCommandOpen: (open: boolean) => void;
  queuePinForReport: (id: string) => void;
  unqueuePinFromReport: (id: string) => void;
  clearReportQueue: () => void;

  // Phase 6
  openReportDraft: () => void;
  closeReportDraft: () => void;
  saveReport: (report: Omit<GeneratedReport, "id" | "createdAt">) => GeneratedReport;
  deleteReport: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeView: "globe",
  layersPanelOpen: false,
  splineApp: null,
  selectedLocationId: null,
  activeChips: { ports: true, energy: true, air: false, waterways: true },

  addPinMode: false,
  pins: [],
  selectedPinId: null,
  visibleCategories: { port: true, energy: true, airspace: true, waterway: true, custom: true },
  commandOpen: false,
  reportQueue: [],
  reportDraftOpen: false,
  reports: [],

  setActiveView: (view) =>
    set((state) => ({
      activeView: view,
      layersPanelOpen: view === "layers" ? !state.layersPanelOpen : state.layersPanelOpen,
    })),
  toggleLayersPanel: () => set((state) => ({ layersPanelOpen: !state.layersPanelOpen })),
  setLayersPanelOpen: (open) => set({ layersPanelOpen: open }),
  setSplineApp: (app) => set({ splineApp: app }),
  selectLocation: (id) => set({ selectedLocationId: id, layersPanelOpen: id !== null }),
  toggleChip: (chip) =>
    set((state) => ({ activeChips: { ...state.activeChips, [chip]: !state.activeChips[chip] } })),

  toggleAddPinMode: () => set((state) => ({ addPinMode: !state.addPinMode, selectedPinId: null })),
  addPin: (pin) =>
    set((state) => ({
      pins: [
        ...state.pins,
        { ...pin, id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() },
      ],
      addPinMode: false,
    })),
  removePin: (id) =>
    set((state) => ({
      pins: state.pins.filter((p) => p.id !== id),
      selectedPinId: state.selectedPinId === id ? null : state.selectedPinId,
      reportQueue: state.reportQueue.filter((r) => r !== id),
    })),
  selectPin: (id) => set({ selectedPinId: id }),
  toggleCategory: (cat) =>
    set((state) => ({
      visibleCategories: { ...state.visibleCategories, [cat]: !state.visibleCategories[cat] },
    })),
  setCommandOpen: (open) => set({ commandOpen: open }),
  queuePinForReport: (id) =>
    set((state) =>
      state.reportQueue.includes(id) ? state : { reportQueue: [...state.reportQueue, id] },
    ),
  unqueuePinFromReport: (id) =>
    set((state) => ({ reportQueue: state.reportQueue.filter((r) => r !== id) })),
  clearReportQueue: () => set({ reportQueue: [] }),

  openReportDraft: () => set({ reportDraftOpen: true, activeView: "reports" }),
  closeReportDraft: () => set({ reportDraftOpen: false }),
  saveReport: (report) => {
    const full: GeneratedReport = {
      ...report,
      id: `RPT-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
    };
    set((state) => ({ reports: [full, ...state.reports] }));
    return full;
  },
  deleteReport: (id) =>
    set((state) => ({ reports: state.reports.filter((r) => r.id !== id) })),
}));
