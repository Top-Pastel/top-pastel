import { relations } from "drizzle-orm";
import { orders, orderItems, shipmentTracking } from "./schema";

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  tracking: many(shipmentTracking),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const shipmentTrackingRelations = relations(shipmentTracking, ({ one }) => ({
  order: one(orders, {
    fields: [shipmentTracking.orderId],
    references: [orders.id],
  }),
}));
