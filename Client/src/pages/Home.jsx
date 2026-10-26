import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck2,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  Plus,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import {
  firstName,
  formatDateTime,
  formatRound,
  formatTime,
  matchSort,
  toDate,
  withRoundTotals,
} from '../lib/format';
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  SectionHeader,
  SportMark,
  StatCard,
  StatusBadge,
} from '../components/ui';
import MatchRow from '../components/MatchRow';
import SportCard from '../components/SportCard';
import TeamFormModal from '../components/TeamFormModal';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function ResultMini({ match }) {
  const winnerA = match.winner_id === match.team_a_id;
  return (
    <Link to={`/sports/${match.sport_id}`} className="result-mini">
      <div className="result-mini__top">
        <span>
          <SportMark name={match.sport_name} size="xs" /> {match.sport_name}
        </span>
        <span>{formatTime(match.scheduled_at)}</span>
      </div>
      <div className={`result-mini__row${match.winner_id ? (winnerA ? ' is-winner' : '') : ''}`}>
        <span>{match.team_a}</span>
        <strong>{match.score_a}</strong>
      </div>
      <div className={`result-mini__row${match.winner_id ? (!winnerA ? ' is-winner' : '') : ''}`}>
        <span>{match.team_b}</span>
        <strong>{match.score_b}</strong>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, isAdmin } = useAuth();
  const sportsState = useFetch('/sports');
  const matchesState = useFetch('/matches');
  const mineState = useFetch('/teams/mine');
  const [teamModal, setTeamModal] = useState(false);

  const sports = sportsState.data ?? [];
  const matches = useMemo(
    () => withRoundTotals(matchesState.data ?? []),
    [matchesState.data],
  );
  const myTeams = mineState.data ?? [];

  const { upcoming, nextMatch, recent, totals } = useMemo(() => {
    const pending = matches
      .filter((match) => match.status !== 'completed')
      .sort(matchSort);
    const completed = matches
      .filter((match) => match.status === 'completed')
      .sort((a, b) => (toDate(b.scheduled_at)?.getTime() ?? 0) - (toDate(a.scheduled_at)?.getTime() ?? 0));

    return {
      upcoming: pending.slice(0, 4),
      nextMatch: matches.find((match) => match.status === 'ongoing') || pending[0],
      recent: completed.slice(0, 3),
      totals: {
        sports: sports.length,
        teams: sports.reduce((sum, sport) => sum + Number(sport.team_count || 0), 0),
        pending: matches.filter((match) => match.status !== 'completed').length,
        completed: completed.length,
      },
    };
  }, [matches, sports]);

  const error = sportsState.error || matchesState.error;

  const reloadAll = () => {
    sportsState.reload();
    matchesState.reload();
    mineState.reload();
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`Season 2026 · ${new Date().toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
        })}`}
        title={`${greeting()}, ${firstName(user?.full_name)}.`}
        subtitle="Here's the pulse of intramural sports across campus."
        actions={
          isAdmin ? (
            <>
              <Link to="/admin/matches" className="btn btn--ghost">
                Manage matches
              </Link>
              <Link to="/admin" className="btn btn--primary">
                <ShieldCheck size={16} /> Control room
              </Link>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => setTeamModal(true)}>
              <Plus size={16} /> Register a team
            </button>
          )
        }
      />

      {error && <ErrorPanel error={error} onRetry={reloadAll} />}

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow eyebrow--lime">The season is live</p>
          <h2>
            Campus rivalries.
            <br />
            <span>One season long.</span>
          </h2>
          <p>
            From the hardcourt to the board room, every game, result, and bracket
            update lives right here.
          </p>
          <div className="home-hero__actions">
            <Link to="/sports" className="btn btn--lime">
              Explore sports <ArrowRight size={16} />
            </Link>
            <Link to="/schedule" className="btn btn--outline-light">
              Full schedule
            </Link>
          </div>
        </div>

        <div className="home-hero__panel">
          <div className="hero-panel__head">
            <span className="hero-panel__label">
              <Flame size={14} /> {nextMatch?.status === 'ongoing' ? 'Live right now' : 'Next up'}
            </span>
            {nextMatch && <StatusBadge status={nextMatch.status} />}
          </div>

          {matchesState.loading && !matchesState.data ? (
            <LoadingPanel label="Finding the next fixture…" />
          ) : nextMatch ? (
            <div className="hero-fixture">
              <div className="hero-fixture__meta">
                <span>
                  <SportMark name={nextMatch.sport_name} size="xs" /> {nextMatch.sport_name}
                </span>
                <span>{formatRound(nextMatch)}</span>
              </div>

              <div className="hero-fixture__teams">
                <div className="hero-fixture__team">
                  <span>{nextMatch.team_a || 'Winner TBD'}</span>
                  {nextMatch.status === 'completed' && <strong>{nextMatch.score_a}</strong>}
                </div>
                <div className="hero-fixture__vs">VS</div>
                <div className="hero-fixture__team hero-fixture__team--right">
                  <span>{nextMatch.team_b || 'Winner TBD'}</span>
                  {nextMatch.status === 'completed' && <strong>{nextMatch.score_b}</strong>}
                </div>
              </div>

              <div className="hero-fixture__foot">
                <span>
                  <Clock size={13} />
                  {nextMatch.scheduled_at
                    ? formatDateTime(nextMatch.scheduled_at)
                    : 'Schedule to be announced'}
                </span>
                <span>
                  <MapPin size={13} />
                  {nextMatch.venue || 'Venue TBD'}
                </span>
              </div>

              <Link to="/schedule" className="hero-fixture__link">
                See all fixtures <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="hero-empty">
              <Trophy size={28} />
              <h3>The stage is set</h3>
              <p>
                No fixtures on the board just yet. Head to a sport to see who is lining up.
              </p>
              <Link to="/sports" className="btn btn--outline-light btn--sm">
                Browse sports
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Sports"
          value={totals.sports}
          hint="On the season calendar"
          icon={Trophy}
          tone="lime"
          to="/sports"
        />
        <StatCard
          label="Registered teams"
          value={totals.teams}
          hint="Across every sport"
          icon={Users}
          tone="cream"
          to="/teams"
        />
        <StatCard
          label="Games to play"
          value={totals.pending}
          hint="Scheduled and live"
          icon={CalendarCheck2}
          tone="cream"
          to="/schedule"
        />
        <StatCard
          label="Results in"
          value={totals.completed}
          hint="Brackets taking shape"
          icon={Trophy}
          tone="cream"
          to="/standings"
        />
      </div>

      <div className="home-grid">
        <section className="panel">
          <SectionHeader
            eyebrow="On the calendar"
            title="Upcoming fixtures"
            action={
              <Link to="/schedule" className="link-arrow">
                Full schedule <ChevronRight size={15} />
              </Link>
            }
          />
          {matchesState.loading && !matchesState.data ? (
            <LoadingPanel />
          ) : upcoming.length ? (
            <div className="fixture-list">
              {upcoming.map((match) => (
                <MatchRow key={match.id} match={match} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No games on deck"
              description="Fixtures will appear here once an admin generates a schedule."
              icon={CalendarCheck2}
            />
          )}
        </section>

        <aside className="home-side">
          <section className="panel panel--tight">
            <SectionHeader
              eyebrow="Your sideline"
              title="My teams"
              action={
                <Link to="/teams" className="link-arrow">
                  All teams <ChevronRight size={15} />
                </Link>
              }
            />
            {mineState.loading && !mineState.data ? (
              <LoadingPanel label="Loading your teams…" />
            ) : myTeams.length ? (
              <div className="my-team-list">
                {myTeams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams?team=${team.id}`}
                    className="my-team"
                  >
                    <SportMark name={team.sport_name} size="sm" />
                    <div>
                      <strong>{team.name}</strong>
                      <span>
                        {team.sport_name} · {team.members?.length || 0} players
                      </span>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="my-teams-empty">
                <p>You are not captaining a team yet. Rally the squad and get on the board.</p>
                {!isAdmin && (
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => setTeamModal(true)}
                  >
                    <Plus size={15} /> Start a team
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="panel panel--tight">
            <SectionHeader
              eyebrow="Latest scores"
              title="Recent results"
              action={
                <Link to="/standings" className="link-arrow">
                  Standings <ChevronRight size={15} />
                </Link>
              }
            />
            {recent.length ? (
              <div className="result-list">
                {recent.map((match) => (
                  <ResultMini key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                compact
                title="No final scores yet"
                description="Results land here as soon as matches wrap up."
              />
            )}
          </section>
        </aside>
      </div>

      <section>
        <SectionHeader
          eyebrow="Pick your arena"
          title="Sports on campus"
          action={
            <Link to="/sports" className="link-arrow">
              View all sports <ChevronRight size={15} />
            </Link>
          }
        />
        <div className="sport-grid sport-grid--home">
          {sports.slice(0, 4).map((sport) => (
            <SportCard key={sport.id} sport={sport} />
          ))}
        </div>
      </section>

      {!isAdmin && (
        <TeamFormModal
          open={teamModal}
          onClose={() => setTeamModal(false)}
          sports={sports}
          onSaved={() => {
            sportsState.reload();
            mineState.reload();
          }}
        />
      )}
    </div>
  );
}
