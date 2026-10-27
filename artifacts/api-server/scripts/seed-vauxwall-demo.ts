import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, eventsTable, scorecardsTable, attemptRecordsTable } from "@workspace/db";

// Explicit, repeat-safe demo seed. Never updates or deletes existing events.
const eventId = "d0272026-0000-4000-8000-000000000001";
try {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    if (existing) {
      const demoCards = await tx.select().from(scorecardsTable).where(eq(scorecardsTable.eventId, eventId));
      for (const card of demoCards) {
        if (card.termsVersion !== "demo-fictional" || card.gender !== null) continue;
        const match = /^Demo Climber (\d{2})$/.exec(card.climberName);
        if (!match) continue;
        const index = Number(match[1]) - 1;
        await tx.update(scorecardsTable)
          .set({ gender: Math.floor(index / 6) % 2 === 0 ? "O" : "W+" })
          .where(eq(scorecardsTable.id, card.id));
      }
      console.log("Demo exists; filled missing fictional gender categories only. Scores and event status unchanged.");
      return;
    }
    await tx.insert(eventsTable).values({
      id: eventId,
      name: "VauxWall · 27 October — Demo",
      eventDate: "2026-10-27",
      status: "open",
      pointsByAttempts: [10, 7, 4, 1],
    });
    const squads = ["RavensWall", "HarroWall", "VauxWall", "CroyWall"];
    for (let i = 0; i < 30; i++) {
      const id = randomUUID();
      const name = `Demo Climber ${String(i + 1).padStart(2, "0")}`;
      const isClimber = i % 3 === 0;
      const supervisor = `Demo Supervisor ${String(i + 1).padStart(2, "0")}`;
      await tx.insert(scorecardsTable).values({
        id, eventId, climberName: name, birthYear: [2015, 2014, 2013, 2012, 2011, 2010][i % 6],
        gender: Math.floor(i / 6) % 2 === 0 ? "O" : "W+",
        squad: squads[i % 4], isClimber, loggerName: isClimber ? null : supervisor,
        acceptedTermsAt: new Date("2026-10-27T09:00:00Z"), termsVersion: "demo-fictional",
      });
      for (let boulder = 1; boulder <= 20; boulder++) {
        const completed = (i + boulder) % 5 !== 0;
        const total = completed ? ((i * 3 + boulder) % 4) + 1 : 4;
        let previousRecordId: string | null = null;
        for (let attempt = 1; attempt <= total; attempt++) {
          const recordId = randomUUID();
          await tx.insert(attemptRecordsTable).values({
            id: recordId, scorecardId: id, boulderNumber: boulder, attempts: attempt,
            completed: completed && attempt === total,
            actorName: isClimber ? name : supervisor, actorRole: "competitor",
            previousRecordId, createdAt: new Date(Date.UTC(2026, 9, 27, 10, boulder * 2, attempt)),
          });
          previousRecordId = recordId;
        }
      }
      if (i === 0) console.log(`Example scorecard: /scorecard/${id}`);
    }
    console.log(`Created 30 fictional competitors with 20 populated boulders each. Event: ${eventId}`);
  });
} finally {
  await pool.end();
}
