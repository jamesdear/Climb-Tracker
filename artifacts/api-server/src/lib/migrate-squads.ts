import { eq } from "drizzle-orm";
import { db, scorecardsTable } from "@workspace/db";

/** Repeat-safe rename before serving requests; scores and attempt history are unchanged. */
export async function migrateSquadNames() {
  await db.update(scorecardsTable)
    .set({ squad: "CroyWall" })
    .where(eq(scorecardsTable.squad, "BethWall"));
}
