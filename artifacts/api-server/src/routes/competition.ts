import { ReplitConnectors } from "@replit/connectors-sdk";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateScorecardBody,
  CreateScorecardParams,
  CreateScorecardResponse,
  GetPublicEventParams,
  GetPublicEventResponse,
  GetPublicResultsParams,
  GetPublicResultsResponse,
  GetScorecardHistoryParams,
  GetScorecardHistoryResponse,
  GetScorecardParams,
  GetScorecardResponse,
  LogAttemptRecordBody,
  LogAttemptRecordParams,
  LogAttemptRecordResponse,
} from "@workspace/api-zod";
import {
  attemptRecordsTable,
  db,
  eventsTable,
  scorecardsTable,
  userProfilesTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
import {
  buildScorecardDetail,
  eventResults,
  getEvent,
  loadScorecard,
  toEvent,
} from "../lib/boulder-competition";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const TERMS_VERSION = "2026-10";

router.get("/events/open", async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.status, "open"))
    .orderBy(desc(eventsTable.eventDate));
  res.json(events.map(toEvent));
});

router.get("/events/:eventId/scorecards", async (req, res): Promise<void> => {
  const params = CreateScorecardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const event = await getEvent(params.data.eventId);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.status !== "open") {
    res.status(409).json({ error: "This event is not accepting registrations" });
    return;
  }

  const body = CreateScorecardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const registration = body.data;
  if (!registration.isClimber && !registration.loggerName?.trim()) {
    res.status(400).json({
      error: "Logger name is required when logging for another climber",
    });
    return;
  }
  if (!registration.acceptedTerms) {
    res.status(400).json({ error: "Terms and privacy acceptance is required" });
    return;
  }

  const [scorecard] = await db
    .insert(scorecardsTable)
    .values({
      eventId: event.id,
      climberName: registration.climberName.trim(),
      squad: registration.squad,
      isClimber: registration.isClimber,
      loggerName: registration.isClimber
        ? null
        : registration.loggerName?.trim() || null,
      email: registration.email?.trim().toLowerCase() || null,
      acceptedTermsAt: new Date(),
      termsVersion: TERMS_VERSION,
      accountUserId: getAuth(req).userId ?? null,
    })
    .returning();
  const detail = buildScorecardDetail(scorecard, event, []);
  res.status(201).json(CreateScorecardResponse.parse(detail));
});

router.get("/events/:eventId/results", async (req, res): Promise<void> => {
  const params = GetPublicResultsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const event = await getEvent(params.data.eventId);
  if (!event || !event.resultsReleased) {
    res.status(404).json({ error: "Results have not been released" });
    return;
  }
  res.json(GetPublicResultsResponse.parse(await eventResults(event)));
});

router.get("/events/:eventId", async (req, res): Promise<void> => {
  const params = GetPublicEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const event = await getEvent(params.data.eventId);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(GetPublicEventResponse.parse(toEvent(event)));
});

router.get("/scorecards/:scorecardId", async (req, res): Promise<void> => {
  const params = GetScorecardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const loaded = await loadScorecard(params.data.scorecardId);
  if (!loaded) {
    res.status(404).json({ error: "Scorecard not found" });
    return;
  }
  res.json(GetScorecardResponse.parse(loaded.detail));
});

router.get(
  "/scorecards/:scorecardId/history",
  async (req, res): Promise<void> => {
    const params = GetScorecardHistoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [scorecard] = await db
      .select({ id: scorecardsTable.id })
      .from(scorecardsTable)
      .where(eq(scorecardsTable.id, params.data.scorecardId))
      .limit(1);
    if (!scorecard) {
      res.status(404).json({ error: "Scorecard not found" });
      return;
    }
    const history = await db
      .select()
      .from(attemptRecordsTable)
      .where(eq(attemptRecordsTable.scorecardId, scorecard.id))
      .orderBy(desc(attemptRecordsTable.revision));
    res.json(GetScorecardHistoryResponse.parse(history));
  },
);

class ScorecardChangedError extends Error {}
class EventClosedError extends Error {}
class ScorecardMissingError extends Error {}

async function sendReceipt(
  scorecard: {
    id: string;
    email: string | null;
    climberName: string;
  },
  eventName: string,
  record: {
    boulderNumber: number;
    attempts: number;
    completed: boolean;
  },
  points: number,
): Promise<"not_requested" | "sent" | "not_configured" | "failed"> {
  if (!scorecard.email) return "not_requested";
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) return "not_configured";
  try {
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: scorecard.email,
        subject: `${eventName}: scorecard update`,
        text: [
          `Scorecard update for ${scorecard.climberName}`,
          eventName,
          `Boulder ${record.boulderNumber}`,
          `Attempts recorded: ${record.attempts}`,
          `Completed: ${record.completed ? "Yes" : "No"}`,
          `Points for this boulder: ${points}`,
        ].join("\n"),
        tags: [{ name: "category", value: "scorecard-receipt" }],
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend returned HTTP ${response.status}`);
    }
    return "sent";
  } catch (error) {
    logger.warn(
      { err: error, scorecardId: scorecard.id },
      "Scorecard receipt email failed",
    );
    return "failed";
  }
}

router.post(
  "/scorecards/:scorecardId/boulders/:boulderNumber/records",
  async (req, res): Promise<void> => {
    const params = LogAttemptRecordParams.safeParse(req.params);
    const body = LogAttemptRecordBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: params.error?.message ?? body.error?.message,
      });
      return;
    }
    if (body.data.completed && body.data.attempts === 0) {
      res.status(400).json({ error: "A completed boulder needs an attempt count" });
      return;
    }

    const loaded = await loadScorecard(params.data.scorecardId);
    if (!loaded) {
      res.status(404).json({ error: "Scorecard not found" });
      return;
    }
    const userId = getAuth(req).userId ?? null;
    const [profile] = userId
      ? await db
          .select()
          .from(userProfilesTable)
          .where(eq(userProfilesTable.clerkUserId, userId))
          .limit(1)
      : [];
    const isAdmin = profile?.role === "admin";

    try {
      const [record, event] = await db.transaction(async (tx) => {
        const [lockedScorecard] = await tx
          .select()
          .from(scorecardsTable)
          .where(eq(scorecardsTable.id, loaded.scorecard.id))
          .for("update")
          .limit(1);
        if (!lockedScorecard) throw new ScorecardMissingError();
        const [lockedEvent] = await tx
          .select()
          .from(eventsTable)
          .where(eq(eventsTable.id, lockedScorecard.eventId))
          .for("update")
          .limit(1);
        if (!lockedEvent) throw new ScorecardMissingError();
        if (
          lockedEvent.resultsReleased ||
          (lockedEvent.status !== "open" && !isAdmin)
        ) {
          throw new EventClosedError();
        }

        const [latest] = await tx
          .select()
          .from(attemptRecordsTable)
          .where(
            and(
              eq(attemptRecordsTable.scorecardId, lockedScorecard.id),
              eq(attemptRecordsTable.boulderNumber, params.data.boulderNumber),
            ),
          )
          .orderBy(desc(attemptRecordsTable.revision))
          .limit(1);
        if ((latest?.id ?? null) !== body.data.expectedRecordId) {
          throw new ScorecardChangedError();
        }
        const actorName =
          profile?.displayName ||
          (lockedScorecard.isClimber
            ? lockedScorecard.climberName
            : lockedScorecard.loggerName || "Scorecard logger");
        const [inserted] = await tx
          .insert(attemptRecordsTable)
          .values({
            scorecardId: lockedScorecard.id,
            boulderNumber: params.data.boulderNumber,
            attempts: body.data.attempts,
            completed: body.data.completed,
            actorName,
            actorUserId: userId,
            actorRole: isAdmin ? "admin" : "competitor",
            previousRecordId: latest?.id ?? null,
          })
          .returning();
        return [inserted, lockedEvent] as const;
      });

      const points =
        record.completed && record.attempts > 0
          ? (event.pointsByAttempts[record.attempts - 1] ?? 0)
          : 0;
      const emailStatus = await sendReceipt(
        {
          id: loaded.scorecard.id,
          email: loaded.scorecard.email,
          climberName: loaded.scorecard.climberName,
        },
        event.name,
        record,
        points,
      );
      res.status(201).json(
        LogAttemptRecordResponse.parse({ record, emailStatus }),
      );
    } catch (error) {
      if (error instanceof ScorecardChangedError) {
        res.status(409).json({
          error: "This boulder was updated elsewhere. Refresh and try again.",
        });
        return;
      }
      if (error instanceof EventClosedError) {
        res.status(403).json({
          error:
            "This event is closed or its results are final. Ask an administrator for help.",
        });
        return;
      }
      if (error instanceof ScorecardMissingError) {
        res.status(404).json({ error: "Scorecard or event not found" });
        return;
      }
      throw error;
    }
  },
);

export default router;
