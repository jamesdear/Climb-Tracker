import type { CategoryPodium, SquadResult } from '@workspace/api-client-react';

const AGES = ['U13', 'U15', 'U17'] as const;
const GENDERS = ['O', 'W+'] as const;

export function genderLabel(gender: string | null | undefined): string {
  if (gender === 'O' || gender === 'W+') return gender;
  return 'Gender not provided';
}

const squadName = (s: string) => s;

export function SquadStandings({ squads }: { squads: SquadResult[] }) {
  if (!squads.length) return <div className="empty" data-testid="empty-squads">No squad scores yet.</div>;
  const sorted = [...squads].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  return (
    <div data-testid="list-squad-standings">
      <ol className="squad-list">
        {sorted.map(s => (
          <li key={s.squad} className={`squad-row sq-line-${s.squad}`} data-testid={`row-squad-${s.squad}`}>
            <span className="squad-rank mono">{s.rank != null ? `#${s.rank}` : '–'}</span>
            <span className="squad-name">
              <strong>{squadName(s.squad)}</strong>
              <span className="muted">{s.climberCount} {s.climberCount === 1 ? 'climber' : 'climbers'} · {s.totalPoints.toLocaleString()} pts total</span>
            </span>
            <span className="squad-avg" data-testid={`text-squad-average-${s.squad}`}>
              {s.averageScore != null ? s.averageScore.toFixed(2) : '–'}
              <small>avg</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="muted small-note">
        Average = squad total points divided by all squad scorecards, including scores of zero. Rounded to 2 decimals for display only. Equal averages share a rank.
      </p>
    </div>
  );
}

export function CategoryPodiums({ podiums }: { podiums: CategoryPodium[] }) {
  return (
    <div className="podium-grid" data-testid="grid-category-podiums">
      {AGES.flatMap(age => GENDERS.map(g => {
        const p = podiums.find(x => x.ageBracket === age && x.gender === g);
        const key = `${age}-${g}`;
        return (
          <section className="podium-card" key={key} data-testid={`podium-${key}`}>
            <header>
              <strong>{age} {genderLabel(g)}</strong>
              <span className="muted">{p?.climberCount ?? 0} climbers</span>
            </header>
            {p && p.places.length ? (
              <ol>
                {p.places.map((r, i) => (
                  <li key={`${r.rank}-${r.climberName}-${i}`}>
                    <span className={`place place-${r.rank}`}>{r.rank}</span>
                    <span className="podium-name">{r.climberName}<small>{squadName(r.squad)}</small></span>
                    <span className="mono">{r.totalPoints}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="muted">No climbers in this category.</p>}
          </section>
        );
      }))}
    </div>
  );
}

export function UncategorizedNote({ count }: { count: number }) {
  if (!count) return null;
  return (
    <p className="warn-note" role="note" data-testid="text-uncategorized">
      {count} {count === 1 ? 'scorecard is' : 'scorecards are'} missing an age or gender category and {count === 1 ? 'is' : 'are'} not in the podiums.
    </p>
  );
}
