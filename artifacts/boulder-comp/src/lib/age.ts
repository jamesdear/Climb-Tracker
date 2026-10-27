export type AgeBracket = 'U13' | 'U15' | 'U17';

/** Competition year: event date year, or the year the event was created if no date is set. */
export function eventYear(event: { eventDate: string | null; createdAt: string }): number {
  return new Date(event.eventDate ?? event.createdAt).getUTCFullYear();
}

/** Age at 31 December of the event year, mapped to a bracket. Null when invalid. */
export function bracketFor(birthYear: number, year: number): AgeBracket | null {
  if (!Number.isInteger(birthYear) || birthYear > year) return null;
  const age = year - birthYear;
  if (age < 13) return 'U13';
  if (age < 15) return 'U15';
  if (age < 17) return 'U17';
  return null;
}

export function bracketLabel(bracket: string | null | undefined): string {
  return bracket ?? 'Age not provided';
}
