// Phase 6 — Incident Reports panel.
// Opens when the left rail's Reports view is active. Compiles the current
// selected location, active layers, and queued pins into a downloadable
// PDF or CSV, and keeps an in-session history the user can re-open.
//
// Persistence caveat: report history lives in Zustand state only — it
// survives view switches but NOT a full page refresh. Same behaviour as
// the pin store from Phase 5.

import { useEffect, useMemo, useState } from "react";
import { X, FileText, Download, Trash2, Anchor, Zap, Plane, Waves, ClipboardList } from "lucide-react";
import {
  useDashboardStore,
  PIN_CATEGORY_META,
  type LayerChip,
  type GeneratedReport,
} from "@/store/dashboardStore";
import { getLocation } from "@/config/locations";
import { generateReportPdf, generateReportCsv } from "@/lib/reportExport";

const CHIP_META: Record<LayerChip, { label: string; icon: typeof Anchor }> = {
  ports: { label: "Ports", icon: Anchor },
  energy: { label: "Energy", icon: Zap },
  air: { label: "Air Routes", icon: Plane },
  waterways: { label: "Waterways", icon: Waves },
};

type Tab = "draft" | "history";

function ReportPanel() {
  const {
    activeView,
    setActiveView,
    reportDraftOpen,
    closeReportDraft,
    selectedLocationId,
    activeChips,
    pins,
    reportQueue,
    unqueuePinFromReport,
    clearReportQueue,
    reports,
    saveReport,
    deleteReport,
  } = useDashboardStore();

  const open = activeView === "reports" || reportDraftOpen;

  const [tab, setTab] = useState<Tab>("draft");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  // Prefill a sensible default title based on the primary selected location.
  useEffect(() => {
    if (!open) return;
    if (title) return;
    const loc = getLocation(selectedLocationId);
    const stamp = new Date().toISOString().slice(0, 10);
    setTitle(loc ? `${loc.name} incident brief — ${stamp}` : `Incident brief — ${stamp}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const queuedPins = useMemo(
    () => pins.filter((p) => reportQueue.includes(p.id)),
    [pins, reportQueue],
  );

  const activeChipList = useMemo(
    () => (Object.keys(activeChips) as LayerChip[]).filter((c) => activeChips[c]),
    [activeChips],
  );

  const locationIds = selectedLocationId ? [selectedLocationId] : [];
  const hasContent = locationIds.length > 0 || queuedPins.length > 0 || activeChipList.length > 0;

  const buildReport = (): Omit<GeneratedReport, "id" | "createdAt"> => ({
    title: title.trim() || "Untitled report",
    notes: notes.trim(),
    locationIds,
    activeChips: activeChipList,
    pinIds: queuedPins.map((p) => p.id),
    pinSnapshot: queuedPins.map((p) => ({ ...p })),
  });

  const handleExportPdf = () => {
    const r = saveReport(buildReport());
    generateReportPdf(r);
  };
  const handleExportCsv = () => {
    const r = saveReport(buildReport());
    generateReportCsv(r);
  };
  const handleSaveOnly = () => {
    saveReport(buildReport());
    setTab("history");
  };

  const handleClose = () => {
    closeReportDraft();
    setActiveView("globe");
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={handleClose} />}
      <aside
        className="fixed right-0 top-14 bottom-7 z-40 w-[440px] transition-transform duration-200 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
        aria-hidden={!open}
      >
        <div
          className="relative h-full flex flex-col"
          style={{
            background: "rgba(10,14,20,0.9)",
            backdropFilter: "blur(16px)",
            borderLeft: "1px solid var(--border-hair)",
            boxShadow: "-8px 0 24px rgba(0,0,0,0.55)",
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-4 h-12"
            style={{ borderBottom: "1px solid rgba(45,229,217,0.15)" }}
          >
            <span className="font-heading text-sm tracking-wider text-zinc-200 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent-cyan" strokeWidth={1.5} />
              REPORTS<span className="text-accent-cyan">/COMPILE</span>
            </span>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-accent-cyan focus:outline-none focus:text-accent-cyan transition-colors"
              aria-label="Close reports panel"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* tabs */}
          <div className="flex" style={{ borderBottom: "1px solid rgba(45,229,217,0.1)" }}>
            {(["draft", "history"] as Tab[]).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2.5 font-mono text-[10px] tracking-widest transition-colors focus:outline-none"
                  style={{
                    color: active ? "var(--accent-cyan)" : "#71717a",
                    borderBottom: active ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                    background: active ? "rgba(45,229,217,0.05)" : "transparent",
                    textShadow: active ? "0 0 8px rgba(45,229,217,0.4)" : "none",
                  }}
                >
                  {t === "draft" ? "COMPILE" : `HISTORY (${reports.length})`}
                </button>
              );
            })}
          </div>

          {tab === "draft" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Title */}
                <div>
                  <label className="block font-mono text-[10px] text-zinc-500 tracking-widest mb-1.5">
                    REPORT TITLE_
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono text-xs bg-transparent outline-none text-zinc-100 focus:border-accent-cyan transition-colors"
                    style={{
                      border: "1px solid rgba(45,229,217,0.25)",
                      caretColor: "var(--accent-cyan)",
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-mono text-[10px] text-zinc-500 tracking-widest mb-1.5">
                    NOTES_
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Analyst notes, observed anomalies, escalation context…"
                    rows={4}
                    className="w-full px-2.5 py-1.5 font-mono text-xs bg-transparent outline-none text-zinc-100 resize-none focus:border-accent-cyan transition-colors"
                    style={{
                      border: "1px solid rgba(45,229,217,0.25)",
                      caretColor: "var(--accent-cyan)",
                    }}
                  />
                </div>

                {/* Locations */}
                <Section title="LOCATIONS" count={locationIds.length}>
                  {locationIds.length === 0 ? (
                    <EmptyRow text="No location selected — click a hotspot on the globe." />
                  ) : (
                    locationIds.map((id) => {
                      const loc = getLocation(id);
                      if (!loc) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between px-2.5 py-2"
                          style={{ borderLeft: "1px solid var(--accent-cyan)" }}
                        >
                          <div>
                            <div className="font-heading text-sm text-zinc-100">{loc.name}</div>
                            <div className="font-mono text-[10px] text-zinc-500 tracking-wider">
                              {loc.region.toUpperCase()}
                            </div>
                          </div>
                          <div className="font-mono text-[10px] text-accent-cyan tabular-nums text-right">
                            {loc.lat.toFixed(3)}°
                            <br />
                            {loc.lon.toFixed(3)}°
                          </div>
                        </div>
                      );
                    })
                  )}
                </Section>

                {/* Active layers */}
                <Section title="ACTIVE LAYERS" count={activeChipList.length}>
                  {activeChipList.length === 0 ? (
                    <EmptyRow text="No layers enabled." />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activeChipList.map((c) => {
                        const Icon = CHIP_META[c].icon;
                        return (
                          <span
                            key={c}
                            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] tracking-wider text-accent-cyan"
                            style={{
                              border: "1px solid var(--accent-cyan)",
                              background: "rgba(45,229,217,0.08)",
                            }}
                          >
                            <Icon className="w-3 h-3" strokeWidth={1.5} />
                            {CHIP_META[c].label.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Section>

                {/* Queued pins */}
                <Section
                  title="PINS IN REPORT"
                  count={queuedPins.length}
                  action={
                    queuedPins.length > 0 ? (
                      <button
                        onClick={clearReportQueue}
                        className="font-mono text-[10px] text-zinc-500 hover:text-accent-amber transition-colors"
                      >
                        CLEAR ALL
                      </button>
                    ) : null
                  }
                >
                  {queuedPins.length === 0 ? (
                    <EmptyRow text="No pins queued. Drop a pin, click it, and choose ADD TO REPORT." />
                  ) : (
                    <ul className="space-y-1">
                      {queuedPins.map((p) => {
                        const m = PIN_CATEGORY_META[p.category];
                        return (
                          <li
                            key={p.id}
                            className="flex items-center gap-2 px-2 py-1.5"
                            style={{ borderLeft: `1px solid ${m.color}` }}
                          >
                            <span
                              className="font-mono text-[9px] tracking-wider px-1.5 py-0.5"
                              style={{ color: m.color, border: `1px solid ${m.color}66` }}
                            >
                              {m.label.toUpperCase()}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-200 truncate flex-1">
                              {p.label}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                              {p.lat.toFixed(1)}°, {p.lon.toFixed(1)}°
                            </span>
                            <button
                              onClick={() => unqueuePinFromReport(p.id)}
                              className="text-zinc-600 hover:text-accent-amber focus:outline-none focus:text-accent-amber transition-colors"
                              aria-label={`Remove ${p.label} from report`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>
              </div>

              {/* Actions */}
              <div
                className="px-4 py-3 flex flex-col gap-2"
                style={{ borderTop: "1px solid rgba(45,229,217,0.15)" }}
              >
                <div className="flex gap-2">
                  <ActionBtn
                    onClick={handleExportPdf}
                    disabled={!hasContent}
                    primary
                    icon={<FileText className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    EXPORT PDF
                  </ActionBtn>
                  <ActionBtn
                    onClick={handleExportCsv}
                    disabled={!hasContent}
                    icon={<Download className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    EXPORT CSV
                  </ActionBtn>
                </div>
                <button
                  onClick={handleSaveOnly}
                  disabled={!hasContent}
                  className="w-full py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 hover:text-accent-cyan disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:text-accent-cyan transition-colors"
                >
                  SAVE TO HISTORY WITHOUT EXPORT
                </button>
                {!hasContent && (
                  <p className="font-mono text-[10px] text-zinc-600 text-center">
                    Select a location or queue a pin to enable export.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <HistoryList
              reports={reports}
              onDelete={deleteReport}
              onPdf={generateReportPdf}
              onCsv={generateReportCsv}
            />
          )}

          {/* footer */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(45,229,217,0.15)" }}
          >
            <span className="font-mono text-[10px] text-zinc-600">PANEL::REPORTS</span>
            <span className="font-mono text-[10px] text-zinc-600">session-scoped</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  count,
  children,
  action,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-heading text-[11px] tracking-widest text-zinc-300">{title}</span>
        <span className="font-mono text-[10px] text-zinc-600">[{count}]</span>
        <div className="flex-1" />
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      className="px-2.5 py-2 font-mono text-[10px] text-zinc-600"
      style={{ borderLeft: "1px dashed rgba(45,229,217,0.2)" }}
    >
      {text}
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  primary,
  icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 py-2 font-heading text-[11px] tracking-widest transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
      style={{
        border: `1px solid ${primary ? "var(--accent-cyan)" : "rgba(45,229,217,0.3)"}`,
        color: primary ? "var(--accent-cyan)" : "#a1a1aa",
        background: primary ? "rgba(45,229,217,0.08)" : "transparent",
        boxShadow: primary && !disabled ? "0 0 12px rgba(45,229,217,0.2)" : "none",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = "0 0 14px rgba(45,229,217,0.35)";
        e.currentTarget.style.color = "var(--accent-cyan)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = primary ? "0 0 12px rgba(45,229,217,0.2)" : "none";
        e.currentTarget.style.color = primary ? "var(--accent-cyan)" : "#a1a1aa";
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function HistoryList({
  reports,
  onDelete,
  onPdf,
  onCsv,
}: {
  reports: GeneratedReport[];
  onDelete: (id: string) => void;
  onPdf: (r: GeneratedReport) => void;
  onCsv: (r: GeneratedReport) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ border: "1px dashed rgba(45,229,217,0.2)" }}
        >
          <ClipboardList className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
        </div>
        <span className="font-mono text-xs text-zinc-500 tracking-wider text-center">
          No reports this session
        </span>
        <span className="font-mono text-[10px] text-zinc-700 text-center max-w-[280px]">
          Compile a report from the COMPILE tab. History clears on page reload.
        </span>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {reports.map((r) => (
        <div
          key={r.id}
          className="p-3 space-y-2 group transition-colors"
          style={{
            border: "1px solid rgba(45,229,217,0.15)",
            background: "rgba(45,229,217,0.02)",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-heading text-xs text-zinc-100 truncate">{r.title}</div>
              <div className="font-mono text-[10px] text-zinc-500 mt-0.5">{r.id}</div>
            </div>
            <button
              onClick={() => onDelete(r.id)}
              className="text-zinc-700 hover:text-accent-amber focus:outline-none focus:text-accent-amber transition-colors"
              aria-label="Delete report"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
            <span>{new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)}Z</span>
            <span>·</span>
            <span>{r.locationIds.length} LOC</span>
            <span>·</span>
            <span>{r.pinSnapshot.length} PIN</span>
            <span>·</span>
            <span>{r.activeChips.length} LAYER</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onPdf(r)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] tracking-wider text-accent-cyan focus:outline-none transition-all"
              style={{ border: "1px solid rgba(45,229,217,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 10px rgba(45,229,217,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <FileText className="w-3 h-3" strokeWidth={1.5} />
              PDF
            </button>
            <button
              onClick={() => onCsv(r)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] tracking-wider text-zinc-300 hover:text-accent-cyan focus:outline-none focus:text-accent-cyan transition-colors"
              style={{ border: "1px solid rgba(45,229,217,0.2)" }}
            >
              <Download className="w-3 h-3" strokeWidth={1.5} />
              CSV
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReportPanel;
