import { and, desc, eq } from "drizzle-orm";
import { ageBracket, eventYear } from "./age-bracket";
import { rankClimbers, summarizeStandings } from "./standings";
import {
  attemptRecordsTable,
  db,
  eventsTable,
  scorecardsTable,
  type AttemptRecord,
  type Event,
  type Scorecard,
} from "@workspace/db";

export function toEvent(event: Event) {
  return {
    id: event.id,
    name: event.name,
    eventDate: event.eventDate,
    status: event.status,
    boulderCount: 20,
    maxAttempts: 4,
    pointsByAttempts: event.pointsByAttempts,
    resultsReleased: event.resultsReleased,
    createdAt: event.createdAt,
  };
}

function pointsFor(event: Event, attempts: number, completed: boolean): number {
  return completed && attempts >= 1 && attempts <= 4
    ? (event.pointsByAttempts[attempts - 1] ?? 0)
    : 0;
}

export function buildBoulderStates(event: Event, records: AttemptRecord[]) {
  const latestByBoulder = new Map<number, AttemptRecord>();
  for (const record of records) {
    if (!latestByBoulder.has(record.boulderNumber)) {
      latestByBoulder.set(record.boulderNumber, record);
    }
  }

  return Array.from({ length: 20 }, (_, index) => {
    const boulderNumber = index + 1;
    const record = latestByBoulder.get(boulderNumber);
    const attempts = record?.attempts ?? 0;
    const completed = record?.completed ?? false;
    return {
      boulderNumber,
      attempts,
      completed,
      points: pointsFor(event, attempts, completed),
      currentRecordId: record?.id ?? null,
      updatedAt: record?.createdAt ?? null,
    };
  });
}

export function buildScorecardDetail(
  scorecard: Scorecard,
  event: Event,
  records: AttemptRecord[],
) {
  const boulders = buildBoulderStates(event, records);
  return {
    id: scorecard.id,
    eventId: event.id,
    eventName: event.name,
    eventStatus: event.status,
    climberName: scorecard.climberName,
    birthYear: scorecard.birthYear,
    gender: scorecard.gender,
    ageBracket: ageBracket(scorecard.birthYear, eventYear(event)),
    squad: scorecard.squad,
    isClimber: scorecard.isClimber,
    loggerName: scorecard.loggerName,
    email: scorecard.email,
    createdAt: scorecard.createdAt,
    totalPoints: boulders.reduce((total, boulder) => total + boulder.points, 0),
    completedCount: boulders.filter((boulder) => boulder.completed).length,
    boulders,
  };
}

export function buildScorecardSummary(
  detail: ReturnType<typeof buildScorecardDetail>,
) {
  return {
    id: detail.id,
    climberName: detail.climberName,
    ageBracket: detail.ageBracket,
    gender: detail.gender,
    squad: detail.squad,
    loggerName: detail.loggerName,
    createdAt: detail.createdAt,
    totalPoints: detail.totalPoints,
    completedCount: detail.completedCount,
    attemptCount: detail.boulders.reduce(
      (total, boulder) => total + boulder.attempts,
      0,
    ),
  };
}

export async function loadScorecard(scorecardId: string) {
  const [scorecard] = await db
    .select()
    .from(scorecardsTable)
    .where(eq(scorecardsTable.id, scorecardId))
    .limit(1);
  if (!scorecard) return null;

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, scorecard.eventId))
    .limit(1);
  if (!event) return null;

  const records = await db
    .select()
    .from(attemptRecordsTable)
    .where(eq(attemptRecordsTable.scorecardId, scorecardId))
    .orderBy(desc(attemptRecordsTable.revision));
  return {
    scorecard,
    event,
    records,
    detail: buildScorecardDetail(scorecard, event, records),
  };
}

export async function listScorecardSummaries(eventId: string) {
  const scorecards = await db
    .select()
    .from(scorecardsTable)
    .where(eq(scorecardsTable.eventId, eventId))
    .orderBy(desc(scorecardsTable.createdAt));
  const summaries = await Promise.all(
    scorecards.map(async (scorecard) => {
      const loaded = await loadScorecard(scorecard.id);
      return loaded ? buildScorecardSummary(loaded.detail) : null;
    }),
  );
  return summaries.filter((summary) => summary !== null);
}

export async function eventResults(event: Event) {
  const scorecards = await db
    .select()
    .from(scorecardsTable)
    .where(eq(scorecardsTable.eventId, event.id));
  const rows = await Promise.all(
    scorecards.map(async (scorecard) => {
      const records = await db
        .select()
        .from(attemptRecordsTable)
        .where(eq(attemptRecordsTable.scorecardId, scorecard.id))
        .orderBy(desc(attemptRecordsTable.revision));
      const boulders = buildBoulderStates(event, records);
      return {
        climberName: scorecard.climberName,
        ageBracket: ageBracket(scorecard.birthYear, eventYear(event)),
        gender: scorecard.gender,
        squad: scorecard.squad,
        totalPoints: boulders.reduce((total, boulder) => total + boulder.points, 0),
        completedCount: boulders.filter((boulder) => boulder.completed).length,
        attemptCount: boulders.reduce(
          (total, boulder) => total + boulder.attempts,
          0,
        ),
      };
    }),
  );

  return {
    event: toEvent(event),
    results: rankClimbers(rows),
    ...summarizeStandings(rows),
  };
}

export async function getEvent(eventId: string) {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, eventId))
    .limit(1);
  return event ?? null;
}

export async function getLatestRecord(
  scorecardId: string,
  boulderNumber: number,
) {
  const [record] = await db
    .select()
    .from(attemptRecordsTable)
    .where(
      and(
        eq(attemptRecordsTable.scorecardId, scorecardId),
        eq(attemptRecordsTable.boulderNumber, boulderNumber),
      ),
    )
    .orderBy(desc(attemptRecordsTable.revision))
    .limit(1);
  return record ?? null;
}
