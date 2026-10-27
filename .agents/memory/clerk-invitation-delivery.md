---
name: Clerk invitation delivery
description: Accepted invitation requests do not establish usable signup links or email delivery.
---

Use an absolute application URL for Clerk invitation redirects, with separate development and production origins.

**Why:** Clerk accepted a relative redirect and returned a link, but redemption resolved to a Clerk-hosted missing page. An accepted API request also does not confirm email delivery.

**How to apply:** Verify the recipient journey, not only invitation creation. Keep invitation tickets out of logs and screenshots. Do not describe provider acceptance as confirmed inbox delivery or completed signup.
