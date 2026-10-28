import assert from "node:assert/strict";
import { describeOrganizerAction } from "../lib/organizer-actions";
assert.equal(describeOrganizerAction("POST", "/admin/events"), "Created event");
assert.equal(describeOrganizerAction("PATCH", "/admin/events/abc/status"), "Changed event status");
assert.equal(describeOrganizerAction("POST", "/admin/events/abc/release"), "Released results");
assert.equal(describeOrganizerAction("PATCH", "/admin/users/user_123/role"), "Changed account role");
assert.equal(describeOrganizerAction("POST", "/scorecards/abc/boulders/2/records"), "Corrected scorecard");
for (const path of ["/admin/activity", "/admin/users", "/events/open", "/scorecards/abc"]) {
  assert.equal(describeOrganizerAction("GET", path), null);
}
assert.equal(describeOrganizerAction("POST", "/unknown"), null);
console.log("PASS: organizer action classification; no browsing entries.");
