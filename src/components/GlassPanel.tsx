import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`relative max-w-[420px] w-full mx-4 ${className}`}>
      <div
        className="relative z-10 p-8"
        style={{
          background: "rgba(10, 14, 20, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(45, 229, 217, 0.3)",
          boxShadow:
            "0 0 30px rgba(45, 229, 217, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {children}
      </div>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <div
          key={c}
          className={`absolute w-4 h-4 ${c[0] === "t" ? "top-0" : "bottom-0"} ${
            c[1] === "l" ? "left-0" : "right-0"
          }`}
        >
          <div
            className={`absolute w-full ${c[0] === "t" ? "top-0" : "bottom-0"} ${
              c[1] === "l" ? "left-0" : "right-0"
            }`}
            style={{
              height: "1px",
              background: "var(--accent-cyan)",
              boxShadow: "0 0 8px var(--accent-cyan)",
            }}
          />
          <div
            className={`absolute h-full ${c[0] === "t" ? "top-0" : "bottom-0"} ${
              c[1] === "l" ? "left-0" : "right-0"
            }`}
            style={{
              width: "1px",
              background: "var(--accent-cyan)",
              boxShadow: "0 0 8px var(--accent-cyan)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default GlassPanel;
