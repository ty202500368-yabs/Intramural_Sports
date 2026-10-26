import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { FORMATS } from '../lib/sports';
import {
  EmptyState,
  ErrorPanel,
  FormatBadge,
  LoadingPanel,
  PageHeader,
  SportMark,
} from '../components/ui';
import StandingsTable from '../components/StandingsTable';

export default function Standings() {
  const sportsState = useFetch('/sports');
  const sports = sportsState.data ?? [];
  const [sportId, setSportId] = useState('');

  useEffect(() => {
    if (!sportId && sports.length) setSportId(String(sports[0].id));
  }, [sports, sportId]);

  const standingsState = useFetch(sportId ? `/sports/${sportId}/standings` : null, {
    enabled: Boolean(sportId),
  });

  const selected = useMemo(
    () => sports.find((sport) => String(sport.id) === String(sportId)),
    [sports, sportId],
  );
  const rows = standingsState.data ?? [];
  const leader = rows[0];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Season 2026"
        title="Standings"
        subtitle="Live tables, updated as final scores come in. Three points for a win, one for a draw."
        actions={
          selected ? (
            <Link to={`/sports/${selected.id}`} className="btn btn--ghost">
              Sport page <ArrowUpRight size={16} />
            </Link>
          ) : null
        }
      />

      {sportsState.error ? (
        <ErrorPanel error={sportsState.error} onRetry={sportsState.reload} />
      ) : sportsState.loading && !sportsState.data ? (
        <LoadingPanel label="Loading the tables…" />
      ) : sports.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No sports yet"
          description="The season table appears once sports are added."
        />
      ) : (
        <>
          <div className="sport-tabs" role="tablist" aria-label="Choose a sport">
            {sports.map((sport) => (
              <button
                key={sport.id}
                type="button"
                role="tab"
                aria-selected={String(sport.id) === String(sportId)}
                className={`sport-tab${
                  String(sport.id) === String(sportId) ? ' is-active' : ''
                }`}
                onClick={() => setSportId(String(sport.id))}
              >
                <SportMark name={sport.name} size="xs" />
                {sport.name}
              </button>
            ))}
          </div>

          {selected && (
            <section className="standings-hero">
              <div className="standings-hero__sport">
                <SportMark name={selected.name} size="lg" />
                <div>
                  <h2>{selected.name}</h2>
                  <p>{selected.description || 'Campus competition, season-long glory.'}</p>
                  <div className="standings-hero__meta">
                    <FormatBadge format={selected.format} />
                    <span className="pill pill--soft">
                      {Number(selected.team_count)} teams
                    </span>
                  </div>
                </div>
              </div>

              {leader ? (
                <div className="standings-hero__leader">
                  <span className="eyebrow">Top of the table</span>
                  <strong>{leader.name}</strong>
                  <p>
                    {Number(leader.pts)} pts · {Number(leader.wins)}W {Number(leader.draws)}D{' '}
                    {Number(leader.losses)}L
                  </p>
                </div>
              ) : (
                <div className="standings-hero__leader standings-hero__leader--empty">
                  <span className="eyebrow">Top of the table</span>
                  <strong>Awaiting kickoff</strong>
                  <p>Results will build this table.</p>
                </div>
              )}
            </section>
          )}

          <section className="panel panel--flush">
            <div className="panel__head">
              <div>
                <p className="eyebrow">{FORMATS[selected?.format] || 'Table'}</p>
                <h2>League table</h2>
              </div>
              <span className="panel__meta">
                {rows.length} team{rows.length === 1 ? '' : 's'} ranked
              </span>
            </div>
            {standingsState.error ? (
              <div className="panel__inner">
                <ErrorPanel error={standingsState.error} onRetry={standingsState.reload} />
              </div>
            ) : standingsState.loading && !standingsState.data ? (
              <LoadingPanel label="Updating standings…" />
            ) : (
              <div className="panel__inner">
                <StandingsTable rows={rows} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
