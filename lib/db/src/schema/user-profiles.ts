import {
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("boulder_user_profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  email: varchar("email", { length: 254 }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("competitor"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;
