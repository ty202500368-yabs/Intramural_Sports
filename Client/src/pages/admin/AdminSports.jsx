import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage } from '../../lib/api';
import { FORMATS } from '../../lib/sports';
import {
  ConfirmDialog,
  ErrorPanel,
  FormatBadge,
  LoadingPanel,
  Modal,
  PageHeader,
  SportMark,
} from '../../components/ui';

const blankForm = {
  name: '',
  description: '',
  format: 'single_elimination',
};

function SportFormModal({ open, onClose, sport, onSaved }) {
  const { notify } = useToast();
  const [form, setForm] = useState(blankForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      sport
        ? {
            name: sport.name,
            description: sport.description || '',
            format: sport.format,
          }
        : blankForm,
    );
    setError('');
    setBusy(false);
  }, [open, sport]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Give the sport a name.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        format: form.format,
      };
      if (sport) await api.put(`/sports/${sport.id}`, payload);
      else await api.post('/sports', payload);
      notify(sport ? 'Sport updated.' : 'Sport added to the season.');
      onSaved();
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
      eyebrow={sport ? 'Sport settings' : 'New event'}
      title={sport ? `Edit ${sport.name}` : 'Add a sport'}
      description={
        sport
          ? 'Changes are visible to students immediately.'
          : 'Set up the event, then wait for captains to register their teams.'
      }
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="sport-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : sport ? 'Save changes' : 'Add sport'}
          </button>
        </>
      }
    >
      <form id="sport-form" className="form-stack" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <label className="field">
          <span className="field__label">Sport name</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Basketball"
            maxLength={80}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="A short line for the sports page."
            maxLength={500}
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">Tournament format</legend>
          <div className="format-options">
            {Object.entries(FORMATS).map(([value, label]) => (
              <label
                key={value}
                className={`format-option${form.format === value ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={form.format === value}
                  onChange={() => setForm((current) => ({ ...current, format: value }))}
                />
                <strong>{label}</strong>
                <span>
                  {value === 'single_elimination'
                    ? 'One loss ends the run. Best for quick, high-stakes brackets.'
                    : 'Everyone plays everyone. Builds a true league table.'}
                </span>
              </label>
            ))}
          </div>
          <span className="field__hint">
            Format can be changed until the bracket is generated.
          </span>
        </fieldset>
      </form>
    </Modal>
  );
}

export default function AdminSports() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useFetch('/sports');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bracketTarget, setBracketTarget] = useState(null);
  const [bracketMode, setBracketMode] = useState('generate');
  const [bracketBusy, setBracketBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const sports = data ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sports;
    return sports.filter(
      (sport) =>
        sport.name.toLowerCase().includes(needle) ||
        (sport.description || '').toLowerCase().includes(needle),
    );
  }, [sports, query]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (sport) => {
    setEditing(sport);
    setFormOpen(true);
  };

  const askBracket = (sport) => {
    if (!Number(sport.match_count) && Number(sport.team_count) < 2) {
      notify('At least two teams must be registered before generating a bracket.', 'error');
      return;
    }
    setBracketTarget(sport);
    setBracketMode(Number(sport.match_count) ? 'clear' : 'generate');
  };

  const runBracket = async () => {
    if (!bracketTarget) return;
    setBracketBusy(true);
    try {
      if (bracketMode === 'generate') {
        await api.post(`/sports/${bracketTarget.id}/bracket`);
        notify(`${bracketTarget.name} bracket generated.`);
      } else {
        await api.delete(`/sports/${bracketTarget.id}/bracket`);
        notify(`${bracketTarget.name} bracket cleared. Registration reopened.`);
      }
      setBracketTarget(null);
      reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBracketBusy(false);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/sports/${deleteTarget.id}`);
      notify(`${deleteTarget.name} removed from the season.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  const openRegistrations = sports.filter((sport) => !Number(sport.match_count)).length;
  const liveBrackets = sports.length - openRegistrations;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin control room"
        title="Sports & brackets"
        subtitle="Create the events, seed the brackets, and give every sport its stage."
        actions={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Plus size={16} /> Add sport
          </button>
        }
      />

      <div className="admin-summary">
        <div className="admin-summary__item">
          <Trophy size={18} />
          <span>
            <strong>{sports.length}</strong> sports in the season
          </span>
        </div>
        <div className="admin-summary__item">
          <Users size={18} />
          <span>
            <strong>{openRegistrations}</strong> open for registration
          </span>
        </div>
        <div className="admin-summary__item">
          <Sparkles size={18} />
          <span>
            <strong>{liveBrackets}</strong> brackets live
          </span>
        </div>
      </div>

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
        <span className="toolbar__count">
          {filtered.length} of {sports.length}
        </span>
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingPanel label="Loading sports…" />
      ) : (
        <section className="panel panel--flush">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sport</th>
                  <th>Format</th>
                  <th className="num">Teams</th>
                  <th className="num">Matches</th>
                  <th>Registration</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sport) => {
                  const open = !Number(sport.match_count);
                  return (
                    <tr key={sport.id}>
                      <td>
                        <div className="table-sport">
                          <SportMark name={sport.name} size="sm" />
                          <div>
                            <strong>{sport.name}</strong>
                            <span>{sport.description || 'No description'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <FormatBadge format={sport.format} />
                      </td>
                      <td className="num">{Number(sport.team_count)}</td>
                      <td className="num">{Number(sport.match_count)}</td>
                      <td>
                        <span className={`pill ${open ? 'pill--open' : 'pill--closed'}`}>
                          <span className="status-dot" />
                          {open ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="actions">
                        <div className="row-actions">
                          <Link
                            to={`/sports/${sport.id}`}
                            className="icon-btn"
                            title="View sport page"
                            aria-label={`View ${sport.name}`}
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                          {open ? (
                            <button
                              type="button"
                              className="btn btn--soft btn--xs"
                              onClick={() => askBracket(sport)}
                              title="Generate bracket"
                            >
                              <Sparkles size={14} /> Bracket
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn--ghost btn--xs"
                              onClick={() => askBracket(sport)}
                              title="Clear bracket"
                            >
                              <RotateCcw size={14} /> Clear
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEdit(sport)}
                            title="Edit sport"
                            aria-label={`Edit ${sport.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => setDeleteTarget(sport)}
                            title="Delete sport"
                            aria-label={`Delete ${sport.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="panel__inner">
              <div className="simple-empty">
                <p>No sports match “{query}”.</p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="panel panel--muted">
        <div className="tip-row">
          <Calendar size={18} />
          <p>
            <strong>Bracket flow:</strong> teams register freely until you generate a bracket.
            Generating seeds every team randomly, creates all matches, and locks registration
            for that sport. Clearing a bracket deletes its matches and results.
          </p>
        </div>
      </div>

      <SportFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sport={editing}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(bracketTarget)}
        onClose={() => setBracketTarget(null)}
        onConfirm={runBracket}
        loading={bracketBusy}
        tone={bracketMode === 'clear' ? 'danger' : 'primary'}
        title={
          bracketMode === 'clear'
            ? `Clear the ${bracketTarget?.name} bracket?`
            : `Generate the ${bracketTarget?.name} bracket?`
        }
        message={
          bracketMode === 'clear'
            ? 'Every match and result for this sport will be permanently deleted, and registration will reopen.'
            : 'Teams will be seeded randomly, the full match tree created, and registration closed. You need at least two teams.'
        }
        confirmLabel={bracketMode === 'clear' ? 'Clear bracket' : 'Generate bracket'}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={runDelete}
        loading={deleteBusy}
        title={`Delete ${deleteTarget?.name || 'this sport'}?`}
        message="This removes the sport, all its teams, matches, and results. This cannot be undone."
        confirmLabel="Delete sport"
      />
    </div>
  );
}
