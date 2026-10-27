import { eq, sql } from "drizzle-orm";
import { db, scorecardsTable } from "@workspace/db";

/** Repeat-safe rename before serving requests; scores and attempt history are unchanged. */
export async function migrateSquadNames() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS boulder_organizer_invitations (
    id uuid PRIMARY KEY, email text NOT NULL, invited_by text NOT NULL,
    status text NOT NULL, expires_at timestamptz NOT NULL, accepted_by text
  )`);
  await db.update(scorecardsTable)
    .set({ squad: "CroyWall" })
    .where(eq(scorecardsTable.squad, "BethWall"));
}
