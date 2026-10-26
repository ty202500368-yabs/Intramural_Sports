import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Plus,
  Search,
  Settings2,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { api, errorMessage } from '../lib/api';
import {
  ConfirmDialog,
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  SportMark,
  TeamCrest,
} from '../components/ui';
import TeamDetailModal from '../components/TeamDetailModal';
import TeamFormModal from '../components/TeamFormModal';

export default function Teams() {
  const { user, isAdmin } = useAuth();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const allState = useFetch('/teams');
  const mineState = useFetch('/teams/mine');
  const sportsState = useFetch('/sports');

  const [tab, setTab] = useState(searchParams.get('tab') === 'mine' ? 'mine' : 'all');
  const [query, setQuery] = useState('');
  const [sportId, setSportId] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const allTeams = allState.data ?? [];
  const myTeams = mineState.data ?? [];
  const sports = sportsState.data ?? [];

  useEffect(() => {
    const teamParam = searchParams.get('team');
    if (!teamParam) return;
    const found = [...allTeams, ...myTeams].find((team) => String(team.id) === teamParam);
    if (found) setSelectedTeam(found);
  }, [searchParams, allTeams, myTeams]);

  const source = tab === 'mine' ? myTeams : allTeams;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return source
      .filter((team) => {
        if (sportId !== 'all' && String(team.sport_id) !== sportId) return false;
        if (!needle) return true;
        return [team.name, team.sport_name, team.captain_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const sportCompare = (a.sport_name || '').localeCompare(b.sport_name || '');
        return sportCompare || a.name.localeCompare(b.name);
      });
  }, [source, query, sportId]);

  const activeState = tab === 'mine' ? mineState : allState;
  const error = activeState.error || sportsState.error;

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (nextTab === 'mine') next.set('tab', 'mine');
        else next.delete('tab');
        return next;
      },
      { replace: true },
    );
  };

  const reloadTeams = () => {
    allState.reload();
    mineState.reload();
  };

  const openTeam = (team) => {
    setSelectedTeam(team);
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.set('team', team.id);
        return next;
      },
      { replace: true },
    );
  };

  const closeTeam = () => {
    setSelectedTeam(null);
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.delete('team');
        return next;
      },
      { replace: true },
    );
  };

  const startCreate = () => {
    setEditingTeam(null);
    setTeamFormOpen(true);
  };

  const startEdit = () => {
    setEditingTeam(selectedTeam);
    closeTeam();
    setTeamFormOpen(true);
  };

  const startDelete = () => {
    setDeleteTarget(selectedTeam);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teams/${deleteTarget.id}`);
      notify('Team removed from the season.');
      setDeleteTarget(null);
      closeTeam();
      reloadTeams();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const canManageSelected =
    selectedTeam && (isAdmin || selectedTeam.captain_id === user?.id);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Season 2026"
        title="Teams"
        subtitle="Meet the squads chasing the trophy — and keep your own roster match-ready."
        actions={
          isAdmin ? (
            <Link to="/admin/teams" className="btn btn--primary">
              <Settings2 size={16} /> Manage teams
            </Link>
          ) : (
            <button type="button" className="btn btn--primary" onClick={startCreate}>
              <Plus size={16} /> Register a team
            </button>
          )
        }
      />

      <div className="tab-bar">
        <button
          type="button"
          className={`tab${tab === 'all' ? ' is-active' : ''}`}
          onClick={() => changeTab('all')}
        >
          All teams <span>{allTeams.length}</span>
        </button>
        <button
          type="button"
          className={`tab${tab === 'mine' ? ' is-active' : ''}`}
          onClick={() => changeTab('mine')}
        >
          My teams <span>{myTeams.length}</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              tab === 'mine' ? 'Search your teams…' : 'Search teams or captains…'
            }
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
        <ErrorPanel error={error} onRetry={reloadTeams} />
      ) : activeState.loading && !activeState.data ? (
        <LoadingPanel label="Loading teams…" />
      ) : filtered.length ? (
        <div className="team-grid">
          {filtered.map((team) => (
            <button
              type="button"
              className="team-card"
              key={team.id}
              onClick={() => openTeam(team)}
            >
              <div className="team-card__top">
                <TeamCrest name={team.name} />
                <span className="team-card__sport">
                  <SportMark name={team.sport_name} size="xs" /> {team.sport_name}
                </span>
                <ChevronRight className="team-card__chev" size={17} />
              </div>
              <h3>{team.name}</h3>
              <p className="team-card__captain">
                <Shield size={13} />
                {team.captain_name || 'Captain unassigned'}
              </p>
              <div className="team-card__foot">
                <span>
                  <Users size={14} /> {team.members?.length || 0} players
                </span>
                <span className="team-card__view">View roster</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={tab === 'mine' ? 'No teams on your sideline' : 'No teams registered yet'}
          description={
            tab === 'mine'
              ? 'Captains can register a squad for any sport while registration is open.'
              : 'Teams will appear here as soon as captains sign them up.'
          }
          action={
            tab === 'mine' && !isAdmin ? (
              <button type="button" className="btn btn--primary btn--sm" onClick={startCreate}>
                <Plus size={15} /> Register your team
              </button>
            ) : null
          }
        />
      )}

      {!isAdmin && (
        <p className="page-note">
          <Shield size={14} /> Team registration closes when an admin generates the bracket for
          that sport.
        </p>
      )}

      <TeamDetailModal
        open={Boolean(selectedTeam)}
        team={selectedTeam}
        onClose={closeTeam}
        canManage={Boolean(canManageSelected)}
        onEdit={startEdit}
        onDelete={startDelete}
      />

      <TeamFormModal
        open={teamFormOpen}
        onClose={() => setTeamFormOpen(false)}
        sports={sports}
        team={editingTeam}
        onSaved={() => reloadTeams()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove this team?"
        message={`${deleteTarget?.name || 'This team'} will be removed from ${deleteTarget?.sport_name || 'the sport'}. Scheduled matches may be affected.`}
        confirmLabel="Remove team"
      />
    </div>
  );
}
