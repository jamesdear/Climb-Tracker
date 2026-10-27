import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useGetSeriesProgress, getGetSeriesProgressQueryKey } from '@workspace/api-client-react';
import type { SeriesEvent } from '@workspace/api-client-react';
import { Shell, Busy, Failure } from '../components/layout';
import { SquadStandings, CategoryPodiums, UncategorizedNote } from '../components/Standings';
import { eventYear } from '../lib/age';

type Phase = 'upcoming' | 'open' | 'awaiting' | 'released';

function phaseOf(e: SeriesEvent['event']): Phase {
  if (e.resultsReleased) return 'released';
  if (e.status === 'open') return 'open';
  if (e.status === 'closed') return 'awaiting';
  return 'upcoming';
}
const PHASE_LABEL: Record<Phase, string> = {
  upcoming: 'Upcoming',
  open: 'Open for scoring',
  awaiting: 'Closed · results not yet released',
  released: 'Results released',
};

function EventBlock({ item, index }: { item: SeriesEvent; index: number }) {
  const ev = item.event;
  const phase = phaseOf(ev);
  return (
    <article className={`series-event phase-${phase}`} data-testid={`card-series-event-${ev.id}`}>
      <header className="series-event-head">
        <span className="series-step mono">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3>{ev.name}</h3>
          <p className="muted">
            {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be announced'}
          </p>
          <span className={`phase-tag ${phase}`} data-testid={`status-series-${ev.id}`}>{PHASE_LABEL[phase]}</span>
        </div>
      </header>
      {phase === 'released' ? (
        <>
          <UncategorizedNote count={item.uncategorizedCount} />
          <h4 className="sub-head">Squad standings</h4>
          <SquadStandings squads={item.squads} />
          <h4 className="sub-head">Category podiums</h4>
          <CategoryPodiums podiums={item.podiums} />
          <Link className="btn outline small" href={`/results/${ev.id}`} data-testid={`link-series-results-${ev.id}`}>Full results <ArrowRight size={14} /></Link>
        </>
      ) : (
        <p className="muted">Results will appear here once released.</p>
      )}
    </article>
  );
}

export function SeriesPage() {
  const q = useGetSeriesProgress({ query: { queryKey: getGetSeriesProgressQueryKey(), refetchInterval: 30000 } });
  const events = useMemo(() => q.data?.events ?? [], [q.data]);
  const years = useMemo(() => [...new Set(events.map(e => eventYear(e.event)))].sort((a, b) => b - a), [events]);
  const [pick, setPick] = useState<number | null>(null);
  const year = pick ?? years[0] ?? null;
  const list = events
    .filter(e => eventYear(e.event) === year)
    .sort((a, b) => new Date(a.event.eventDate ?? a.event.createdAt).getTime() - new Date(b.event.eventDate ?? b.event.createdAt).getTime());
  const released = list.filter(e => e.event.resultsReleased).length;

  if (q.isLoading) return <Shell><Busy label="Loading series" /></Shell>;
  return (
    <Shell>
      <main className="page">
        <h1 className="page-title">Series progress</h1>
        {q.isError ? <Failure retry={() => q.refetch()} /> : !events.length ? (
          <div className="empty" data-testid="empty-series">No series events yet.</div>
        ) : (
          <>
            {years.length > 1 && (
              <div className="year-tabs" role="tablist" aria-label="Series year">
                {years.map(y => (
                  <button key={y} role="tab" aria-selected={y === year} className={y === year ? 'on' : ''} onClick={() => setPick(y)} data-testid={`tab-year-${y}`}>{y}</button>
                ))}
              </div>
            )}
            <p className="series-count" data-testid="text-series-released">
              <strong>{released} of {list.length}</strong> {list.length === 1 ? 'event' : 'events'} released in {year}
            </p>
            <div className="series-bar" aria-hidden="true">
              {list.map(e => <span key={e.event.id} className={`phase-${phaseOf(e.event)}`} />)}
            </div>
            <p className="muted small-note">Each event is scored separately. No overall series totals are calculated.</p>
            {released === 0 && <div className="empty" data-testid="empty-series-results">No results have been released yet.</div>}
            <div className="series-list">
              {list.map((e, i) => <EventBlock key={e.event.id} item={e} index={i} />)}
            </div>
          </>
        )}
      </main>
    </Shell>
  );
}
