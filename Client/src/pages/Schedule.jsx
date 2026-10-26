import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { matchSort, withRoundTotals } from '../lib/format';
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
} from '../components/ui';
import MatchRow from '../components/MatchRow';

const STATUS_FILTERS = [
  { value: 'all', label: 'All games' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Live now' },
  { value: 'completed', label: 'Final' },
];

export default function Schedule() {
  const { isAdmin } = useAuth();
  const sportsState = useFetch('/sports');
  const matchesState = useFetch('/matches');

  const [query, setQuery] = useState('');
  const [sportId, setSportId] = useState('all');
  const [status, setStatus] = useState('all');

  const sports = sportsState.data ?? [];
  const matches = matchesState.data ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = matches
      .filter((match) => {
        if (sportId !== 'all' && String(match.sport_id) !== sportId) return false;
        if (status !== 'all' && match.status !== status) return false;
        if (!needle) return true;
        return [match.team_a, match.team_b, match.sport_name, match.venue]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      })
      .sort(matchSort);
    return withRoundTotals(rows);
  }, [matches, query, sportId, status]);

  const counts = useMemo(
    () => ({
      live: matches.filter((match) => match.status === 'ongoing').length,
      upcoming: matches.filter((match) => match.status === 'scheduled').length,
      completed: matches.filter((match) => match.status === 'completed').length,
    }),
    [matches],
  );

  const error = sportsState.error || matchesState.error;
  const clearFilters = () => {
    setQuery('');
    setSportId('all');
    setStatus('all');
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Season 2026"
        title="Match schedule"
        subtitle="Every fixture, tip-off, and final whistle across all intramural sports."
        actions={
          isAdmin ? (
            <Link to="/admin/matches" className="btn btn--primary">
              <SlidersHorizontal size={16} /> Manage matches
            </Link>
          ) : (
            <div className="page-head__stat">
              <strong>{counts.upcoming}</strong>
              <span>fixtures scheduled</span>
            </div>
          )
        }
      />

      {error ? (
        <ErrorPanel
          error={error}
          onRetry={() => {
            sportsState.reload();
            matchesState.reload();
          }}
        />
      ) : (
        <>
          <div className="toolbar toolbar--wrap">
            <div className="search-field">
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search teams, sports, or venues…"
                aria-label="Search matches"
              />
            </div>

            <select
              className="select-inline"
              value={sportId}
              onChange={(event) => setSportId(event.target.value)}
              aria-label="Filter by sport"
            >
              <option value="all">All sports</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>

            <div className="filter-pills" role="group" aria-label="Filter by match status">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`pill pill--filter${status === item.value ? ' is-active' : ''}`}
                  onClick={() => setStatus(item.value)}
                >
                  {item.value === 'ongoing' && counts.live > 0 && (
                    <span className="status-dot" />
                  )}
                  {item.label}
                </button>
              ))}
            </div>

            <span className="toolbar__count">
              {loadingLabel(matchesState.loading, filtered.length)}
            </span>
          </div>

          <div className="schedule-summary">
            <span>
              <span className="status-dot" /> {counts.live} live
            </span>
            <span>{counts.upcoming} scheduled</span>
            <span>{counts.completed} completed</span>
          </div>

          {matchesState.loading && !matchesState.data ? (
            <LoadingPanel label="Loading fixtures…" />
          ) : filtered.length ? (
            <section className="panel panel--flush">
              <div className="match-list">
                {filtered.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={matches.length ? 'No games match those filters' : 'No fixtures yet'}
              description={
                matches.length
                  ? 'Try another sport, status, or search term.'
                  : 'The schedule will appear once brackets are generated and matches are assigned.'
              }
              action={
                matches.length ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : isAdmin ? (
                  <Link to="/admin/sports" className="btn btn--primary btn--sm">
                    Build a bracket
                  </Link>
                ) : null
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function loadingLabel(loading, count) {
  if (loading) return 'Loading…';
  return `${count} game${count === 1 ? '' : 's'}`;
}
