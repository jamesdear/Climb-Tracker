import assert from "node:assert/strict";
import { canLogAttempt } from "./scoring-permissions";

for (const status of ["draft", "open", "closed"]) {
  for (const resultsReleased of [false, true]) {
    const event = { status, resultsReleased };
    assert.equal(canLogAttempt(event, true), true, `Admin correction: ${status}, released=${resultsReleased}`);
    assert.equal(canLogAttempt(event, false), status === "open" && !resultsReleased, `Competitor: ${status}, released=${resultsReleased}`);
  }
}
console.log("PASS: admin corrections allowed after closure/release; competitors locked out.");
