import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) notFound();
  const time = order.createdAt.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <OrderTracker
        id={order.id}
        code={order.code}
        time={time}
        customerName={order.customerName}
        total={order.total}
        items={order.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))}
        initialPayment={order.paymentStatus}
        initialPrep={order.prepStatus}
      />
    </main>
  );
}
