export function eventYear(event: { eventDate: string | null; createdAt: Date }) {
  return event.eventDate
    ? Number(event.eventDate.slice(0, 4))
    : event.createdAt.getUTCFullYear();
}

/** Age at 31 December of the event year; unknown legacy ages remain unknown. */
export function ageBracket(birthYear: number | null, year: number) {
  if (birthYear === null) return null;
  const age = year - birthYear;
  if (age < 0 || age >= 17) return null;
  if (age < 13) return "U13" as const;
  if (age < 15) return "U15" as const;
  return "U17" as const;
}
