import { useState, useEffect } from "react";

const statusLines = [
  "SATLINK: STABLE",
  "NODE: SYNCED",
  "ENCRYPTION: AES-256",
  "UPLINK: SECURE",
  "PROTOCOL: TLS-1.3",
  "FIREWALL: ACTIVE",
  "THREAT_LVL: LOW",
  "CHANNEL: CLEAR",
];

function SystemStatusReadout() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % statusLines.length);
        setIsTransitioning(false);
      }, 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-xs text-zinc-500 flex items-center gap-2 justify-center mb-6">
      <span className="text-accent-cyan">{">"}</span>
      <span
        className={`transition-opacity duration-200 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
      >
        {statusLines[currentIndex]}
      </span>
      <span className="animate-pulse">_</span>
    </div>
  );
}

export default SystemStatusReadout;
