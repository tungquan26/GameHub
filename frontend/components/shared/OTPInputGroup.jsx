import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export default function OTPInputGroup({ value, onChange, disabled = false, invalid = false, autoFocus = true }) {
  const inputs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");
  useEffect(() => { if (autoFocus) inputs.current[0]?.focus(); }, [autoFocus]);
  function fill(raw, index = 0) {
    const clean = raw.replace(/[^0-9]/g, "").slice(0, 6);
    if (!clean) return;
    const next = [...digits];
    [...clean].forEach((digit, offset) => { if (index + offset < 6) next[index + offset] = digit; });
    onChange(next);
    inputs.current[Math.min(index + clean.length, 5)]?.focus();
  }
  function keyDown(event, index) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      inputs.current[Math.max(0, Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus();
    } else if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits]; next[index - 1] = ""; onChange(next);
      inputs.current[index - 1]?.focus();
    }
  }
  return <div role="group" aria-label="Mã xác thực 6 chữ số" className="flex justify-between gap-2">
    {digits.map((digit, index) => <Input key={index} ref={(element) => { inputs.current[index] = element; }}
      aria-label={`Chữ số ${index + 1}`} aria-invalid={invalid} value={digit} disabled={disabled}
      type="text" inputMode="numeric" pattern="[0-9]" maxLength={index === 0 ? 6 : 1}
      autoComplete={index === 0 ? "one-time-code" : "off"} required
      className="h-13 min-w-0 flex-1 px-0 text-center font-mono text-xl sm:h-14"
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw.length > 1) fill(raw, index);
        else { const next = [...digits]; next[index] = raw.replace(/[^0-9]/g, ""); onChange(next); if (next[index] && index < 5) inputs.current[index + 1]?.focus(); }
      }}
      onKeyDown={(event) => keyDown(event, index)}
      onPaste={(event) => { event.preventDefault(); fill(event.clipboardData.getData("text")); }}
    />)}
  </div>;
}
