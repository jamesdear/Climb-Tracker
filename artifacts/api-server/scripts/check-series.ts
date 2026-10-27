import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db, pool, eventsTable, scorecardsTable, attemptRecordsTable } from "@workspace/db";

const ids = [randomUUID(), randomUUID()];
const base = "http://localhost:8080/api";
try {
  await db.insert(eventsTable).values(ids.map((id, i) => ({
    id, name: `Temporary series verification ${i}`, eventDate: "2026-10-27",
    status: i === 0 ? "closed" : "open", resultsReleased: i === 0, pointsByAttempts: [10,7,4,1],
  })));
  const fixtures = [
    {name:"A", squad:"RavensWall", birthYear:2014, gender:"O", attempts:1},
    {name:"B", squad:"RavensWall", birthYear:2014, gender:"O", attempts:0},
    {name:"C", squad:"HarroWall", birthYear:2013, gender:"W+", attempts:2},
    {name:"D", squad:"CroyWall", birthYear:2011, gender:null, attempts:3},
  ];
  let firstCard = "", firstRecord = "";
  for (const [index, f] of fixtures.entries()) {
    const id = randomUUID(), recordId = randomUUID();
    await db.insert(scorecardsTable).values({
      id, eventId:ids[0], climberName:f.name, squad:f.squad, birthYear:f.birthYear, gender:f.gender,
      isClimber:true, acceptedTermsAt:new Date(), termsVersion:"temporary-test",
    });
    if (f.attempts) await db.insert(attemptRecordsTable).values({
      id:recordId, scorecardId:id, boulderNumber:1, attempts:f.attempts, completed:true, actorName:f.name,
    });
    if (!index) { firstCard = id; firstRecord = recordId; }
  }
  const hiddenResponse = await fetch(`${base}/events/${ids[1]}/results`);
  assert.equal(hiddenResponse.status, 404);
  let results = await (await fetch(`${base}/events/${ids[0]}/results`)).json();
  assert.equal(results.squads.find((s:any) => s.squad==="RavensWall").averageScore, 5);
  assert.equal(results.podiums.find((p:any) => p.ageBracket==="U15"&&p.gender==="W+").places[0].climberName, "C");
  assert.equal(results.uncategorizedCount, 1);
  assert.equal(results.results.some((r:any) => "birthYear" in r || "email" in r || "id" in r), false);
  const series = await (await fetch(`${base}/series`)).json();
  const hidden = series.events.find((e:any) => e.event.id===ids[1]);
  assert.deepEqual(hidden.squads, []);
  assert.deepEqual(hidden.podiums, []);
  assert.equal(series.events.find((e:any) => e.event.id===ids[0]).podiums.length, 6);
  for (const gender of ["invalid", "O", "W+"]) {
    const response = await fetch(`${base}/events/${ids[1]}/scorecards`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({climberName:"Temporary gender test",birthYear:2014,gender,squad:"VauxWall",isClimber:true,acceptedTerms:true}),
    });
    assert.equal(response.status, gender==="invalid" ? 400 : 201);
    if (response.status===201) assert.equal((await response.json()).gender, gender);
  }
  // An attributed correction must change published averages and podiums.
  await db.insert(attemptRecordsTable).values({
    scorecardId:firstCard,boulderNumber:1,attempts:4,completed:true,
    actorName:"Temporary test admin",actorRole:"admin",previousRecordId:firstRecord,
  });
  results = await (await fetch(`${base}/events/${ids[0]}/results`)).json();
  assert.equal(results.squads.find((s:any) => s.squad==="RavensWall").averageScore, 0.5);
  const updatedSeries = await (await fetch(`${base}/series`)).json();
  assert.equal(updatedSeries.events.find((e:any) => e.event.id===ids[0]).squads.find((s:any) => s.squad==="RavensWall").averageScore, 0.5);
  console.log("PASS: public gating, series podiums, squad averages, gender validation/persistence, privacy, corrections reflected live.");
} finally {
  await db.delete(eventsTable).where(inArray(eventsTable.id, ids));
  await pool.end();
}
