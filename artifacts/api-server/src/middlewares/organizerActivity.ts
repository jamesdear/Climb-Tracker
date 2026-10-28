import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, organizerActivityTable, userProfilesTable } from "@workspace/db";

import { describeOrganizerAction } from "../lib/organizer-actions";

export const trackOrganizerActivity: RequestHandler = async (req, res, next) => {
  const action = describeOrganizerAction(req.method, req.path);
  const userId = getAuth(req).userId;
  if (!userId) return next();
  const [profile] = await db.select({ role: userProfilesTable.role }).from(userProfilesTable)
    .where(eq(userProfilesTable.clerkUserId, userId)).limit(1);
  if (profile?.role !== "admin") return next();
  const targetId = req.path.split("/").find(part =>
    /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(part)) ?? null;
  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    void db.transaction(async tx => {
      await tx.update(userProfilesTable).set({ lastSeenAt: new Date() })
        .where(eq(userProfilesTable.clerkUserId, userId));
      if (action && res.statusCode < 300) {
        await tx.insert(organizerActivityTable).values({ actorId: userId, action, targetId });
      }
    }).catch(() => console.error("Failed to record organizer activity"));
  });
  next();
};
