import assert from "node:assert/strict";
import { initialAdminGrant } from "./initial-admin";

const email = "owner@example.com";
const copied = [{ clerkUserId: "preview-user", email }];
const missing = async () => { throw { status: 404 }; };
const live = async () => ({});
assert.equal((await initialAdminGrant(email, email, [], live)).grant, true);
assert.equal((await initialAdminGrant(null, email, copied, missing)).grant, false);
assert.equal((await initialAdminGrant("other@example.com", email, copied, missing)).grant, false);
assert.equal((await initialAdminGrant(email, undefined, copied, missing)).grant, false);
assert.equal((await initialAdminGrant(email, email, copied, live)).grant, false);
assert.deepEqual(await initialAdminGrant(email, email, copied, missing),
  { grant: true, staleIds: ["preview-user"] });
await assert.rejects(() => initialAdminGrant(email, email, copied, async () => { throw { status: 503 }; }));
// Once copied grant is consumed, a revoked user cannot regain access while a real admin remains.
assert.equal((await initialAdminGrant(email, email,
  [{ clerkUserId: "real-admin", email: "admin@example.com" }], live)).grant, false);
console.log("PASS: verified owner bootstrap, stale-ID transfer, fail-closed lookup and no repeated grants.");
