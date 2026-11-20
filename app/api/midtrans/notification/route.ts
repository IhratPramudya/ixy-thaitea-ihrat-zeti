import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySignature } from "@/lib/midtrans";
import { syncPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!verifySignature(body)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const orderId = String((body as Record<string, unknown>).order_id);
  const payment = await db.payment.findUnique({ where: { midtransOrderId: orderId } });
  if (!payment) return NextResponse.json({ ok: true }); // mis. tes notifikasi dari dashboard

  try {
    // Status dikonfirmasi ulang langsung ke Midtrans, bukan dipercaya dari isi notifikasi
    await syncPayment(payment.id);
  } catch (e) {
    console.error("notification error:", e);
    return NextResponse.json({ error: "retry" }, { status: 500 }); // Midtrans akan mengirim ulang
  }
  return NextResponse.json({ ok: true });
}
