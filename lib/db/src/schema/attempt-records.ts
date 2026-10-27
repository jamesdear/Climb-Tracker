import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { scorecardsTable } from "./scorecards";

export const attemptRecordsTable = pgTable(
  "boulder_attempt_records",
  {
    revision: serial("revision").notNull().unique(),
    id: uuid("id").defaultRandom().primaryKey(),
    scorecardId: uuid("scorecard_id")
      .notNull()
      .references(() => scorecardsTable.id, { onDelete: "cascade" }),
    boulderNumber: integer("boulder_number").notNull(),
    attempts: integer("attempts").notNull(),
    completed: boolean("completed").notNull(),
    actorName: varchar("actor_name", { length: 120 }).notNull(),
    actorUserId: text("actor_user_id"),
    actorRole: varchar("actor_role", { length: 16 })
      .notNull()
      .default("competitor"),
    previousRecordId: uuid("previous_record_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("boulder_attempt_records_scorecard_idx").on(
      table.scorecardId,
      table.boulderNumber,
      table.createdAt,
    ),
  ],
);

export type AttemptRecord = typeof attemptRecordsTable.$inferSelect;
export type InsertAttemptRecord = typeof attemptRecordsTable.$inferInsert;
