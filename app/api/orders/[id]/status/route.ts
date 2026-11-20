import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { midtransEnabled } from "@/lib/midtrans";
import { syncPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

const pick = { id: true, paymentStatus: true, prepStatus: true } as const;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let order = await db.order.findUnique({ where: { id: params.id }, select: pick });
  if (!order) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  // Cek langsung ke Midtrans selama pelanggan membuka halaman (cadangan jika webhook terlambat)
  if (order.paymentStatus === "MENUNGGU" && midtransEnabled()) {
    const pending = await db.payment.findFirst({
      where: { orderId: order.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (pending) {
      try { await syncPayment(pending.id); } catch { /* abaikan, coba lagi nanti */ }
      const again = await db.order.findUnique({ where: { id: params.id }, select: pick });
      if (again) order = again;
    }
  }

  const payment = await db.payment.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, expiresAt: true },
  });
  return NextResponse.json(
    { paymentStatus: order.paymentStatus, prepStatus: order.prepStatus, payment },
    { headers: { "Cache-Control": "no-store" } },
  );
}
