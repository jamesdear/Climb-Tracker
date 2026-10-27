import {
  boolean,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const eventsTable = pgTable("boulder_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  eventDate: date("event_date", { mode: "string" }),
  status: varchar("status", { length: 16 }).notNull().default("draft"),
  pointsByAttempts: jsonb("points_by_attempts")
    .$type<number[]>()
    .notNull()
    .default([10, 7, 4, 1]),
  resultsReleased: boolean("results_released").notNull().default(false),
  resultsReleasedAt: timestamp("results_released_at", { withTimezone: true }),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = typeof eventsTable.$inferInsert;
