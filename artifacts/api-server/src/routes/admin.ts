import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateEventBody,
  CreateEventResponse,
  GetAdminScorecardParams,
  GetAdminScorecardResponse,
  GetEventMonitorParams,
  GetEventMonitorResponse,
  ListAdminEventsResponse,
  ListEventScorecardsParams,
  ListEventScorecardsResponse,
  ReleaseEventResultsParams,
  ReleaseEventResultsResponse,
  UpdateEventBody,
  UpdateEventParams,
  UpdateEventResponse,
  UpdateEventStatusBody,
  UpdateEventStatusParams,
  UpdateEventStatusResponse,
} from "@workspace/api-zod";
import {
  attemptRecordsTable,
  db,
  eventsTable,
  scorecardsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/appAuth";
import { squadStandings } from "../lib/standings";
import {
  buildScorecardDetail,
  getEvent,
  listScorecardSummaries,
  loadScorecard,
  toEvent,
} from "../lib/boulder-competition";

const router: IRouter = Router();

function toCalendarDate(value: Date | string | null | undefined) {
  if (value == null) return value;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

router.get(
  "/admin/events",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const events = await db
      .select()
      .from(eventsTable)
      .orderBy(desc(eventsTable.createdAt));
    res.json(ListAdminEventsResponse.parse(events.map(toEvent)));
  },
);

router.post(
  "/admin/events",
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = CreateEventBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [event] = await db
      .insert(eventsTable)
      .values({
        name: body.data.name.trim(),
        eventDate: toCalendarDate(body.data.eventDate) ?? null,
        pointsByAttempts: body.data.pointsByAttempts,
      })
      .returning();
    res.status(201).json(CreateEventResponse.parse(toEvent(event)));
  },
);

router.patch(
  "/admin/events/:eventId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateEventParams.safeParse(req.params);
    const body = UpdateEventBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: params.error?.message ?? body.error?.message,
      });
      return;
    }
    const current = await getEvent(params.data.eventId);
    if (!current) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    if (current.resultsReleased) {
      res.status(409).json({ error: "Released event details are locked" });
      return;
    }
    const changes: Partial<typeof eventsTable.$inferInsert> = {};
    if (body.data.name !== undefined) changes.name = body.data.name.trim();
    if (body.data.eventDate !== undefined) {
      changes.eventDate = toCalendarDate(body.data.eventDate);
    }
    if (body.data.pointsByAttempts !== undefined) {
      changes.pointsByAttempts = body.data.pointsByAttempts;
    }
    if (Object.keys(changes).length === 0) {
      res.status(400).json({ error: "There are no event changes to save" });
      return;
    }
    const [updated] = await db
      .update(eventsTable)
      .set(changes)
      .where(eq(eventsTable.id, params.data.eventId))
      .returning();
    res.json(UpdateEventResponse.parse(toEvent(updated)));
  },
);

router.patch(
  "/admin/events/:eventId/status",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateEventStatusParams.safeParse(req.params);
    const body = UpdateEventStatusBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: params.error?.message ?? body.error?.message,
      });
      return;
    }
    const current = await getEvent(params.data.eventId);
    if (!current) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    if (current.resultsReleased && body.data.status === "open") {
      res.status(409).json({ error: "Released results cannot be reopened" });
      return;
    }
    const [updated] = await db
      .update(eventsTable)
      .set({ status: body.data.status })
      .where(eq(eventsTable.id, params.data.eventId))
      .returning();
    res.json(UpdateEventStatusResponse.parse(toEvent(updated)));
  },
);

router.get(
  "/admin/events/:eventId/monitor",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = GetEventMonitorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const event = await getEvent(params.data.eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const scorecards = await listScorecardSummaries(event.id);
    const totalAttempts = scorecards.reduce(
      (total, scorecard) => total + scorecard.attemptCount,
      0,
    );
    res.json(
      GetEventMonitorResponse.parse({
        event: toEvent(event),
        scorecardCount: scorecards.length,
        totalAttempts,
        scorecards,
        squads: squadStandings(scorecards),
      }),
    );
  },
);

router.get(
  "/admin/events/:eventId/scorecards",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = ListEventScorecardsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const event = await getEvent(params.data.eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const scorecards = await listScorecardSummaries(event.id);
    res.json(ListEventScorecardsResponse.parse(scorecards));
  },
);

router.get(
  "/admin/scorecards/:scorecardId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = GetAdminScorecardParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const loaded = await loadScorecard(params.data.scorecardId);
    if (!loaded) {
      res.status(404).json({ error: "Scorecard not found" });
      return;
    }
    res.json(
      GetAdminScorecardResponse.parse({
        scorecard: buildScorecardDetail(
          loaded.scorecard,
          loaded.event,
          loaded.records,
        ),
        history: loaded.records,
      }),
    );
  },
);

router.post(
  "/admin/events/:eventId/release",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = ReleaseEventResultsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const current = await getEvent(params.data.eventId);
    if (!current) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    if (current.status !== "closed") {
      res.status(409).json({
        error: "Close the event before releasing final results",
      });
      return;
    }
    const [updated] = await db
      .update(eventsTable)
      .set({
        resultsReleased: true,
        resultsReleasedAt: new Date(),
      })
      .where(eq(eventsTable.id, params.data.eventId))
      .returning();
    res.json(ReleaseEventResultsResponse.parse(toEvent(updated)));
  },
);

export default router;
