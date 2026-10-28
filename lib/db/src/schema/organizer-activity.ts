import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
export const organizerActivityTable = pgTable("boulder_organizer_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("organizer_activity_time_idx").on(table.occurredAt)]);
