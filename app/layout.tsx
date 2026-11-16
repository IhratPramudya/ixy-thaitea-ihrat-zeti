import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = {
  title: "ixy Thai Tea — Pesan Langsung, Bayar QRIS",
  description: "Thai tea segar untuk teman kantor. Pilih minuman, isi form, bayar via QRIS.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ea580c" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body>{children}</body></html>);
}
