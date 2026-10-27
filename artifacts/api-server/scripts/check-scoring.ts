import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, pool, scorecardsTable } from "@workspace/db";

const eventId = "d0272026-0000-4000-8000-000000000001";
const base = "http://localhost:8080/api";
let cardId: string | undefined;
async function post(path: string, data: unknown) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
try {
  const input = {
    climberName: "Temporary API verification",
    birthYear: 2013, squad: "VauxWall", isClimber: false,
    loggerName: "Test supervisor", acceptedTerms: true,
  };
  for (const birthYear of [2027, 2009]) {
    const invalid = await post(`/events/${eventId}/scorecards`, {...input, birthYear});
    assert.equal(invalid.status, 400);
  }
  const created = await post(`/events/${eventId}/scorecards`, input);
  assert.equal(created.status, 201);
  const card = await created.json();
  cardId = card.id;
  assert.equal(card.ageBracket, "U15");
  let previous: string | null = null;
  const steps = [[1,false], [2,false], [1,false], [2,true], [3,true], [4,false], [0,false]] as const;
  for (const [attempts, completed] of steps) {
    const response = await post(`/scorecards/${cardId}/boulders/1/records`, {
      attempts, completed, expectedRecordId: previous,
    });
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.record.previousRecordId, previous);
    assert.equal(result.record.actorName, "Test supervisor");
    previous = result.record.id;
    const latest = await (await fetch(`${base}/scorecards/${cardId}`)).json();
    assert.equal(latest.boulders[0].attempts, attempts);
    assert.equal(latest.boulders[0].completed, completed);
    assert.equal(latest.totalPoints, completed ? [10,7,4,1][attempts-1] : 0);
  }
  const stale = await post(`/scorecards/${cardId}/boulders/1/records`, {
    attempts: 1, completed: false, expectedRecordId: null,
  });
  assert.equal(stale.status, 409);
  const history = await (await fetch(`${base}/scorecards/${cardId}/history`)).json();
  assert.equal(history.length, steps.length);
  console.log("PASS: supervisor, U15 year-end bracket, invalid ages, +/- corrections, completion points, persisted history and stale-write rejection.");
} finally {
  if (cardId) await db.delete(scorecardsTable).where(eq(scorecardsTable.id, cardId));
  await pool.end();
}
