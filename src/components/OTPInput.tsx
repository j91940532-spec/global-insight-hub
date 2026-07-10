import { useRef, useState, useEffect } from "react";
import type { KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

function OTPInput({ value, onChange, disabled = false, error = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split("").concat(Array(6 - value.length).fill(""));

  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;
    const newValue = value.split("");
    newValue[index] = digit.replace(/\D/g, "").slice(-1);
    const updated = newValue.join("");
    onChange(updated);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pastedData);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = digit !== "";
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => {
              setFocusedIndex(index);
              inputRefs.current[index]?.select();
            }}
            onBlur={() => setFocusedIndex(null)}
            className={`w-12 h-14 font-mono text-xl text-center bg-transparent outline-none transition-all duration-150 ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
            }`}
            style={{
              border: `1px solid ${
                error
                  ? "rgba(239, 68, 68, 0.5)"
                  : isFocused || hasValue
                    ? "var(--accent-cyan)"
                    : "rgba(45, 229, 217, 0.2)"
              }`,
              boxShadow:
                isFocused || hasValue
                  ? "0 0 12px rgba(45, 229, 217, 0.4), inset 0 0 8px rgba(45, 229, 217, 0.1)"
                  : "none",
              color: hasValue ? "var(--accent-cyan)" : "transparent",
              caretColor: "var(--accent-cyan)",
            }}
          />
        );
      })}
    </div>
  );
}

export default OTPInput;
