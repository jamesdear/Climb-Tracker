import {
  boolean,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { eventsTable } from "./events";

export const scorecardsTable = pgTable(
  "boulder_scorecards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    climberName: varchar("climber_name", { length: 120 }).notNull(),
    birthYear: integer("birth_year"),
    squad: varchar("squad", { length: 32 }).notNull(),
    isClimber: boolean("is_climber").notNull(),
    loggerName: varchar("logger_name", { length: 120 }),
    email: varchar("email", { length: 254 }),
    acceptedTermsAt: timestamp("accepted_terms_at", {
      withTimezone: true,
    }).notNull(),
    termsVersion: varchar("terms_version", { length: 32 }).notNull(),
    accountUserId: text("account_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("boulder_scorecards_event_idx").on(table.eventId)],
);

export type Scorecard = typeof scorecardsTable.$inferSelect;
export type InsertScorecard = typeof scorecardsTable.$inferInsert;
