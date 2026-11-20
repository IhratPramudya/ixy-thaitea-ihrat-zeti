import { createHash, timingSafeEqual } from "crypto";

const key = () => process.env.MIDTRANS_SERVER_KEY ?? "";
export const midtransEnabled = () => key().length > 0;
// Kunci sandbox selalu berawalan "SB-"
const base = () => (key().startsWith("SB-") ? "https://api.sandbox.midtrans.com" : "https://api.midtrans.com");
const auth = () => "Basic " + Buffer.from(key() + ":").toString("base64");

export type MidtransStatus = {
  status_code?: string;
  status_message?: string;
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  order_id?: string;
  expiry_time?: string;
  qr_string?: string;
  actions?: { name: string; method?: string; url: string }[];
};

async function call(path: string, init?: RequestInit): Promise<MidtransStatus> {
  const res = await fetch(base() + path, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: auth() },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => null)) as MidtransStatus | null;
  if (!data) throw new Error(`Midtrans HTTP ${res.status}`);
  return data;
}

// Waktu dari Midtrans berformat "YYYY-MM-DD HH:mm:ss" dalam WIB
export function parseMidtransTime(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s.replace(" ", "T") + "+07:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function chargeQris(p: { orderId: string; amount: number; name: string; phone?: string }) {
  const data = await call("/v2/charge", {
    method: "POST",
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: { order_id: p.orderId, gross_amount: p.amount },
      qris: { acquirer: "gopay" },
      customer_details: { first_name: p.name.slice(0, 50), ...(p.phone ? { phone: p.phone } : {}) },
      custom_expiry: { expiry_duration: 15, unit: "minute" },
    }),
  });
  if (data.status_code !== "201" && data.status_code !== "200") {
    throw new Error(data.status_message ?? "Charge QRIS gagal");
  }
  const qrUrl =
    data.actions?.find((a) => a.name === "generate-qr-code")?.url ??
    data.actions?.find((a) => a.name === "generate-qr-code-v2")?.url ??
    null;
  if (!qrUrl) throw new Error("Midtrans tidak mengembalikan gambar QR");
  return {
    qrUrl,
    qrString: data.qr_string ?? null,
    expiresAt: parseMidtransTime(data.expiry_time) ?? new Date(Date.now() + 15 * 60 * 1000),
  };
}

// Mengembalikan null jika transaksi tidak ditemukan di Midtrans
export async function getStatus(orderId: string): Promise<MidtransStatus | null> {
  const data = await call(`/v2/${encodeURIComponent(orderId)}/status`);
  if (data.status_code === "404") return null;
  return data;
}

// signature_key = SHA512(order_id + status_code + gross_amount + serverKey)
export function verifySignature(body: unknown): boolean {
  if (!midtransEnabled() || !body || typeof body !== "object") return false;
  const { order_id, status_code, gross_amount, signature_key } = body as Record<string, unknown>;
  if (typeof order_id !== "string" || typeof status_code !== "string" || typeof gross_amount !== "string" || typeof signature_key !== "string") return false;
  const expected = Buffer.from(createHash("sha512").update(order_id + status_code + gross_amount + key()).digest("hex"));
  const given = Buffer.from(signature_key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
