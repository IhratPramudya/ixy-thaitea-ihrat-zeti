import { db } from "@/lib/db";

export function listOrders() {
  return db.order.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { items: true } });
}
