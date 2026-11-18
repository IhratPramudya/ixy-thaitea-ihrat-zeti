import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["PAY", "CANCEL", "START", "READY", "DONE"]) });
type Action = z.infer<typeof schema>["action"];

// Setiap aksi hanya boleh jalan dari status yang benar (mencegah klik ganda / status loncat)
function rule(action: Action): { where: Prisma.OrderWhereInput; data: Prisma.OrderUpdateManyMutationInput } {
  switch (action) {
    case "PAY":
      return { where: { paymentStatus: "MENUNGGU", prepStatus: "BARU" }, data: { paymentStatus: "LUNAS", paidAt: new Date() } };
    case "CANCEL":
      return { where: { paymentStatus: "MENUNGGU", prepStatus: "BARU" }, data: { prepStatus: "BATAL" } };
    case "START":
      return { where: { paymentStatus: "LUNAS", prepStatus: "BARU" }, data: { prepStatus: "DIPROSES" } };
    case "READY":
      return { where: { paymentStatus: "LUNAS", prepStatus: "DIPROSES" }, data: { prepStatus: "SIAP" } };
    case "DONE":
      return { where: { paymentStatus: "LUNAS", prepStatus: "SIAP" }, data: { prepStatus: "SELESAI" } };
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getServerSession(authOptions))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });

  const { where, data } = rule(parsed.data.action);
  const result = await db.order.updateMany({ where: { id: params.id, ...where }, data });
  if (result.count === 0) {
    return NextResponse.json({ error: "Status pesanan sudah berubah. Daftar dimuat ulang." }, { status: 409 });
  }
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true } });
  return NextResponse.json(order);
}
