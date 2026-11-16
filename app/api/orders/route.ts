import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  customerName: z.string().trim().min(1, "Nama wajib diisi").max(60),
  phone: z.string().trim().max(40).optional(),
  note: z.string().trim().max(200).optional(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(20) })).min(1, "Pilih minimal satu minuman"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { items, ...rest } = parsed.data;

  // Harga selalu dihitung di server, bukan dari browser
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, active: true } });
  const lines = items.flatMap((i) => {
    const p = products.find((x) => x.id === i.productId);
    return p ? [{ name: p.name, price: p.price, qty: i.qty }] : [];
  });
  if (!lines.length) return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 400 });
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const order = await db.order.create({
    data: { ...rest, total, code: "IXY-" + Math.random().toString(36).slice(2, 7).toUpperCase(), items: { create: lines } },
  });
  return NextResponse.json({ id: order.id });
}
