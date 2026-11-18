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
        lanbel: "Siap"
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
    bayar: (order) =
}