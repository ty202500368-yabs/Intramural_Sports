import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage } from '../../lib/api';
import {
  ConfirmDialog,
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  SportMark,
  TeamCrest,
} from '../../components/ui';
import TeamDetailModal from '../../components/TeamDetailModal';
import TeamFormModal from '../../components/TeamFormModal';

export default function AdminTeams() {
  const { notify } = useToast();
  const teamsState = useFetch('/teams');
  const sportsState = useFetch('/sports');

  const [query, setQuery] = useState('');
  const [sportId, setSportId] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const teams = teamsState.data ?? [];
  const sports = sportsState.data ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return teams
      .filter((team) => {
        if (sportId !== 'all' && String(team.sport_id) !== sportId) return false;
        if (!needle) return true;
        return [team.name, team.sport_name, team.captain_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const sport = (a.sport_name || '').localeCompare(b.sport_name || '');
        return sport || a.name.localeCompare(b.name);
      });
  }, [teams, query, sportId]);

  const playerCount = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
  const sportsWithTeams = new Set(teams.map((team) => team.sport_id)).size;

  const reloadAll = () => {
    teamsState.reload();
    sportsState.reload();
  };

  const startEdit = (team) => {
    setSelectedTeam(null);
    setEditingTeam(team);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teams/${deleteTarget.id}`);
      notify(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
      setSelectedTeam(null);
      reloadAll();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const error = teamsState.error || sportsState.error;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin control room"
        title="Team management"
        subtitle="Every captain, roster, and entry in the season — all in one desk."
        actions={
          <Link to="/admin/sports" className="btn btn--ghost">
            <Trophy size={16} /> Sports &amp; brackets
          </Link>
        }
      />

      <div className="admin-summary">
        <div className="admin-summary__item">
          <ShieldCheck size={18} />
          <span>
            <strong>{teams.length}</strong> teams registered
          </span>
        </div>
        <div className="admin-summary__item">
          <Users size={18} />
          <span>
            <strong>{playerCount}</strong> players on rosters
          </span>
        </div>
        <div className="admin-summary__item">
          <Trophy size={18} />
          <span>
            <strong>{sportsWithTeams}</strong> sports represented
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
            placeholder="Search teams or captains…"
            aria-label="Search teams"
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
        <span className="toolbar__count">
          {filtered.length} team{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={reloadAll} />
      ) : teamsState.loading && !teamsState.data ? (
        <LoadingPanel label="Loading the team desk…" />
      ) : filtered.length ? (
        <section className="panel panel--flush">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Sport</th>
                  <th>Captain</th>
                  <th className="num">Players</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <div className="table-team">
                        <TeamCrest name={team.name} size="sm" />
                        <strong>{team.name}</strong>
                      </div>
                    </td>
                    <td>
                      <Link to={`/sports/${team.sport_id}`} className="table-sport-link">
                        <SportMark name={team.sport_name} size="xs" />
                        {team.sport_name}
                      </Link>
                    </td>
                    <td>{team.captain_name || <span className="table-note">Unassigned</span>}</td>
                    <td className="num">{team.members?.length || 0}</td>
                    <td className="actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title="View roster"
                          aria-label={`View ${team.name} roster`}
                          onClick={() => setSelectedTeam(team)}
                        >
                          <Users size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Edit team"
                          aria-label={`Edit ${team.name}`}
                          onClick={() => startEdit(team)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          title="Delete team"
                          aria-label={`Delete ${team.name}`}
                          onClick={() => setDeleteTarget(team)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Users}
          title={teams.length ? 'No teams match those filters' : 'No teams registered'}
          description={
            teams.length
              ? 'Try a different sport or search term.'
              : 'Students will appear here as they register their squads.'
          }
          action={
            teams.length ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setQuery('');
                  setSportId('all');
                }}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      )}

      <p className="page-note">
        <ArrowUpRight size={14} /> Need to see a sport page? Use the sport link in the table.
        Deleting a team can affect scheduled matches — the server will handle brackets.
      </p>

      <TeamDetailModal
        open={Boolean(selectedTeam)}
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        canManage
        onEdit={() => startEdit(selectedTeam)}
        onDelete={() => setDeleteTarget(selectedTeam)}
      />

      <TeamFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sports={sports}
        team={editingTeam}
        onSaved={reloadAll}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={`Delete ${deleteTarget?.name || 'this team'}?`}
        message={`This removes ${deleteTarget?.name || 'the team'} from ${deleteTarget?.sport_name || 'the sport'}. Any scheduled matches involving them may become incomplete.`}
        confirmLabel="Delete team"
      />
    </div>
  );
}
