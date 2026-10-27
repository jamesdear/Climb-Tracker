import assert from "node:assert/strict";
import { ageBracket, eventYear } from "./age-bracket";

for (const [birth, bracket] of [
  [2014, "U13"], [2013, "U15"], [2012, "U15"],
  [2011, "U17"], [2010, "U17"], [2009, null], [2027, null], [null, null],
] as const) {
  assert.equal(ageBracket(birth, 2026), bracket);
}
assert.equal(eventYear({eventDate: "2026-10-27", createdAt: new Date("2025-01-01")}), 2026);
assert.equal(eventYear({eventDate: null, createdAt: new Date("2025-01-01")}), 2025);
console.log("Year-end age bracket boundary checks passed.");
