/** Closing/releasing locks competitor entries, not attributed admin corrections. */
export function canLogAttempt(
  event: { status: string; resultsReleased: boolean },
  isAdmin: boolean,
) {
  return isAdmin || (event.status === "open" && !event.resultsReleased);
}
