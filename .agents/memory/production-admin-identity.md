---
name: Production administrator identity
description: Copied development profiles can block the production initial administrator.
---

Production can contain copied development administrator profiles whose Clerk identities do not exist in the production tenant. An email match and an admin row are not sufficient proof of production access.

**Why:** The initial published database contained a preview admin and a separate production competitor for the same email, preventing first-admin bootstrap.

**How to apply:** Diagnose roles against the target environment's identity, not just email. Transfer a stale bootstrap grant only for the owner-configured verified email after confirming the old identity is absent; consume the stale grant so later revocations stay effective. Treat lookup failures other than not-found as failures, not permission to grant access.
