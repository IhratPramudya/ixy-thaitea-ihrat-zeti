import type { Metadata } from "next";
import MyOrders from "@/components/MyOrders";

export const metadata: Metadata = { title: "Pesanan Saya · ixy Thai Tea" };

export default function PesananPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <a href="/" className="text-sm font-semibold text-chai-600">← Kembali ke menu</a>
      <h1 className="mb-4 mt-3 text-2xl font-extrabold">Pesanan Saya</h1>
      <MyOrders />
    </main>
  );
}
