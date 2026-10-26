import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardCheck,
  MapPin,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Trophy,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage } from '../../lib/api';
import {
  formatDate,
  formatRound,
  formatTime,
  fromDatetimeLocal,
  toDatetimeLocal,
} from '../../lib/format';
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  Modal,
  PageHeader,
  SportMark,
  StatusBadge,
} from '../../components/ui';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Live' },
  { value: 'completed', label: 'Final' },
];

function EditMatchModal({ open, match, onClose, onSaved }) {
  const { notify } = useToast();
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !match) return;
    setDate(toDatetimeLocal(match.scheduled_at));
    setVenue(match.venue || '');
    setStatus(match.status === 'ongoing' ? 'ongoing' : 'scheduled');
    setError('');
    setBusy(false);
  }, [open, match]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.patch(`/matches/${match.id}`, {
        scheduled_at: fromDatetimeLocal(date),
        venue: venue.trim() || null,
        status,
      });
      notify('Match details updated.');
      onSaved?.();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      eyebrow={`${match?.sport_name || 'Match'} · ${match ? formatRound(match) : ''}`}
      title="Schedule match"
      description={`${match?.team_a || 'TBD'} vs ${match?.team_b || 'TBD'}`}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="match-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save match'}
          </button>
        </>
      }
    >
      <form id="match-form" className="form-stack" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <label className="field">
            <span className="field__label">Date &amp; time</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <span className="field__hint">Leave blank if the time is not yet confirmed.</span>
          </label>

          <label className="field">
            <span className="field__label">Venue</span>
            <input
              type="text"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="e.g. WMSU Gymnasium"
              maxLength={120}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Match status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Live / ongoing</option>
          </select>
          <span className="field__hint">
            Matches are completed automatically when you record a result.
          </span>
        </label>
      </form>
    </Modal>
  );
}

function ResultModal({ open, match, onClose, onSaved }) {
  const { notify } = useToast();
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !match) return;
    setScoreA(match.score_a === null || match.score_a === undefined ? '' : String(match.score_a));
    setScoreB(match.score_b === null || match.score_b === undefined ? '' : String(match.score_b));
    setError('');
    setBusy(false);
  }, [open, match]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const a = Number(scoreA);
    const b = Number(scoreB);
    if (scoreA === '' || scoreB === '' || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError('Enter whole-number scores for both teams.');
      return;
    }
    if (match?.format === 'single_elimination' && a === b) {
      setError('Elimination matches cannot end in a draw — decide a winner.');
      return;
    }

    setBusy(true);
    try {
      const result = await api.post(`/matches/${match.id}/result`, {
        score_a: a,
        score_b: b,
      });
      let message = 'Result recorded.';
      if (result?.winner_id) {
        const winner = result.winner_id === match.team_a_id ? match.team_a : match.team_b;
        message = `${winner} takes it. Result recorded.`;
      }
      notify(message);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      eyebrow={`${match?.sport_name || 'Match'} · ${match ? formatRound(match) : ''}`}
      title="Record result"
      description={
        match?.next_match_id
          ? 'The winner advances to the next round automatically.'
          : 'This result will update the standings and lock the match as final.'
      }
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="result-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Recording…' : 'Save result'}
          </button>
        </>
      }
    >
      <form id="result-form" className="result-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <div className="result-form__team">
          <div>
            <span className="eyebrow">Team A</span>
            <strong>{match?.team_a || 'TBD'}</strong>
          </div>
          <input
            type="number"
            min="0"
            value={scoreA}
            onChange={(event) => setScoreA(event.target.value)}
            placeholder="0"
            aria-label="Team A score"
            required
          />
        </div>

        <div className="result-form__divider">vs</div>

        <div className="result-form__team">
          <div>
            <span className="eyebrow">Team B</span>
            <strong>{match?.team_b || 'TBD'}</strong>
          </div>
          <input
            type="number"
            min="0"
            value={scoreB}
            onChange={(event) => setScoreB(event.target.value)}
            placeholder="0"
            aria-label="Team B score"
            required
          />
        </div>

        <p className="field__hint">
          Scores must be whole numbers. You can correct a result later unless the next round
          has already been played.
        </p>
      </form>
    </Modal>
  );
}

export default function AdminMatches() {
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const sportsState = useFetch('/sports');
  const matchesState = useFetch('/matches');

  const [query, setQuery] = useState('');
  const [sportId, setSportId] = useState(searchParams.get('sport') || 'all');
  const [status, setStatus] = useState('all');
  const [editTarget, setEditTarget] = useState(null);
  const [resultTarget, setResultTarget] = useState(null);
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    setSportId(searchParams.get('sport') || 'all');
  }, [searchParams]);

  const sports = sportsState.data ?? [];
  const matches = matchesState.data ?? [];

  const roundsBySport = useMemo(() => {
    const map = {};
    for (const match of matches) {
      const current = map[match.sport_id] || 1;
      map[match.sport_id] = Math.max(current, Number(match.round));
    }
    return map;
  }, [matches]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matches
      .filter((match) => {
        if (sportId !== 'all' && String(match.sport_id) !== sportId) return false;
        if (status !== 'all' && match.status !== status) return false;
        if (!needle) return true;
        return [match.team_a, match.team_b, match.venue, match.sport_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const sport = (a.sport_name || '').localeCompare(b.sport_name || '');
        if (sport) return sport;
        if (Number(a.round) !== Number(b.round)) return Number(a.round) - Number(b.round);
        return Number(a.match_number) - Number(b.match_number);
      });
  }, [matches, query, sportId, status]);

  const counts = useMemo(
    () => ({
      scheduled: matches.filter((match) => match.status === 'scheduled').length,
      ongoing: matches.filter((match) => match.status === 'ongoing').length,
      completed: matches.filter((match) => match.status === 'completed').length,
    }),
    [matches],
  );

  const changeSport = (value) => {
    setSportId(value);
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (value === 'all') next.delete('sport');
        else next.set('sport', value);
        return next;
      },
      { replace: true },
    );
  };

  const reloadAll = () => {
    sportsState.reload();
    matchesState.reload();
  };

  const startMatch = async (match) => {
    setStartingId(match.id);
    try {
      await api.patch(`/matches/${match.id}`, { status: 'ongoing' });
      notify('Match is live.');
      matchesState.reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setStartingId(null);
    }
  };

  const error = sportsState.error || matchesState.error;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin control room"
        title="Match control"
        subtitle="Set the time and place, start the clock, and keep every score up to date."
        actions={
          <button type="button" className="btn btn--ghost" onClick={reloadAll}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="admin-summary">
        <div className="admin-summary__item">
          <CalendarDays size={18} />
          <span>
            <strong>{counts.scheduled}</strong> scheduled
          </span>
        </div>
        <div className="admin-summary__item">
          <Play size={18} />
          <span>
            <strong>{counts.ongoing}</strong> live now
          </span>
        </div>
        <div className="admin-summary__item">
          <ClipboardCheck size={18} />
          <span>
            <strong>{counts.completed}</strong> completed
          </span>
        </div>
      </div>

      <div className="toolbar toolbar--wrap">
        <div className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams or venues…"
            aria-label="Search matches"
          />
        </div>

        <select
          className="select-inline"
          value={sportId}
          onChange={(event) => changeSport(event.target.value)}
          aria-label="Filter by sport"
        >
          <option value="all">All sports</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>

        <div className="filter-pills" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`pill pill--filter${status === item.value ? ' is-active' : ''}`}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="toolbar__count">
          {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        </span>
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={reloadAll} />
      ) : matchesState.loading && !matchesState.data ? (
        <LoadingPanel label="Loading match control…" />
      ) : filtered.length ? (
        <section className="panel panel--flush">
          <div className="table-scroll">
            <table className="admin-table admin-table--matches">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Teams</th>
                  <th>Schedule</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((match) => {
                  const bothTeams = Boolean(match.team_a && match.team_b);
                  const completed = match.status === 'completed';
                  const totalRounds = roundsBySport[match.sport_id];
                  return (
                    <tr key={match.id}>
                      <td>
                        <div className="table-match">
                          <span>
                            <SportMark name={match.sport_name} size="xs" /> {match.sport_name}
                          </span>
                          <strong>
                            {formatRound({ ...match, total_rounds: totalRounds })}
                          </strong>
                          <small>Match {match.match_number}</small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-fixture">
                          <span
                            className={
                              completed && match.winner_id === match.team_a_id ? 'is-winner' : ''
                            }
                          >
                            {match.team_a || 'Winner TBD'}
                            {completed && <b>{match.score_a}</b>}
                          </span>
                          <span
                            className={
                              completed && match.winner_id === match.team_b_id ? 'is-winner' : ''
                            }
                          >
                            {match.team_b || 'Winner TBD'}
                            {completed && <b>{match.score_b}</b>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-when">
                          <span>{formatDate(match.scheduled_at)}</span>
                          <small>{formatTime(match.scheduled_at)}</small>
                        </div>
                      </td>
                      <td>
                        <span className="table-venue">
                          <MapPin size={13} /> {match.venue || 'TBD'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={match.status} />
                      </td>
                      <td className="actions">
                        <div className="row-actions">
                          {!completed && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit schedule"
                              aria-label="Edit schedule"
                              onClick={() =>
                                setEditTarget({ ...match, total_rounds: totalRounds })
                              }
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {match.status === 'scheduled' && bothTeams && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Mark match live"
                              aria-label="Mark match live"
                              onClick={() => startMatch(match)}
                              disabled={startingId === match.id}
                            >
                              <Play size={15} />
                            </button>
                          )}
                          {bothTeams ? (
                            <button
                              type="button"
                              className={`btn btn--xs ${
                                completed ? 'btn--ghost' : 'btn--soft'
                              }`}
                              onClick={() =>
                                setResultTarget({ ...match, total_rounds: totalRounds })
                              }
                            >
                              <ClipboardCheck size={14} />
                              {completed ? 'Edit result' : 'Record result'}
                            </button>
                          ) : (
                            <span className="table-note">Awaiting teams</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Trophy}
          title={matches.length ? 'No matches match those filters' : 'No matches on the board'}
          description={
            matches.length
              ? 'Try a different sport, status, or search.'
              : 'Generate a bracket from Sports & brackets to create the fixture list.'
          }
          action={
            matches.length ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setQuery('');
                  setStatus('all');
                  changeSport('all');
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/admin/sports" className="btn btn--primary btn--sm">
                Build brackets
              </Link>
            )
          }
        />
      )}

      <EditMatchModal
        open={Boolean(editTarget)}
        match={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={reloadAll}
      />

      <ResultModal
        open={Boolean(resultTarget)}
        match={resultTarget}
        onClose={() => setResultTarget(null)}
        onSaved={reloadAll}
      />
    </div>
  );
}
