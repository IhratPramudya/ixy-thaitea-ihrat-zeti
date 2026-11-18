"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { rupiah } from "@/lib/format";

export default function SalesChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis width={40} tickLine={false} axisLine={false} tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))} />
          <Tooltip formatter={(v) => rupiah(Number(v))} />
          <Bar dataKey="revenue" name="Pendapatan" fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
