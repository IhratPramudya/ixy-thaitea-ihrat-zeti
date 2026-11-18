"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminNav() { 
    const path = usePathname();
    const tab = (href: string, label: string) => (
            <Link href={href} className={`rounded-full px-4 py-2 text-sm font-semibold ${path === href ? "bg-white text-chai-600" : "text-white/90"}`}>{label}</Link>
    );

    return (
        <nav className="sticky top-0 z-20 flex items-center gap-2 bg-gradient-to-r from-chai-500 to-chai-600 px-4 py-3 shadow-md">
            <span className="mr-auto font-extrabold text-white">ixy Admin</span>
            {tab("/admin", "Pesanan")}
            {tab("/admin/sales", "Penjualan")}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full px-3 py-2 text-sm text-white/80">Keluar</button>
        </nav>
    )
}