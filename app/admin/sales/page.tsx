import { db } from "@/lib/db";
import { rupiah } from "@/lib/format";
import SalesChart from "@/components/SalesChart";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600 * 1000;
// tanggal dalam WIB (UTC+7), independen dari zona waktu server
const wibKey = (d: Date) => new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

export default async function SalesPage() {
  const paid = { paymentStatus: "LUNAS", prepStatus: { not: "BATAL" } };
  const [items, orderCount] = await Promise.all([
    db.orderItem.findMany({
      where: { order: paid },
      select: { name: true, price: true, qty: true, order: { select: { paidAt: true, createdAt: true } } },
    }),
    db.order.count({ where: paid }),
  ]);

  const now = new Date();
  const todayKey = wibKey(now);
  const days = Array.from({ length: 7 }, (_, i) => wibKey(new Date(now.getTime() - (6 - i) * DAY)));
  const perDay: Record<string, number> = Object.fromEntries(days.map((k) => [k, 0]));
  const perMenu = new Map<string, { qty: number; revenue: number }>();
  let revenue = 0, cups = 0, todayRevenue = 0, todayCups = 0;

  for (const it of items) {
    const amount = it.price * it.qty;
    revenue += amount; cups += it.qty;
    const key = wibKey(it.order.paidAt ?? it.order.createdAt);
    if (key in perDay) perDay[key] += amount;
    if (key === todayKey) { todayRevenue += amount; todayCups += it.qty; }
    const m = perMenu.get(it.name) ?? { qty: 0, revenue: 0 };
    m.qty += it.qty; m.revenue += amount;
    perMenu.set(it.name, m);
  }

  const chart = days.map((k) => ({ label: `${k.slice(8)}/${k.slice(5, 7)}`, revenue: perDay[k] }));
  const menus = Array.from(perMenu.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty);
  const maxQty = Math.max(1, ...menus.map((m) => m.qty));

  const card = (label: string, value: string, sub?: string) => (
    <div className="rounded-3xl bg-white p-4 shadow-md shadow-chai-500/10">
      <p className="text-xs text-chai-800/60">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-chai-600">{value}</p>
      {sub && <p className="text-xs text-chai-800/60">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {card("Total pendapatan", rupiah(revenue), `${orderCount} pesanan lunas`)}
        {card("Total gelas terjual", String(cups))}
        {card("Pendapatan hari ini", rupiah(todayRevenue))}
        {card("Gelas hari ini", String(todayCups))}
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-md shadow-chai-500/10">
        <h2 className="mb-3 font-bold">Pendapatan 7 hari terakhir</h2>
        <SalesChart data={chart} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-md shadow-chai-500/10">
        <h2 className="mb-3 font-bold">Menu terjual</h2>
        {menus.length === 0 && <p className="text-sm text-chai-800/60">Belum ada penjualan.</p>}
        <ul className="space-y-4">
          {menus.map((m) => (
            <li key={m.name}>
              <div className="flex justify-between text-sm"><span className="font-semibold">{m.name}</span><span>{m.qty} gelas · {rupiah(m.revenue)}</span></div>
              <div className="mt-1 h-2 rounded-full bg-chai-100"><div className="h-2 rounded-full bg-chai-500" style={{ width: `${(m.qty / maxQty) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-center text-xs text-chai-800/50">Hanya pesanan yang sudah ditandai Lunas yang dihitung.</p>
    </div>
  );
}
