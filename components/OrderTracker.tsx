"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

type Item = { id: string; name: string; price: number; qty: number };
type Props = {
  id: string; code: string; time: string; customerName: string; total: number;
  items: Item[]; initialPayment: string; initialPrep: string;
};

const STEPS = [
  { key: "BARU", icon: "📝", label: "Pesanan diterima" },
  { key: "DIPROSES", icon: "🧋", label: "Sedang dibuat" },
  { key: "SIAP", icon: "✅", label: "Siap diambil" },
];
const RANK: Record<string, number> = { BARU: 0, DIPROSES: 1, SIAP: 2, SELESAI: 3 };

export default function OrderTracker(p: Props) {
  const [pay, setPay] = useState(p.initialPayment);
  const [prep, setPrep] = useState(p.initialPrep);
  const [qrisOk, setQrisOk] = useState(true);

  useEffect(() => {
    if (prep === "SELESAI" || prep === "BATAL") return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/orders/${p.id}/status`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!stop) { setPay(d.paymentStatus); setPrep(d.prepStatus); }
      } catch { /* abaikan, coba lagi 5 detik berikutnya */ }
    };
    const t = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [p.id, prep]);

  const paid = pay === "LUNAS";
  const rank = RANK[prep] ?? 0;

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-lg shadow-chai-500/10">
      {prep === "BATAL" ? (
        <>
          <p className="text-5xl">😔</p>
          <h1 className="mt-2 text-2xl font-extrabold">Pesanan dibatalkan</h1>
          <p className="mt-1 text-sm text-chai-800/60">Hubungi penjual jika ini keliru.</p>
        </>
      ) : paid ? (
        <>
          <p className="text-5xl">{prep === "SIAP" ? "🥤" : prep === "SELESAI" ? "💛" : "🎉"}</p>
          <h1 className="mt-2 text-2xl font-extrabold">
            {prep === "SIAP" ? `Pesananmu siap diambil, ${p.customerName}!` : prep === "SELESAI" ? "Terima kasih!" : "Pembayaran sukses!"}
          </h1>
          <p className="mt-1 text-sm text-chai-800/60">Pantau status pesananmu di halaman ini.</p>
        </>
      ) : (
        <>
          <p className="text-5xl">🧾</p>
          <h1 className="mt-2 text-2xl font-extrabold">Pesanan diterima, {p.customerName}!</h1>
          <p className="mt-1 text-sm text-chai-800/60">Selesaikan pembayaran lewat QRIS di bawah.</p>
        </>
      )}
      <p className="mt-2 text-sm text-chai-800/60">Kode: <b>{p.code}</b> · {p.time}</p>

      <ul className="mt-5 space-y-1 text-left">
        {p.items.map((i) => (
          <li key={i.id} className="flex justify-between"><span>{i.qty}× {i.name}</span><span>{rupiah(i.price * i.qty)}</span></li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-chai-100 pt-3 text-lg font-extrabold">
        <span>Total</span><span className="text-chai-600">{rupiah(p.total)}</span>
      </div>

      {prep !== "BATAL" && !paid && (
        <div className="mt-6 rounded-2xl bg-chai-50 p-4">
          <p className="font-semibold">Scan QRIS untuk membayar</p>
          {qrisOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/qris.png" alt="QRIS ixy Thai Tea" onError={() => setQrisOk(false)} className="mx-auto mt-3 w-64 max-w-full rounded-xl bg-white p-2" />
          ) : (
            <p className="mt-3 rounded-xl bg-white p-4 text-sm text-red-600">QRIS belum tersedia. Hubungi penjual untuk pembayaran.</p>
          )}
          {qrisOk && <a href="/qris.png" download="qris-ixy-thai-tea.png" className="mt-2 inline-block text-sm font-semibold text-chai-600">⬇ Simpan gambar QRIS</a>}
          <p className="mt-3 text-sm text-chai-800/70">Bayar tepat <b>{rupiah(p.total)}</b>. Halaman ini otomatis berubah setelah penjual mengonfirmasi pembayaranmu.</p>
          <p className="mt-2 inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-800">⏳ Menunggu pembayaran</p>
        </div>
      )}

      {paid && prep !== "BATAL" && (
        <ol className="mt-6 space-y-3 text-left">
          {STEPS.map((s, idx) => {
            const done = rank >= idx;
            const current = rank === idx;
            return (
              <li key={s.key} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${current ? "bg-chai-500 text-white shadow-md" : done ? "bg-green-50 text-green-800" : "bg-chai-50 text-chai-800/40"}`}>
                <span className="text-2xl">{done && !current ? "✔️" : s.icon}</span>
                <span className="font-semibold">{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <a href="/" className="mt-6 block font-semibold text-chai-600">← Pesan lagi</a>
    </div>
  );
}
