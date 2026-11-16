import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { rupiah } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) notFound();
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-3xl bg-white p-6 text-center shadow-lg shadow-chai-500/10">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-2 text-2xl font-extrabold">Pesanan diterima, {order.customerName}!</h1>
        <p className="text-sm text-chai-800/60">Kode: <b>{order.code}</b> · {format(order.createdAt, "dd/MM/yyyy HH:mm")}</p>

        <ul className="mt-5 space-y-1 text-left">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between"><span>{i.qty}× {i.name}</span><span>{rupiah(i.price * i.qty)}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-chai-100 pt-3 text-lg font-extrabold">
          <span>Total</span><span className="text-chai-600">{rupiah(order.total)}</span>
        </div>

        <div className="mt-6 rounded-2xl bg-chai-50 p-4">
          <p className="font-semibold">Scan QRIS untuk membayar</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qris.png" alt="QRIS ixy Thai Tea" className="mx-auto mt-3 w-64 max-w-full rounded-xl bg-white p-2" />
          <p className="mt-3 text-sm text-chai-800/70">Bayar tepat <b>{rupiah(order.total)}</b>, lalu kirim bukti bayar + kode <b>{order.code}</b> ke penjual.</p>
        </div>
        <p className="mt-4 inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-800">Status: {order.status.replace("_", " ")}</p>
        <a href="/" className="mt-6 block font-semibold text-chai-600">← Pesan lagi</a>
      </div>
    </main>
  );
}
