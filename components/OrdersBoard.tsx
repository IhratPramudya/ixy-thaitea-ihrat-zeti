"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import { rupiah} from "@/lib/format";

type Item = {id: string, name: string, price: number, qty: number};
export type AdminOrder = {
    id: string; code: string; customerName: string; phone: string | null; note: string | null;
    total:  number; paymentStatus: string; prepStatus: string; createdAt: string; items: Item[];
}
type Action = "PAY" | "CANCEL" | "START" | "READY" | "DONE";

