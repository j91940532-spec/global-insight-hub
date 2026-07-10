import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";
import { Send } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import GlassPanel from "@/components/GlassPanel";
import SystemStatusReadout from "@/components/SystemStatusReadout";
import OTPInput from "@/components/OTPInput";

export const Route = createFileRoute("/")({
  ssr: false,
  component: LoginPage,
});

type AuthStep = "email" | "code";
type AuthMode = "signIn" | "signUp";

function LoginPage() {
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<AuthStep>("email");
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sessionId] = useState(() => "AX-" + Math.random().toString(36).substring(2, 6).toUpperCase());

  useEffect(() => {
    if (isSignedIn) navigate({ to: "/dashboard" });
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !isSignInLoaded || !signUp || !isSignUpLoaded) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email, strategy: "email_code" });
      if (result.status === "needs_first_factor") {
        setAuthMode("signIn");
        setStep("code");
        setCooldown(30);
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ code?: string; message?: string }> };
      const clerkCode = e?.errors?.[0]?.code;
      const clerkMsg = e?.errors?.[0]?.message ?? "";
      console.error("[Auth] signIn.create failed:", clerkCode, clerkMsg);
      if (clerkCode === "form_identifier_not_found") {
        try {
          await signUp.create({ emailAddress: email });
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setAuthMode("signUp");
          setStep("code");
          setCooldown(30);
        } catch (signUpErr: unknown) {
          const s = signUpErr as { errors?: Array<{ code?: string; message?: string }> };
          const signUpMsg = s?.errors?.[0]?.message ?? "Failed to send code";
          if (signUpMsg.toLowerCase().includes("rate")) {
            setError("RATE LIMITED. WAIT BEFORE RETRYING.");
          } else {
            setError(`TRANSMISSION FAILED. ${signUpMsg.toUpperCase()}`);
          }
        }
      } else if (clerkMsg.toLowerCase().includes("rate")) {
        setError("RATE LIMITED. WAIT BEFORE RETRYING.");
      } else {
        setError(`TRANSMISSION FAILED. ${clerkMsg.toUpperCase() || "VERIFY IDENTIFIER."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !isSignInLoaded || !signUp || !isSignUpLoaded || code.length !== 6) return;
    setError(null);
    setIsLoading(true);
    try {
      if (authMode === "signIn") {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate({ to: "/dashboard" });
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate({ to: "/dashboard" });
        }
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message?: string }> };
      const clerkMsg = e?.errors?.[0]?.message ?? "Verification failed";
      if (clerkMsg.toLowerCase().includes("incorrect") || clerkMsg.toLowerCase().includes("invalid")) {
        setError("INVALID CODE. ACCESS DENIED.");
        setCode("");
      } else if (clerkMsg.toLowerCase().includes("expired")) {
        setError("CODE EXPIRED. REQUEST NEW CODE.");
        setCode("");
        setStep("email");
      } else {
        setError(`VERIFICATION FAILED. ${clerkMsg.toUpperCase()}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signIn || !isSignInLoaded || !signUp || !isSignUpLoaded || cooldown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      if (authMode === "signIn") {
        await signIn.create({ identifier: email, strategy: "email_code" });
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setCooldown(30);
      setCode("");
    } catch {
      setError("RESEND FAILED. TRY AGAIN.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignInLoaded || !isSignUpLoaded) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="font-mono text-accent-cyan">INITIALIZING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center relative overflow-hidden">
      <StarfieldBackground />
      <div className="relative z-10 w-full flex flex-col items-center">
        <SystemStatusReadout />
        <GlassPanel className="relative z-20">
          <h1 className="font-heading text-2xl text-center text-zinc-100 mb-1 tracking-tight">
            GLOBAL OPS ACCESS
          </h1>
          <p className="font-mono text-xs text-zinc-500 text-center mb-8">CLEARANCE REQUIRED</p>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit}>
              <label className="block font-mono text-xs text-zinc-400 mb-2">IDENTIFIER_</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 mb-4 font-mono text-sm bg-transparent outline-none transition-all duration-150"
                style={{
                  border: "1px solid rgba(45, 229, 217, 0.2)",
                  color: "#E4E4E7",
                  caretColor: "var(--accent-cyan)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent-cyan)";
                  e.target.style.boxShadow = "0 0 12px rgba(45, 229, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(45, 229, 217, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {error && (
                <div className="font-mono text-xs text-red-400 text-center mb-4">{error}</div>
              )}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 mt-2 font-heading text-sm uppercase tracking-wider transition-all duration-150 relative overflow-hidden group"
                style={{
                  background: isLoading || !email ? "rgba(45, 229, 217, 0.1)" : "transparent",
                  border: "1px solid var(--accent-cyan)",
                  color: isLoading || !email ? "rgba(45, 229, 217, 0.4)" : "var(--accent-cyan)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && email) {
                    e.currentTarget.style.background = "var(--accent-cyan)";
                    e.currentTarget.style.color = "#05070A";
                    e.currentTarget.style.boxShadow = "0 0 20px var(--accent-cyan)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && email) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--accent-cyan)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="animate-spin">◖</span>
                      TRANSMITTING
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      REQUEST ACCESS CODE
                    </>
                  )}
                </span>
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleCodeSubmit}>
              <p className="font-mono text-xs text-zinc-400 text-center mb-6">
                ENTER ACCESS CODE SENT TO{" "}
                <span className="text-accent-cyan">[{email.replace(/(.{3}).*(@.*)/, "$1***$2")}]</span>
              </p>
              <div className="mb-6">
                <OTPInput value={code} onChange={setCode} disabled={isLoading} error={!!error} />
              </div>
              {error && (
                <div className="font-mono text-xs text-red-400 text-center mb-4">{error}</div>
              )}
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 mb-3 font-heading text-sm uppercase tracking-wider transition-all duration-150"
                style={{
                  background: isLoading || code.length !== 6 ? "rgba(45, 229, 217, 0.1)" : "transparent",
                  border: "1px solid var(--accent-cyan)",
                  color: isLoading || code.length !== 6 ? "rgba(45, 229, 217, 0.4)" : "var(--accent-cyan)",
                }}
              >
                {isLoading ? "VERIFYING..." : "AUTHENTICATE"}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                  }}
                  className="font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← BACK
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isLoading}
                  className="font-mono text-xs text-accent-cyan/70 hover:text-accent-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `RESEND (${cooldown}s)` : "RESEND CODE"}
                </button>
              </div>
            </form>
          )}
        </GlassPanel>
        <div className="font-mono text-xs text-zinc-600 mt-8">
          SESSION::{sessionId} · REGION::AUTO-DETECT
        </div>
      </div>
    </div>
  );
}
