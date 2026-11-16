"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah } from "@/lib/format";

type P = { id: string; name: string; tagline: string; price: number; emoji: string; ingredients: string[]; benefits: string[] };

export default function Shop({ products }: { products: P[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ customerName: "", phone: "", note: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const items = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = items.reduce((s, p) => s + p.price * qty[p.id], 0);
  const count = items.reduce((s, p) => s + qty[p.id], 0);
  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(20, (q[id] ?? 0) + d)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.customerName.trim()) return setErr("Nama wajib diisi dulu ya.");
    if (!count) return setErr("Pilih minimal satu minuman.");
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: items.map((p) => ({ productId: p.id, qty: qty[p.id] })) }),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); return setErr(data.error ?? "Gagal membuat pesanan."); }
    router.push(`/order/${data.id}`);
  }

  const input = "w-full rounded-2xl border border-chai-100 bg-white px-4 py-3 outline-none focus:border-chai-500 focus:ring-2 focus:ring-chai-400/30";

  return (
    <div className="relative z-10 -mt-8 mx-auto max-w-2xl px-4">
      <section id="menu" className="space-y-4">
        {products.map((p) => (
          <article key={p.id} className="rounded-3xl bg-white p-5 shadow-lg shadow-chai-500/10">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-chai-100 to-chai-400/40 text-4xl">{p.emoji}</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-sm text-chai-800/70">{p.tagline}</p>
                <p className="mt-1 text-lg font-extrabold text-chai-600">{rupiah(p.price)}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="mt-3 text-sm font-semibold text-chai-600">
              {open === p.id ? "Tutup detail ▲" : "Bahan & manfaat ▼"}
            </button>
            {open === p.id && (
              <div className="mt-3 grid gap-3 rounded-2xl bg-chai-50 p-4 text-sm">
                <div><p className="font-semibold">Bahan-bahan</p><div className="mt-1 flex flex-wrap gap-2">{p.ingredients.map((i) => <span key={i} className="rounded-full bg-white px-3 py-1">{i}</span>)}</div></div>
                <div><p className="font-semibold">Manfaat</p><ul className="mt-1 list-inside list-disc text-chai-800/80">{p.benefits.map((b) => <li key={b}>{b}</li>)}</ul></div>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-chai-800/60">Jumlah</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => change(p.id, -1)} className="h-10 w-10 rounded-full bg-chai-100 text-xl font-bold active:scale-90">−</button>
                <span className="w-6 text-center text-lg font-bold">{qty[p.id] ?? 0}</span>
                <button type="button" onClick={() => change(p.id, 1)} className="h-10 w-10 rounded-full bg-chai-500 text-xl font-bold text-white active:scale-90">+</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-lg shadow-chai-500/10">
        <h2 className="text-lg font-bold">Data pemesan</h2>
        <input className={input} placeholder="Nama kamu *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className={input} placeholder="No. WhatsApp / divisi (opsional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <textarea className={input} rows={2} placeholder="Catatan, misal: less sugar" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        {err && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-chai-500 to-chai-600 py-4 text-lg font-bold text-white shadow-lg shadow-chai-500/30 active:scale-[.98] disabled:opacity-60">
          {loading ? "Memproses..." : `Pesan & Bayar QRIS · ${rupiah(total)}`}
        </button>
      </form>

      {count > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-10 flex items-center justify-between rounded-full bg-chai-900 px-6 py-3 text-white shadow-2xl">
          <span>🛒 {count} minuman</span><span className="font-bold">{rupiah(total)}</span>
        </div>
      )}
    </div>
  );
}
