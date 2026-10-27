import { clerkClient, getAuth } from "@clerk/express";
import { count, desc, eq, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetMyAccountResponse,
  ListAdminUsersResponse,
  ListMyScorecardsResponse,
  SaveAccountProfileBody,
  SaveAccountProfileResponse,
  UpdateAccountRoleBody,
  UpdateAccountRoleParams,
  UpdateAccountRoleResponse,
} from "@workspace/api-zod";
import {
  db,
  scorecardsTable,
  userProfilesTable,
} from "@workspace/db";
import { requireAdmin, requireUser } from "../middlewares/appAuth";
import { loadScorecard } from "../lib/boulder-competition";

const router: IRouter = Router();

async function syncAccountProfile(
  userId: string,
  preferredName?: string,
) {
  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  );
  const email =
    primaryEmail?.verification?.status === "verified"
      ? primaryEmail.emailAddress
      : null;
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    preferredName?.trim() ||
    "Competitor";

  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.clerkUserId, userId))
    .limit(1);

  const [admin] = await db
    .select({ clerkUserId: userProfilesTable.clerkUserId })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.role, "admin"))
    .limit(1);
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const becomesInitialAdmin =
    !admin &&
    !!email &&
    !!initialAdminEmail &&
    email.toLowerCase() === initialAdminEmail;
  const role = existing?.role === "admin" || becomesInitialAdmin
    ? "admin"
    : "competitor";

  const [profile] = await db
    .insert(userProfilesTable)
    .values({
      clerkUserId: userId,
      email,
      displayName,
      role,
    })
    .onConflictDoUpdate({
      target: userProfilesTable.clerkUserId,
      set: {
        email,
        displayName,
        role: existing?.role === "admin" ? "admin" : role,
        updatedAt: new Date(),
      },
    })
    .returning();
  return profile;
}

router.post("/auth/profile", requireUser, async (req, res): Promise<void> => {
  const parsed = SaveAccountProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const profile = await syncAccountProfile(userId, parsed.data.displayName);
  res.json(SaveAccountProfileResponse.parse(profile));
});

router.get("/auth/me", requireUser, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const profile = await syncAccountProfile(userId);
  res.json(GetMyAccountResponse.parse(profile));
});

router.get(
  "/auth/scorecards",
  requireUser,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "Sign in required" });
      return;
    }
    const profile = await syncAccountProfile(userId);
    const ownershipConditions = [
      eq(scorecardsTable.accountUserId, userId),
    ];
    if (profile.email) {
      ownershipConditions.push(eq(scorecardsTable.email, profile.email));
    }
    const scorecards = await db
      .select()
      .from(scorecardsTable)
      .where(or(...ownershipConditions))
      .orderBy(desc(scorecardsTable.createdAt));

    const linked = await Promise.all(
      scorecards.map(async (scorecard) => {
        if (!scorecard.accountUserId) {
          await db
            .update(scorecardsTable)
            .set({ accountUserId: userId })
            .where(eq(scorecardsTable.id, scorecard.id));
        }
        const loaded = await loadScorecard(scorecard.id);
        if (!loaded) return null;
        return {
          id: loaded.detail.id,
          eventId: loaded.detail.eventId,
          eventName: loaded.detail.eventName,
          eventStatus: loaded.detail.eventStatus,
          climberName: loaded.detail.climberName,
          squad: loaded.detail.squad,
          createdAt: loaded.detail.createdAt,
          totalPoints: loaded.detail.totalPoints,
          completedCount: loaded.detail.completedCount,
        };
      }),
    );
    res.json(ListMyScorecardsResponse.parse(linked.filter(Boolean)));
  },
);

router.get(
  "/admin/users",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .orderBy(userProfilesTable.displayName);
    res.json(ListAdminUsersResponse.parse(profiles));
  },
);

router.patch(
  "/admin/users/:clerkUserId/role",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAccountRoleParams.safeParse(req.params);
    const body = UpdateAccountRoleBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: params.error?.message ?? body.error?.message,
      });
      return;
    }

    const [target] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkUserId, params.data.clerkUserId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (target.role === "admin" && body.data.role !== "admin") {
      const [allAdmins] = await db
        .select({ value: count() })
        .from(userProfilesTable)
        .where(eq(userProfilesTable.role, "admin"));
      if ((allAdmins?.value ?? 0) <= 1) {
        res.status(409).json({ error: "At least one administrator is required" });
        return;
      }
    }

    const [updated] = await db
      .update(userProfilesTable)
      .set({ role: body.data.role, updatedAt: new Date() })
      .where(eq(userProfilesTable.clerkUserId, target.clerkUserId))
      .returning();
    res.json(UpdateAccountRoleResponse.parse(updated));
  },
);

export default router;
