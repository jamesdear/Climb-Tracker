---
name: Repository privacy
description: Personal email privacy and history cleanup constraints.
---
Keep personal administrator email addresses out of tracked configuration.

**Why:** The user explicitly does not want their email made public and authorized rewriting GitHub history to remove it. Replit shared environment settings can be serialized into tracked .replit configuration; they are not automatically private.

**How to apply:** Existing admin roles do not require the initial-admin bootstrap setting. Do not reintroduce personal email literals or merge pre-cleanup branches into main. Internal checkpoint backups were excluded from the authorized public-history cleanup; restoring one may restore the removed information.
