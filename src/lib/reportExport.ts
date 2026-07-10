// Phase 6 — client-side PDF/CSV export for incident reports.
// Themed to match the ops-console visual language (near-black header band,
// cyan hairline accents, monospace data fields) rather than jsPDF defaults.

import { jsPDF } from "jspdf";
import type { GeneratedReport, CustomPin } from "@/store/dashboardStore";
import { PIN_CATEGORY_META, type LayerChip } from "@/store/dashboardStore";
import { getLocation } from "@/config/locations";

const CHIP_LABEL: Record<LayerChip, string> = {
  ports: "Ports",
  energy: "Energy Infrastructure",
  air: "Air Routes",
  waterways: "Waterways",
};

const COLORS = {
  bg: [5, 7, 10] as [number, number, number],
  headerBand: [10, 14, 20] as [number, number, number],
  cyan: [45, 229, 217] as [number, number, number],
  amber: [255, 176, 32] as [number, number, number],
  text: [228, 228, 231] as [number, number, number],
  dim: [113, 113, 122] as [number, number, number],
  faint: [63, 63, 70] as [number, number, number],
};

function fmtUTC(ts: number) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function triggerBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function generateReportPdf(report: GeneratedReport): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Page background — near-black
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageW, pageH, "F");

  // Header band
  doc.setFillColor(...COLORS.headerBand);
  doc.rect(0, 0, pageW, 96, "F");
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.6);
  doc.line(0, 96, pageW, 96);

  // Corner brackets
  const bracket = (x: number, y: number, dx: number, dy: number) => {
    doc.line(x, y, x + dx * 10, y);
    doc.line(x, y, x, y + dy * 10);
  };
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.8);
  bracket(margin - 8, 20, 1, 1);
  bracket(pageW - margin + 8, 20, -1, 1);

  // Title
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INCIDENT REPORT", margin, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.text(report.title || "Untitled report", margin, 62);

  // Meta row (monospace)
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dim);
  const metaY = 82;
  doc.text(`ID :: ${report.id}`, margin, metaY);
  doc.text(`GEN :: ${fmtUTC(report.createdAt)}`, pageW - margin, metaY, { align: "right" });

  // Body cursor
  let y = 130;

  const sectionHeading = (label: string) => {
    if (y > pageH - 80) {
      doc.addPage();
      doc.setFillColor(...COLORS.bg);
      doc.rect(0, 0, pageW, pageH, "F");
      y = margin;
    }
    doc.setDrawColor(...COLORS.cyan);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 4, margin + 14, y + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.cyan);
    doc.text(label.toUpperCase(), margin + 20, y + 7);
    y += 20;
  };

  const kv = (k: string, v: string) => {
    if (y > pageH - 60) {
      doc.addPage();
      doc.setFillColor(...COLORS.bg);
      doc.rect(0, 0, pageW, pageH, "F");
      y = margin;
    }
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dim);
    doc.text(k, margin, y);
    doc.setTextColor(...COLORS.text);
    const wrapped = doc.splitTextToSize(v, pageW - margin * 2 - 90);
    doc.text(wrapped, margin + 90, y);
    y += Math.max(14, wrapped.length * 12);
  };

  // NOTES
  if (report.notes.trim()) {
    sectionHeading("Notes");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    const wrapped = doc.splitTextToSize(report.notes.trim(), pageW - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13 + 8;
  }

  // LOCATIONS
  sectionHeading(`Locations (${report.locationIds.length})`);
  if (report.locationIds.length === 0) {
    kv("—", "No locations selected");
  } else {
    for (const id of report.locationIds) {
      const loc = getLocation(id);
      if (!loc) continue;
      kv("LOC", `${loc.name} — ${loc.region}`);
      kv("COORD", `${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°`);
      y += 4;
    }
  }
  y += 6;

  // ACTIVE LAYERS
  sectionHeading("Active Layers");
  if (report.activeChips.length === 0) {
    kv("—", "None enabled");
  } else {
    kv("CHIPS", report.activeChips.map((c) => CHIP_LABEL[c]).join(" · "));
  }
  y += 6;

  // PINS
  sectionHeading(`Pins in report (${report.pinSnapshot.length})`);
  if (report.pinSnapshot.length === 0) {
    kv("—", "No pins queued");
  } else {
    // Table header
    if (y > pageH - 80) {
      doc.addPage();
      doc.setFillColor(...COLORS.bg);
      doc.rect(0, 0, pageW, pageH, "F");
      y = margin;
    }
    doc.setDrawColor(...COLORS.faint);
    doc.setLineWidth(0.3);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dim);
    doc.text("CAT", margin, y);
    doc.text("LABEL", margin + 60, y);
    doc.text("LAT", margin + 260, y);
    doc.text("LON", margin + 320, y);
    doc.text("CREATED (UTC)", margin + 380, y);
    y += 4;
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    for (const pin of report.pinSnapshot) {
      if (y > pageH - 40) {
        doc.addPage();
        doc.setFillColor(...COLORS.bg);
        doc.rect(0, 0, pageW, pageH, "F");
        y = margin;
      }
      const meta = PIN_CATEGORY_META[pin.category];
      doc.setTextColor(meta.color as unknown as string);
      // jsPDF setTextColor with hex string
      doc.setTextColor(meta.color);
      doc.text(meta.label.toUpperCase().slice(0, 7), margin, y);
      doc.setTextColor(...COLORS.text);
      doc.text(pin.label.slice(0, 38), margin + 60, y);
      doc.setTextColor(...COLORS.dim);
      doc.text(pin.lat.toFixed(3), margin + 260, y);
      doc.text(pin.lon.toFixed(3), margin + 320, y);
      doc.text(fmtUTC(pin.createdAt), margin + 380, y);
      y += 12;
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.cyan);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.dim);
    doc.text(`ORBITAL/OPS · CONFIDENTIAL`, margin, pageH - 16);
    doc.text(`PAGE ${i} / ${pageCount}`, pageW - margin, pageH - 16, { align: "right" });
  }

  const safeTitle = (report.title || "report").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40);
  doc.save(`${report.id}_${safeTitle}.pdf`);
}

function csvEscape(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function generateReportCsv(report: GeneratedReport): void {
  const rows: string[] = [];
  rows.push(
    [
      "report_id",
      "report_title",
      "generated_utc",
      "record_type",
      "id",
      "category_or_layer",
      "label",
      "region",
      "lat",
      "lon",
      "created_utc",
    ].map(csvEscape).join(","),
  );

  const meta = [report.id, report.title || "", fmtUTC(report.createdAt)];

  for (const id of report.locationIds) {
    const loc = getLocation(id);
    if (!loc) continue;
    rows.push(
      [...meta, "location", loc.id, "-", loc.name, loc.region, loc.lat, loc.lon, ""]
        .map(csvEscape)
        .join(","),
    );
  }
  for (const chip of report.activeChips) {
    rows.push(
      [...meta, "active_layer", chip, chip, CHIP_LABEL[chip], "", "", "", ""]
        .map(csvEscape)
        .join(","),
    );
  }
  for (const pin of report.pinSnapshot as CustomPin[]) {
    rows.push(
      [
        ...meta,
        "pin",
        pin.id,
        pin.category,
        pin.label,
        "",
        pin.lat.toFixed(6),
        pin.lon.toFixed(6),
        fmtUTC(pin.createdAt),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const safeTitle = (report.title || "report").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40);
  triggerBlob(blob, `${report.id}_${safeTitle}.csv`);
}
