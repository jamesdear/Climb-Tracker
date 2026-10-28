import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, organizerActivityTable, organizerInvitationsTable, userProfilesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/appAuth";

const router = Router();
router.get("/admin/activity", requireAdmin, async (_req, res) => {
  const [organizers, invitations, actions] = await Promise.all([
    db.select({ name: userProfilesTable.displayName, email: userProfilesTable.email,
      lastSeenAt: userProfilesTable.lastSeenAt }).from(userProfilesTable)
      .where(eq(userProfilesTable.role, "admin")).orderBy(desc(userProfilesTable.lastSeenAt)),
    db.select({ id: organizerInvitationsTable.id, email: organizerInvitationsTable.email,
      status: organizerInvitationsTable.status, expiresAt: organizerInvitationsTable.expiresAt,
      acceptedAt: organizerInvitationsTable.acceptedAt }).from(organizerInvitationsTable)
      .orderBy(desc(organizerInvitationsTable.expiresAt)).limit(100),
    db.select({ id: organizerActivityTable.id,
      actor: sql<string>`coalesce(${userProfilesTable.email}, ${userProfilesTable.displayName}, 'Former organizer')`,
      action: organizerActivityTable.action, targetId: organizerActivityTable.targetId,
      occurredAt: organizerActivityTable.occurredAt }).from(organizerActivityTable)
      .leftJoin(userProfilesTable, eq(userProfilesTable.clerkUserId, organizerActivityTable.actorId))
      .orderBy(desc(organizerActivityTable.occurredAt)).limit(100),
  ]);
  const now = Date.now();
  res.setHeader("Cache-Control", "no-store");
  res.json({ organizers, actions, invitations: invitations.map(i => ({
    ...i, status: i.status === "sent" ? (i.expiresAt.getTime() <= now ? "expired" : "pending") : i.status,
  })) });
});
export default router;
