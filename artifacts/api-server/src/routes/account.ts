import { clerkClient, getAuth } from "@clerk/express";
import { and, count, desc, eq, gt, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
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
  InviteOrganizerBody,
} from "@workspace/api-zod";
import {
  db,
  scorecardsTable,
  userProfilesTable,
  organizerInvitationsTable,
} from "@workspace/db";
import { requireAdmin, requireUser } from "../middlewares/appAuth";
import { loadScorecard } from "../lib/boulder-competition";
import { initialAdminGrant } from "../lib/initial-admin";

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
      ? primaryEmail.emailAddress.toLowerCase()
      : null;
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    preferredName?.trim() ||
    "Competitor";

  return db.transaction(async (tx) => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(47123019)`);
  const [existing] = await tx
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.clerkUserId, userId))
    .limit(1);

  const admins = await tx
    .select({ clerkUserId: userProfilesTable.clerkUserId, email: userProfilesTable.email })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.role, "admin"));
  const { grant: becomesInitialAdmin, staleIds } = existing?.role === "admin"
    ? { grant: false, staleIds: [] as string[] }
    : await initialAdminGrant(email, process.env.INITIAL_ADMIN_EMAIL, admins,
        (id) => clerkClient.users.getUser(id));
  const invitationId = clerkUser.publicMetadata.organizerInvitationId;
  const [invitation] = email && typeof invitationId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)
    ? await tx.select().from(organizerInvitationsTable).where(and(
        eq(organizerInvitationsTable.id, invitationId),
        eq(organizerInvitationsTable.email, email),
        eq(organizerInvitationsTable.status, "sent"),
        gt(organizerInvitationsTable.expiresAt, new Date()),
      )).limit(1)
    : [];
  const role = existing?.role === "admin" || becomesInitialAdmin || !!invitation
    ? "admin"
    : "competitor";

  const [profile] = await tx
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
  for (const staleId of staleIds) {
    await tx.update(userProfilesTable)
      .set({ role: "competitor", updatedAt: new Date() })
      .where(eq(userProfilesTable.clerkUserId, staleId));
  }
  if (invitation) {
    await tx.update(organizerInvitationsTable)
      .set({ status: "accepted", acceptedBy: userId })
      .where(eq(organizerInvitationsTable.id, invitation.id));
  }
  return profile;
  });
}

router.post("/admin/invitations", requireAdmin, async (req, res): Promise<void> => {
  const body = InviteOrganizerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  const email = body.data.email.trim().toLowerCase();
  const id = randomUUID();
  // Clerk's account invitation is delivered by Clerk, not an unverified Resend sender.
  await db.insert(organizerInvitationsTable).values({
    id, email, invitedBy: getAuth(req).userId!, status: "sending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  try {
    await clerkClient.invitations.createInvitation({
      emailAddress: email, expiresInDays: 7, notify: true, ignoreExisting: false,
      redirectUrl: "/sign-up",
      publicMetadata: { organizerInvitationId: id },
    });
  } catch (error) {
    await db.update(organizerInvitationsTable).set({ status: "failed" })
      .where(eq(organizerInvitationsTable.id, id));
    const status = typeof error === "object" && error !== null && "status" in error ? error.status : null;
    res.status(status === 422 ? 409 : 502).json({ error: status === 422
      ? "An account or invitation may already exist for this email. For an existing account, use Make organizer below."
      : "The email provider could not send the invitation. Please try again." });
    return;
  }
  await db.update(organizerInvitationsTable).set({ status: "sent" })
    .where(eq(organizerInvitationsTable.id, id));
  res.status(201).json({ message: `Invitation sent to ${email}. It expires in 7 days.` });
});

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
          ageBracket: loaded.detail.ageBracket,
          gender: loaded.detail.gender,
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
