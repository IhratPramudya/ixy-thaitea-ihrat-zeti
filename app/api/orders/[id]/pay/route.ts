import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chargeQris, midtransEnabled } from "@/lib/midtrans";
import { syncPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

const pub = (p: { status: string; qrUrl: string | null; expiresAt: Date | null }) => ({
  status: p.status,
  qrUrl: p.qrUrl,
  expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
});

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  if (order.paymentStatus === "LUNAS") return NextResponse.json({ mode: "paid" });
  if (order.prepStatus === "BATAL") return NextResponse.json({ error: "Pesanan sudah dibatalkan." }, { status: 409 });
  if (!midtransEnabled()) return NextResponse.json({ mode: "manual" });

  try {
    // Cek dulu apakah pembayaran sebelumnya ternyata sudah masuk
    const pendings = await db.payment.findMany({ where: { orderId: order.id, status: "PENDING" } });
    for (const p of pendings) {
      try { await syncPayment(p.id); } catch { /* lanjut */ }
    }
    const fresh = await db.order.findUnique({ where: { id: order.id }, select: { paymentStatus: true } });
    if (fresh?.paymentStatus === "LUNAS") return NextResponse.json({ mode: "paid" });

    // Pakai kembali QRIS yang masih berlaku
    const existing = await db.payment.findFirst({
      where: { orderId: order.id, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return NextResponse.json({ mode: "midtrans", payment: pub(existing) });

    const midtransOrderId = `${order.code}-${Date.now().toString(36).toUpperCase()}`;
    const charge = await chargeQris({
      orderId: midtransOrderId,
      amount: order.total,
      name: order.customerName,
      phone: order.phone ?? undefined,
    });
    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        midtransOrderId,
        amount: order.total,
        qrUrl: charge.qrUrl,
        qrString: charge.qrString,
        expiresAt: charge.expiresAt,
      },
    });
    return NextResponse.json({ mode: "midtrans", payment: pub(payment) });
  } catch (e) {
    console.error("pay error:", e);
    return NextResponse.json({ error: "Gagal membuat QRIS. Coba lagi sebentar." }, { status: 502 });
  }
}
