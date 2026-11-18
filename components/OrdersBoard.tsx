"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import { rupiah} from "@/lib/format";

type Item = {id: string, name: string, price: number, qty: number};
export type AdminOrder = {
    id: string; code: string; customerName: string; phone: string | null; note: string | null;
    total:  number; paymentStatus: string; prepStatus: string; createdAt: string; items: Item[];
}
type Action = "PAY" | "CANCEL" | "START" | "READY" | "DONE";

const TABS = [
    { 
        key: "aktif", 
        label: "Aktif" 
    },
    {
        key: "bayar",
        label: "Cek bayar"
    },
    {
        key: "antri",
        label: "Antrian"
    },
    {
        key: "proses",
        label: "Dibuat"
    },
    {
        key: "siap",
        label: "Siap"
    },
    {
        key: "selesai",
        label: "Selesai"
    },
    {
        key: "semua",
        label: "Semua"
    }
] as const;

type TabKey = (typeof TABS)[number]["key"];

const MATCH: Record<TabKey, (order: AdminOrder) => boolean> = {
    aktif: (order) => order.prepStatus !== "SELESAI" && order.paymentStatus !== "BATAL",
    bayar: (order) => order.paymentStatus === "MENUNGGU" && order.prepStatus !== "SELESAI",
    antri: (order) => order.paymentStatus === "LUNAS" && order.prepStatus !== "BARU",
    proses: (order) => order.prepStatus === "DIPROSES",
    siap: (order) => order.prepStatus === "SIAP",
    selesai: (order) => order.prepStatus === "SELESAI",
    semua: () => true,
}


function badge(order: AdminOrder) {
  if (order.prepStatus === "BATAL") return { t: "Dibatalkan", c: "bg-gray-100 text-gray-600" };
  if (order.paymentStatus !== "LUNAS") return { t: "Menunggu bayar", c: "bg-yellow-100 text-yellow-800" };
  if (order.prepStatus === "BARU") return { t: "Lunas · antri", c: "bg-blue-100 text-blue-800" };
  if (order.prepStatus === "DIPROSES") return { t: "Sedang dibuat", c: "bg-orange-100 text-orange-800" };
  if (order.prepStatus === "SIAP") return { t: "Siap diambil", c: "bg-green-100 text-green-800" };
  return { t: "Selesai", c: "bg-gray-100 text-gray-600" };
}


function buttons(order: AdminOrder): { a: Action; label: string; primary: boolean }[] {
  if (order.prepStatus === "BATAL" || order.prepStatus === "SELESAI") return [];
  if (order.paymentStatus !== "LUNAS") return [{ a: "PAY", label: "✅ Tandai Lunas", primary: true }, { a: "CANCEL", label: "Batalkan", primary: false }];
  if (order.prepStatus === "BARU") return [{ a: "START", label: "🧋 Mulai Buat", primary: true }];
  if (order.prepStatus === "DIPROSES") return [{ a: "READY", label: "✅ Sudah Jadi · Siap Diambil", primary: true }];
  return [{ a: "DONE", label: "🤝 Sudah Diambil", primary: true }];
}


const fmtTime = (s: string) =>
  new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });


export default function OrdersBoard({ initial }: { initial: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initial);
  const [tab, setTab] = useState<TabKey>("aktif");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/orders", { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/login"; return; }
      if (r.ok) setOrders(await r.json());
    } catch { /* coba lagi pada polling berikutnya */ }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, orders.filter(MATCH[t.key]).length])) as Record<TabKey, number>, [orders]);
  const list = useMemo(() => {
    const l = orders.filter(MATCH[tab]);
    const fifo = tab === "aktif" || tab === "antri" || tab === "proses";
    return [...l].sort((a, b) => (fifo ? 1 : -1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, [orders, tab]);

  async function act(o: AdminOrder, action: Action) {
    if (action === "PAY" && !confirm(`Pastikan uang ${rupiah(o.total)} dari ${o.customerName} sudah masuk. Tandai LUNAS?`)) return;
    if (action === "CANCEL" && !confirm(`Batalkan pesanan ${o.code}?`)) return;
    setBusy(o.id); setErr("");
    try {
      const r = await fetch(`/api/admin/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Gagal memperbarui."); await refresh(); }
      else setOrders((prev) => prev.map((x) => (x.id === d.id ? d : x)));
    } catch { setErr("Koneksi bermasalah, coba lagi."); }
    finally { setBusy(null); }
    
}

 return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-chai-600 text-white" : "bg-white text-chai-800"}`}>
            {t.label} <span className="opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>
      {err && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}
      {list.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-chai-800/60">Belum ada pesanan di sini.</p>}
      <div className="space-y-3">
        {list.map((o) => {
          const b = badge(o);
          return (
            <article key={o.id} className="rounded-3xl bg-white p-5 shadow-md shadow-chai-500/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-extrabold">{o.customerName}</p>
                  <p className="text-xs text-chai-800/60">{o.code} · {fmtTime(o.createdAt)}{o.phone ? ` · ${o.phone}` : ""}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${b.c}`}>{b.t}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i) => <li key={i.id} className="flex justify-between"><span><b>{i.qty}×</b> {i.name}</span><span>{rupiah(i.price * i.qty)}</span></li>)}
              </ul>
              {o.note && <p className="mt-2 rounded-xl bg-chai-50 px-3 py-2 text-sm">📝 {o.note}</p>}
              <div className="mt-3 flex justify-between border-t border-chai-100 pt-3 font-extrabold"><span>Total</span><span className="text-chai-600">{rupiah(o.total)}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {buttons(o).map((x) => (
                  <button key={x.a} disabled={busy === o.id} onClick={() => act(o, x.a)} className={`rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-50 ${x.primary ? "flex-1 bg-chai-500 text-white" : "bg-chai-100 text-chai-800"}`}>{x.label}</button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
