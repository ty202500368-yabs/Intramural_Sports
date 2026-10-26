import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { FORMATS } from '../lib/sports';
import { EmptyState, ErrorPanel, PageHeader } from '../components/ui';
import SportCard from '../components/SportCard';

const FILTERS = [
  { value: 'all', label: 'All formats' },
  { value: 'single_elimination', label: FORMATS.single_elimination },
  { value: 'round_robin', label: FORMATS.round_robin },
];

export default function Sports() {
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/sports');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');

  const sports = data ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sports.filter((sport) => {
      if (format !== 'all' && sport.format !== format) return false;
      if (!needle) return true;
      return (
        sport.name.toLowerCase().includes(needle) ||
        (sport.description || '').toLowerCase().includes(needle)
      );
    });
  }, [sports, query, format]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Season 2026"
        title="Sports"
        subtitle="Pick your arena. Every sport has its own teams, fixtures, and path to the trophy."
        actions={
          isAdmin ? (
            <Link to="/admin/sports" className="btn btn--primary">
              <SlidersHorizontal size={16} /> Manage sports
            </Link>
          ) : (
            <Link to="/teams" className="btn btn--primary">
              <Plus size={16} /> Register a team
            </Link>
          )
        }
      />

      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sports…"
            aria-label="Search sports"
          />
        </div>
        <div className="filter-pills" role="group" aria-label="Filter sports by format">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`pill pill--filter${format === item.value ? ' is-active' : ''}`}
              onClick={() => setFormat(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="toolbar__count">
          {loading ? 'Loading…' : `${filtered.length} sport${filtered.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="sport-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="sport-card sport-card--skeleton" key={index}>
              <span className="skeleton skeleton--mark" />
              <span className="skeleton skeleton--line" />
              <span className="skeleton skeleton--line skeleton--short" />
              <span className="skeleton skeleton--foot" />
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <>
          <div className="sport-grid">
            {filtered.map((sport) => (
              <SportCard key={sport.id} sport={sport} />
            ))}
          </div>
          {!isAdmin && (
            <section className="cta-strip">
              <div>
                <p className="eyebrow">Captains wanted</p>
                <h3>Got a squad? Make it official.</h3>
                <p>
                  Registration stays open until the bracket is drawn. Build your roster and
                  get your team on the board.
                </p>
              </div>
              <Link to="/teams" className="btn btn--lime">
                <Plus size={16} /> Register a team
              </Link>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No sports match that search"
          description="Try a different keyword or switch the format filter."
          action={
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setQuery('');
                setFormat('all');
              }}
            >
              Clear filters
            </button>
          }
        />
      )}

    </div>
  );
}
