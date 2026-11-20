"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { rupiah } from "@/lib/format";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";

type Pay = { id: string; status: string; amount: number; method: string; createdAt: string; paidAt: string | null };
type Ord = {
  id: string; code: string; total: number; paymentStatus: string; prepStatus: string; createdAt: string; paidAt: string | null;
  items: { id: string; name: string; qty: number; price: number }[]; payments: Pay[];
};
type Tab = "aktif" | "riwayat" | "bayar";

const fmt = (s: string) =>
  new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const isActive = (o: Ord) => o.prepStatus !== "SELESAI" && o.prepStatus !== "BATAL";

function orderBadge(o: Ord) {
  if (o.prepStatus === "BATAL") return { t: "Dibatalkan", c: "bg-gray-100 text-gray-600" };
  if (o.paymentStatus !== "LUNAS") return { t: "Menunggu pembayaran", c: "bg-yellow-100 text-yellow-800" };
  if (o.prepStatus === "BARU") return { t: "Pesanan diterima", c: "bg-blue-100 text-blue-800" };
  if (o.prepStatus === "DIPROSES") return { t: "Sedang dibuat", c: "bg-orange-100 text-orange-800" };
  if (o.prepStatus === "SIAP") return { t: "Siap diambil", c: "bg-green-100 text-green-800" };
  return { t: "Selesai", c: "bg-gray-100 text-gray-600" };
}
const PAY_LABEL: Record<string, { t: string; c: string }> = {
  PENDING: { t: "Menunggu", c: "bg-yellow-100 text-yellow-800" },
  PAID: { t: "Berhasil", c: "bg-green-100 text-green-800" },
  EXPIRED: { t: "Kedaluwarsa", c: "bg-gray-100 text-gray-600" },
  FAILED: { t: "Gagal", c: "bg-red-100 text-red-700" },
};

export default function MyOrders() {
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [orders, setOrders] = useState<Ord[]>([]);
  const [tab, setTab] = useState<Tab>("aktif");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (raw: string, silent = false) => {
    const n = normalizePhone(raw);
    if (!n) { if (!silent) setErr(PHONE_HINT); return; }
    if (!silent) { setLoading(true); setErr(""); }
    try {
      const r = await fetch("/api/my-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: n }), cache: "no-store" });
      const d = await r.json();
      if (!r.ok) { if (!silent) setErr(d.error ?? "Gagal memuat pesanan."); return; }
      setOrders(d.orders);
      setPhone(n);
      try { localStorage.setItem("ixy_phone", n); } catch { /* abaikan */ }
    } catch {
      if (!silent) setErr("Koneksi bermasalah, coba lagi.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ixy_phone");
      if (saved) { setInput(saved); load(saved); }
    } catch { /* abaikan */ }
  }, [load]);

  const hasActive = orders.some(isActive);
  useEffect(() => {
    if (!phone || !hasActive) return;
    const t = setInterval(() => load(phone, true), 8000);
    return () => clearInterval(t);
  }, [phone, hasActive, load]);

  const active = useMemo(() => orders.filter(isActive), [orders]);
  const payments = useMemo(() => {
    const list: { key: string; code: string; status: string; amount: number; method: string; at: string }[] = [];
    for (const o of orders) {
      if (o.payments.length) {
        for (const p of o.payments) list.push({ key: p.id, code: o.code, status: p.status, amount: p.amount, method: p.method, at: p.paidAt ?? p.createdAt });
      } else if (o.paymentStatus === "LUNAS") {
        list.push({ key: o.id, code: o.code, status: "PAID", amount: o.total, method: "QRIS", at: o.paidAt ?? o.createdAt });
      }
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [orders]);

  const field = "w-full rounded-2xl border border-chai-100 bg-white px-4 py-3 outline-none focus:border-chai-500 focus:ring-2 focus:ring-chai-400/30";

  if (!phone) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); load(input); }} className="space-y-3 rounded-3xl bg-white p-5 shadow-lg shadow-chai-500/10">
        <p className="text-sm text-chai-800/70">Masukkan nomor WhatsApp yang kamu pakai saat memesan.</p>
        <input className={field} type="tel" inputMode="tel" autoComplete="tel" placeholder="08123456789" value={input} onChange={(e) => setInput(e.target.value)} />
        {err && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-chai-500 to-chai-600 py-3 font-bold text-white disabled:opacity-60">{loading ? "Memuat..." : "Lihat pesanan"}</button>
      </form>
    );
  }

  const tabs: { k: Tab; l: string; n: number }[] = [
    { k: "aktif", l: "Pesanan aktif", n: active.length },
    { k: "riwayat", l: "Riwayat belanja", n: orders.length },
    { k: "bayar", l: "Riwayat bayar", n: payments.length },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-chai-800/70">Nomor: <b>+{phone}</b></span>
        <button onClick={() => { setPhone(null); setOrders([]); try { localStorage.removeItem("ixy_phone"); } catch { /* abaikan */ } }} className="font-semibold text-chai-600">Ganti nomor</button>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.k ? "bg-chai-600 text-white" : "bg-white text-chai-800"}`}>
            {t.l} <span className="opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      {tab !== "bayar" && (
        <div className="space-y-3">
          {(tab === "aktif" ? active : orders).length === 0 && (
            <p className="rounded-3xl bg-white p-8 text-center text-chai-800/60">{tab === "aktif" ? "Tidak ada pesanan aktif." : "Belum ada riwayat belanja."}</p>
          )}
          {(tab === "aktif" ? active : orders).map((o) => {
            const b = orderBadge(o);
            const unpaid = o.paymentStatus !== "LUNAS" && o.prepStatus !== "BATAL";
            return (
              <article key={o.id} className="rounded-3xl bg-white p-5 shadow-md shadow-chai-500/10">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-extrabold">{o.code}</p><p className="text-xs text-chai-800/60">{fmt(o.createdAt)}</p></div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${b.c}`}>{b.t}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((i) => <li key={i.id} className="flex justify-between"><span><b>{i.qty}×</b> {i.name}</span><span>{rupiah(i.price * i.qty)}</span></li>)}
                </ul>
                <div className="mt-3 flex justify-between border-t border-chai-100 pt-3 font-extrabold"><span>Total</span><span className="text-chai-600">{rupiah(o.total)}</span></div>
                <a href={`/order/${o.id}`} className={`mt-3 block rounded-2xl py-3 text-center text-sm font-bold ${unpaid ? "bg-chai-500 text-white" : "bg-chai-100 text-chai-800"}`}>{unpaid ? "Bayar sekarang" : "Lihat detail & status"}</a>
              </article>
            );
          })}
        </div>
      )}

      {tab === "bayar" && (
        <div className="space-y-3">
          {payments.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-chai-800/60">Belum ada riwayat pembayaran.</p>}
          {payments.map((p) => {
            const s = PAY_LABEL[p.status] ?? PAY_LABEL.FAILED;
            return (
              <article key={p.key} className="flex items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-md shadow-chai-500/10">
                <div><p className="font-bold">{p.code} · {p.method}</p><p className="text-xs text-chai-800/60">{fmt(p.at)}</p></div>
                <div className="text-right"><p className="font-extrabold text-chai-600">{rupiah(p.amount)}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${s.c}`}>{s.t}</span></div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
