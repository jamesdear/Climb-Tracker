import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const organizerInvitationsTable = pgTable("boulder_organizer_invitations", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  invitedBy: text("invited_by").notNull(),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedBy: text("accepted_by"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
