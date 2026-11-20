import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as { phone?: unknown } | null;
    const phone = typeof body?.phone === "string" ? normalizePhone(body.phone) : null;
    if (!phone) return NextResponse.json({ error: PHONE_HINT }, { status: 400 });

    // Hanya daya yang perlu: tanpa nama pemesan dan tanpa catatan
    const orders = await db.order.findMany({
        where: { phone },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true, code: true, total: true, paymentStatus: true, prepStatus: true, createdAt: true, paidAt: true,
            items: { select: { id: true, name: true, qty: true, price: true } },
            payments: {
                orderBy: { createdAt: "desc" },
                select: { id: true, status: true, amount: true, method: true, createdAt: true, paidAt: true },
            }

        },
    });
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}