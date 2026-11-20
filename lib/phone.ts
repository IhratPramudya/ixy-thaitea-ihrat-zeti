export const PHONE_HINT = "Nomor WhatsApp tidak valid. Contoh: 081234567890";

// Mengubah 0812..., +62812..., 62812..., 812... menjadi 62812...
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let n: string;
  if (digits.startsWith("62")) n = digits;
  else if (digits.startsWith("0")) n = "62" + digits.slice(1);
  else if (digits.startsWith("8")) n = "62" + digits;
  else return null;
  return /^628\d{7,11}$/.test(n) ? n : null;
}
