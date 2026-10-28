// Deliberately exclude bodies, query strings, invitation links and browsing events.
export function describeOrganizerAction(method: string, path: string): string | null {
  if (method === "POST" && path === "/admin/invitations") return "Created organizer invitation";
  if (method === "POST" && path === "/admin/events") return "Created event";
  if (method === "POST" && /^\/admin\/events\/[^/]+\/release$/.test(path)) return "Released results";
  if (method === "PATCH" && /^\/admin\/events\/[^/]+\/status$/.test(path)) return "Changed event status";
  if (method === "PATCH" && /^\/admin\/events\/[^/]+$/.test(path)) return "Edited event";
  if (method === "PATCH" && /^\/admin\/users\/[^/]+\/role$/.test(path)) return "Changed account role";
  if (method === "POST" && /^\/scorecards\/[^/]+\/boulders\/\d+\/records$/.test(path)) return "Corrected scorecard";
  return null;
}
