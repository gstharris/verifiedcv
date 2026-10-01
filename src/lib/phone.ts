export function toE164(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 8 && raw.trim().startsWith("+")) return `+${digits}`;
  return null;
}
