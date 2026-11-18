import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    select: { paymentStatus: true, prepStatus: true },
  });
  if (!order) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
