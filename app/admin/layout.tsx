import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = { title: "Pemilik/Owner · ixz Thai Tea", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      <div className="mx-auto max-w-3xl px-4 py-5">{children}</div>
    </div>
  );
}