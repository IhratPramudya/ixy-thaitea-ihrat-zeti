import { db } from "@/lib/db";
import Shop from "@/components/Shop";
export const dynamic = "force-dynamic";
export default async function Home() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: { price: "asc" } });
  return (
    <main>
      <header className="relative overflow-hidden bg-gradient-to-br from-chai-500 via-chai-600 to-chai-800 px-5 pb-16 pt-12 text-white">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm font-medium text-chai-100">Open order untuk teman kantor 🧡</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">ixz<br />Thai Tea</h1>
        <p className="mt-3 max-w-xs text-chai-100">Segar, manis, wangi. Isi form, pilih minuman, bayar pakai QRIS. Selesai.</p>
        <a href="#menu" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-chai-600 shadow-lg active:scale-95">Lihat Menu ↓</a>
      </header>
      <Shop products={products} />
      <footer className="px-5 pb-28 pt-8 text-center text-sm text-chai-800/60">© ixy Thai Tea · dibuat dengan ❤️ dan es batu</footer>
    </main>
  );
}
