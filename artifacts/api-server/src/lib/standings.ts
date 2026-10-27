const SQUADS = ["RavensWall", "HarroWall", "VauxWall", "BethWall"] as const;
const AGES = ["U13", "U15", "U17"] as const;
const GENDERS = ["O", "W+"] as const;

type Score = {
  climberName: string;
  squad: string;
  totalPoints: number;
  completedCount: number;
  attemptCount: number;
  ageBracket?: string | null;
  gender?: string | null;
};

function compareScores(a: Score, b: Score) {
  return b.totalPoints - a.totalPoints ||
    b.completedCount - a.completedCount ||
    a.attemptCount - b.attemptCount;
}

export function rankClimbers<T extends Score>(rows: T[]) {
  const ordered = [...rows].sort((a, b) => compareScores(a, b) || a.climberName.localeCompare(b.climberName));
  let rank = 0;
  return ordered.map((row, i) => {
    if (!i || compareScores(row, ordered[i - 1]) !== 0) rank = i + 1;
    return { ...row, rank };
  });
}

export function squadStandings(rows: Pick<Score, "squad" | "totalPoints">[]) {
  const squads = SQUADS.map(squad => {
    const climbers = rows.filter(row => row.squad === squad);
    const totalPoints = climbers.reduce((sum, row) => sum + row.totalPoints, 0);
    return {
      squad, climberCount: climbers.length, totalPoints,
      averageScore: climbers.length ? totalPoints / climbers.length : null,
    };
  }).sort((a, b) => {
    if (!a.climberCount || !b.climberCount) return b.climberCount - a.climberCount;
    // Compare unrounded averages. Names only stabilise tied display order.
    return b.totalPoints * a.climberCount - a.totalPoints * b.climberCount || a.squad.localeCompare(b.squad);
  });
  let rank = 0;
  return squads.map((row, i) => {
    if (!row.climberCount) return { ...row, rank: null };
    const prev = squads[i - 1];
    if (!prev || row.totalPoints * prev.climberCount !== prev.totalPoints * row.climberCount) rank = i + 1;
    return { ...row, rank };
  });
}

export function categoryPodiums(rows: Score[]) {
  return AGES.flatMap(ageBracket => GENDERS.map(gender => {
    const category = rows.filter(row => row.ageBracket === ageBracket && row.gender === gender);
    return {
      ageBracket, gender, climberCount: category.length,
      places: rankClimbers(category).filter(row => row.rank <= 3),
    };
  }));
}

export function summarizeStandings(rows: Score[]) {
  return {
    squads: squadStandings(rows),
    podiums: categoryPodiums(rows),
    uncategorizedCount: rows.filter(row =>
      !AGES.some(age => age === row.ageBracket) || !GENDERS.some(gender => gender === row.gender),
    ).length,
  };
}
