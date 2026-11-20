import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";

const schema = z.object({
  customerName: z.string().trim().min(1, "Nama wajib diisi").max(60),
  phone: z.string().trim().min(1, "Nomor WhatsApp wajib diisi").max(30),
  note: z.string().trim().max(200).optional(),
  items: z
    .array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(20) }))
    .min(1, "Pilih minimal satu minuman")
    .max(20),
});

const newCode = () => "IXY-" + Math.random().toString(36).slice(2, 7).toUpperCase();

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { items, phone: rawPhone, customerName, note } = parsed.data;

  const phone = normalizePhone(rawPhone);
  if (!phone) return NextResponse.json({ error: PHONE_HINT }, { status: 400 });

  try {
    // Harga selalu dihitung di server, bukan dari browser
    const products = await db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, active: true },
    });
    const merged = new Map<string, number>();
    for (const i of items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.qty);
    const lines = Array.from(merged.entries()).flatMap(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      return p ? [{ name: p.name, price: p.price, qty: Math.min(qty, 20) }] : [];
    });
    if (!lines.length) return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 400 });
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const order = await db.order.create({
          data: { customerName, phone, note, total, code: newCode(), items: { create: lines } },
        });
        return NextResponse.json({ id: order.id });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // kode bentrok
        throw e;
      }
    }
    return NextResponse.json({ error: "Gagal membuat kode pesanan, coba lagi." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server, coba lagi." }, { status: 500 });
  }
}
