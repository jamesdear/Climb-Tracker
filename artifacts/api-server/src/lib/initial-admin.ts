type AdminProfile = { clerkUserId: string; email: string | null };

/** Reconcile a copied preview profile only after confirming it is absent in this Clerk instance. */
export async function initialAdminGrant(
  verifiedEmail: string | null,
  configuredEmail: string | undefined,
  admins: AdminProfile[],
  lookupUser: (id: string) => Promise<unknown>,
) {
  const staleIds: string[] = [];
  const trustedEmail = configuredEmail?.trim().toLowerCase();
  if (!verifiedEmail || !trustedEmail || verifiedEmail.toLowerCase() !== trustedEmail) {
    return { grant: false, staleIds };
  }
  for (const admin of admins) {
    if (admin.email?.toLowerCase() !== trustedEmail) continue;
    try {
      await lookupUser(admin.clerkUserId);
    } catch (error) {
      // Never interpret network/authorization/provider failures as a missing user.
      if (typeof error !== "object" || error === null || !("status" in error) || error.status !== 404) {
        throw error;
      }
      staleIds.push(admin.clerkUserId);
    }
  }
  return { grant: admins.length === 0 || staleIds.length > 0, staleIds };
}
