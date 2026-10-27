import assert from "node:assert/strict";
import { categoryPodiums, rankClimbers, squadStandings, summarizeStandings } from "./standings";

const score = (climberName: string, squad: string, totalPoints: number, ageBracket: string | null = "U13", gender: string | null = "O") => ({
  climberName, squad, totalPoints, ageBracket, gender, completedCount: totalPoints ? 1 : 0, attemptCount: totalPoints ? 1 : 0,
});
const rows = [
  score("A", "RavensWall", 10), score("B", "RavensWall", 0),
  score("C", "HarroWall", 7, "U15", "W+"),
  score("D", "VauxWall", 7, "U17"), score("E", "VauxWall", 7, "U17", "W+"),
  score("F", "BethWall", 4, "U13", null),
];
const squads = squadStandings(rows);
assert.equal(squads.find(s => s.squad === "RavensWall")?.averageScore, 5);
assert.equal(squads.find(s => s.squad === "RavensWall")?.climberCount, 2);
assert.deepEqual(squads.map(s => s.rank), [1, 1, 3, 4]);
assert.equal(squadStandings([]).every(s => s.averageScore === null && s.rank === null), true);
assert.equal(categoryPodiums(rows).length, 6);
assert.equal(categoryPodiums(rows).find(p => p.ageBracket === "U15" && p.gender === "W+")?.places[0]?.climberName, "C");
assert.equal(summarizeStandings(rows).uncategorizedCount, 1);
const tied = ["A","B","C","D"].map(n => score(n, "BethWall", 10));
assert.deepEqual(rankClimbers(tied).map(r => r.rank), [1,1,1,1]);
assert.equal(categoryPodiums(tied)[0].places.length, 4, "All tied podium places must be included");
const precision = squadStandings([
  score("A", "RavensWall", 10), score("B", "RavensWall", 0), score("C", "RavensWall", 0),
  score("D", "BethWall", 3),
]);
assert.equal(precision[0].averageScore, 10 / 3);
console.log("PASS: average includes zeros; empty squads; exact averages; shared ranks; six category podiums; unknown categories.");
