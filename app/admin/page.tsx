import OrdersBoard from "@/components/OrdersBoard";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const orders = await listOrders();
    return <OrdersBoard initial={JSON.parse(JSON.stringify(orders))} />;
}