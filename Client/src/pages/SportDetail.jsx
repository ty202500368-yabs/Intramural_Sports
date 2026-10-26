import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Plus,
  Settings2,
  Shield,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { api, errorMessage } from '../lib/api';
import { FORMATS } from '../lib/sports';
import { matchSort, withRoundTotals } from '../lib/format';
import {
  ConfirmDialog,
  EmptyState,
  ErrorPanel,
  FormatBadge,
  LoadingPanel,
  PageHeader,
  SportMark,
  TeamCrest,
} from '../components/ui';
import MatchRow from '../components/MatchRow';
import StandingsTable from '../components/StandingsTable';
import BracketView from '../components/BracketView';
import TeamFormModal from '../components/TeamFormModal';
import TeamDetailModal from '../components/TeamDetailModal';

export default function SportDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { notify } = useToast();

  const sportsState = useFetch('/sports');
  const matchesState = useFetch(`/matches?sport_id=${id}`);
  const teamsState = useFetch(`/teams?sport_id=${id}`);
  const standingsState = useFetch(`/sports/${id}/standings`);

  const [tab, setTab] = useState('schedule');
  const [bracketAction, setBracketAction] = useState(null);
  const [bracketBusy, setBracketBusy] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const sport = useMemo(
    () => (sportsState.data ?? []).find((item) => String(item.id) === String(id)),
    [sportsState.data, id],
  );
  const matches = useMemo(
    () => withRoundTotals([...(matchesState.data ?? [])].sort(matchSort)),
    [matchesState.data],
  );
  const teams = teamsState.data ?? [];
  const standings = standingsState.data ?? [];
  const registrationOpen = sport ? Number(sport.match_count) === 0 : false;

  const tabs = [
    { id: 'schedule', label: 'Schedule', count: matches.length },
    { id: 'standings', label: 'Standings' },
    ...(sport?.format === 'single_elimination'
      ? [{ id: 'bracket', label: 'Bracket' }]
      : []),
    { id: 'teams', label: 'Teams', count: teams.length },
  ];

  const reloadSport = () => {
    sportsState.reload();
    matchesState.reload();
    teamsState.reload();
    standingsState.reload();
  };

  const askGenerate = () => {
    if (Number(sport?.team_count) < 2) {
      notify('At least two teams must be registered before generating a bracket.', 'error');
      return;
    }
    setBracketAction('generate');
  };

  const runBracketAction = async () => {
    if (!bracketAction) return;
    setBracketBusy(true);
    try {
      if (bracketAction === 'generate') {
        await api.post(`/sports/${id}/bracket`);
        notify('Bracket generated. Let the games begin!');
        setTab('bracket');
      } else {
        await api.delete(`/sports/${id}/bracket`);
        notify('Bracket cleared. Registration is open again.');
      }
      setBracketAction(null);
      reloadSport();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBracketBusy(false);
    }
  };

  const deleteTeam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teams/${deleteTarget.id}`);
      notify('Team removed.');
      setDeleteTarget(null);
      setSelectedTeam(null);
      reloadSport();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (sportsState.error) {
    return (
      <div className="page-stack">
        <ErrorPanel error={sportsState.error} onRetry={sportsState.reload} />
      </div>
    );
  }

  if (sportsState.loading && !sportsState.data) {
    return (
      <div className="page-stack">
        <LoadingPanel label="Opening the sport…" />
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Sports"
          title="Sport not found"
          subtitle="That sport may have been removed from the season."
          actions={
            <Link to="/sports" className="btn btn--primary">
              Browse sports
            </Link>
          }
        />
        <EmptyState
          icon={Trophy}
          title="Nothing in this arena"
          description="Head back to the sports list to find your next game."
        />
      </div>
    );
  }

  const canManageTeam = (team) => isAdmin || team.captain_id === user?.id;

  return (
    <div className="page-stack">
      <Link to="/sports" className="back-link">
        <ArrowLeft size={15} /> All sports
      </Link>

      <section className="detail-hero">
        <div className="detail-hero__main">
          <SportMark name={sport.name} size="xl" />
          <div className="detail-hero__copy">
            <div className="detail-hero__eyebrow">
              <FormatBadge format={sport.format} />
              <span
                className={`pill ${
                  registrationOpen ? 'pill--open' : 'pill--closed'
                }`}
              >
                <span className="status-dot" />
                {registrationOpen ? 'Registration open' : 'Registration closed'}
              </span>
            </div>
            <h1>{sport.name}</h1>
            <p>{sport.description || 'Campus competition, season-long glory.'}</p>
          </div>
        </div>

        <div className="detail-hero__stats">
          <div className="detail-stat">
            <span>Teams</span>
            <strong>{Number(sport.team_count)}</strong>
          </div>
          <div className="detail-stat">
            <span>Fixtures</span>
            <strong>{Number(sport.match_count)}</strong>
          </div>
          <div className="detail-stat">
            <span>Format</span>
            <strong className="detail-stat__text">
              {FORMATS[sport.format] || 'Tournament'}
            </strong>
          </div>
        </div>

        <div className="detail-hero__actions">
          {isAdmin ? (
            <>
              <Link to={`/admin/matches?sport=${sport.id}`} className="btn btn--ghost">
                <Settings2 size={16} /> Manage matches
              </Link>
              {registrationOpen ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={askGenerate}
                >
                  <Wand2 size={16} /> Generate bracket
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--danger-soft"
                  onClick={() => setBracketAction('clear')}
                >
                  Clear bracket
                </button>
              )}
            </>
          ) : registrationOpen ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setEditingTeam(null);
                setTeamFormOpen(true);
              }}
            >
              <Plus size={16} /> Register a team
            </button>
          ) : (
            <Link to="/schedule" className="btn btn--ghost">
              View schedule <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </section>

      <div className="tab-bar">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.count !== undefined && <span>{item.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'schedule' && (
        <section className="panel panel--flush">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Fixtures &amp; results</p>
              <h2>Match schedule</h2>
            </div>
            <span className="panel__meta">
              {matches.length
                ? `${matches.length} match${matches.length === 1 ? '' : 'es'}`
                : 'No matches yet'}
            </span>
          </div>
          {matchesState.error ? (
            <div className="panel__inner">
              <ErrorPanel error={matchesState.error} onRetry={matchesState.reload} />
            </div>
          ) : matchesState.loading && !matchesState.data ? (
            <LoadingPanel label="Loading matches…" />
          ) : matches.length ? (
            <div className="match-list">
              {matches.map((match) => (
                <MatchRow key={match.id} match={match} showSport={false} />
              ))}
            </div>
          ) : (
            <div className="panel__inner">
              <EmptyState
                icon={CalendarDays}
                title="No fixtures have been drawn"
                description={
                  isAdmin
                    ? 'Generate the bracket to create matches, then schedule them from match control.'
                    : 'The intramurals office will publish the schedule soon.'
                }
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={askGenerate}
                      disabled={Number(sport.team_count) < 2}
                    >
                      <Wand2 size={15} /> Generate bracket
                    </button>
                  ) : null
                }
              />
            </div>
          )}
        </section>
      )}

      {tab === 'standings' && (
        <section className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">{FORMATS[sport.format]}</p>
              <h2>League table</h2>
            </div>
            <span className="panel__meta">3 pts win · 1 pt draw</span>
          </div>
          <div className="panel__inner">
            {standingsState.error ? (
              <ErrorPanel error={standingsState.error} onRetry={standingsState.reload} />
            ) : standingsState.loading && !standingsState.data ? (
              <LoadingPanel label="Updating standings…" />
            ) : (
              <StandingsTable rows={standings} />
            )}
          </div>
        </section>
      )}

      {tab === 'bracket' && sport.format === 'single_elimination' && (
        <section className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Road to the trophy</p>
              <h2>Knockout bracket</h2>
            </div>
            {isAdmin && matches.length > 0 && (
              <Link to={`/admin/matches?sport=${sport.id}`} className="link-arrow">
                Manage matches <ChevronRight size={15} />
              </Link>
            )}
          </div>
          <div className="panel__inner">
            {matches.length ? (
              <BracketView matches={[...(matchesState.data ?? [])]} />
            ) : (
              <EmptyState
                icon={Trophy}
                title="The bracket is empty"
                description={
                  isAdmin
                    ? 'Once at least two teams are registered, generate the bracket to start the tournament.'
                    : 'Check back after registration closes.'
                }
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={askGenerate}
                      disabled={Number(sport.team_count) < 2}
                    >
                      <Wand2 size={15} /> Generate bracket
                    </button>
                  ) : null
                }
              />
            )}
          </div>
        </section>
      )}

      {tab === 'teams' && (
        <>
          <div className="split-head">
            <div>
              <p className="eyebrow">The contenders</p>
              <h2>{Number(sport.team_count)} registered teams</h2>
            </div>
            {!isAdmin && registrationOpen && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setEditingTeam(null);
                  setTeamFormOpen(true);
                }}
              >
                <Plus size={15} /> Register a team
              </button>
            )}
          </div>

          {teamsState.error ? (
            <ErrorPanel error={teamsState.error} onRetry={teamsState.reload} />
          ) : teamsState.loading && !teamsState.data ? (
            <LoadingPanel label="Loading teams…" />
          ) : teams.length ? (
            <div className="team-grid">
              {teams.map((team) => (
                <button
                  type="button"
                  className="team-card"
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="team-card__top">
                    <TeamCrest name={team.name} />
                    <span className="team-card__sport">
                      <Shield size={13} /> {team.captain_name || 'No captain'}
                    </span>
                    <ChevronRight className="team-card__chev" size={17} />
                  </div>
                  <h3>{team.name}</h3>
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
              title="No teams registered"
              description="Captains can register while registration is open."
            />
          )}
        </>
      )}

      <TeamFormModal
        open={teamFormOpen}
        onClose={() => setTeamFormOpen(false)}
        sports={sportsState.data ?? []}
        team={editingTeam}
        defaultSportId={sport.id}
        onSaved={reloadSport}
      />

      <TeamDetailModal
        open={Boolean(selectedTeam)}
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        canManage={Boolean(selectedTeam && canManageTeam(selectedTeam))}
        onEdit={() => {
          setEditingTeam(selectedTeam);
          setSelectedTeam(null);
          setTeamFormOpen(true);
        }}
        onDelete={() => setDeleteTarget(selectedTeam)}
      />

      <ConfirmDialog
        open={Boolean(bracketAction)}
        onClose={() => setBracketAction(null)}
        onConfirm={runBracketAction}
        loading={bracketBusy}
        tone={bracketAction === 'clear' ? 'danger' : 'primary'}
        title={bracketAction === 'clear' ? 'Clear this bracket?' : 'Generate the bracket?'}
        message={
          bracketAction === 'clear'
            ? 'All matches and recorded results for this sport will be deleted. Registration will reopen.'
            : 'Teams will be seeded randomly and the full match tree will be created. Registration will close for this sport.'
        }
        confirmLabel={bracketAction === 'clear' ? 'Clear bracket' : 'Generate bracket'}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteTeam}
        loading={deleting}
        title="Remove this team?"
        message={`${deleteTarget?.name || 'This team'} will be removed from ${sport.name}. Scheduled matches may be affected.`}
        confirmLabel="Remove team"
      />
    </div>
  );
}
