import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { LogOut, ChevronDown } from "lucide-react";

function TopCommandBar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [utcTime, setUtcTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.primaryEmailAddress?.emailAddress?.[0] ?? "O").toUpperCase();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-bg-panel/90 backdrop-blur-md"
      style={{ borderBottom: "1px solid var(--border-hair)" }}
    >
      <div className="flex items-center gap-2.5 w-64">
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </div>
        <span className="font-heading text-sm tracking-wider text-zinc-200 font-semibold">
          ORBITAL<span className="text-accent-cyan">/OPS</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-zinc-500 tracking-widest">UTC</span>
        <span
          className="font-mono text-sm text-accent-cyan tabular-nums"
          style={{ textShadow: "0 0 8px rgba(45,229,217,0.4)" }}
        >
          {utcTime}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
          style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }}
        />
      </div>

      <div className="w-64 flex justify-end relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-sm transition-colors hover:bg-white/5"
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover"
              style={{ border: "1px solid var(--border-hair)" }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold"
              style={{
                background: "rgba(45,229,217,0.15)",
                border: "1px solid var(--border-hair)",
                color: "var(--accent-cyan)",
              }}
            >
              {initials}
            </div>
          )}
          <span className="font-mono text-xs text-zinc-300 max-w-[120px] truncate">
            {user?.primaryEmailAddress?.emailAddress ?? "OPERATOR"}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute top-full right-0 mt-2 w-56 z-50"
              style={{
                background: "rgba(10,14,20,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-hair)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(45,229,217,0.15)" }}>
                <div className="font-mono text-xs text-zinc-500">SIGNED IN AS</div>
                <div className="font-mono text-xs text-zinc-200 mt-1 truncate">
                  {user?.primaryEmailAddress?.emailAddress ?? "OPERATOR"}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 font-mono text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                TERMINATE SESSION
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default TopCommandBar;
