import type { Payment } from "@prisma/client";
import { db } from "@/lib/db";
import { getStatus, type MidtransStatus } from "@/lib/midtrans";

// Hanya status "settlement" dari Midtrans (dicek langsung lewat Status API) yang melunasi pesanan.
export async function applyStatus(p: Payment, s: MidtransStatus) {
  const ts = s.transaction_status;

  if (ts === "settlement") {
    const amountOk = !s.gross_amount || Math.round(parseFloat(s.gross_amount)) === p.amount;
    if (!amountOk || s.fraud_status === "deny" || s.fraud_status === "challenge") return;
    const now = new Date();
    await db.$transaction([
      db.payment.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: "PAID", paidAt: now } }),
      db.order.updateMany({
        where: { id: p.orderId, paymentStatus: "MENUNGGU", prepStatus: { not: "BATAL" } },
        data: { paymentStatus: "LUNAS", paidAt: now },
      }),
    ]);
    return;
  }
  if (ts === "expire") {
    await db.payment.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: "EXPIRED" } });
  } else if (ts === "cancel" || ts === "deny" || ts === "failure") {
    await db.payment.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: "FAILED" } });
  }
}

export async function syncPayment(paymentId: string) {
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p || p.status !== "PENDING") return;
  const s = await getStatus(p.midtransOrderId);
  if (s) await applyStatus(p, s);
}
