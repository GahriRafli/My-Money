"use client";

// Formats number to Indonesian dot-separated: 5000000 → "5.000.000"
export function fmtInput(raw) {
  if (!raw && raw !== 0) return "";
  const str = String(raw).replace(/\D/g, "");
  if (!str) return "";
  return Number(str).toLocaleString("id-ID");
}

export default function AmountInput({ value, onChange, placeholder = "0", style = {}, ...props }) {
  function handleChange(e) {
    const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
    onChange(raw);
  }

  return (
    <input
      {...props}
      inputMode="numeric"
      value={fmtInput(value)}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
    />
  );
}
