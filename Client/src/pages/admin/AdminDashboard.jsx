import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  CalendarClock,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { dayBadge, firstName, formatTime } from '../../lib/format';
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  SportMark,
  StatCard,
} from '../../components/ui';

function UpcomingRow({ match }) {
  const badge = dayBadge(match.scheduled_at);
  return (
    <Link to="/admin/matches" className="dash-fixture">
      <div className="dash-fixture__date">
        <span>{badge.weekday}</span>
        <strong>{badge.day}</strong>
        <span>{badge.month}</span>
      </div>
      <div className="dash-fixture__body">
        <span className="dash-fixture__sport">
          <SportMark name={match.sport_name} size="xs" /> {match.sport_name}
        </span>
        <strong>
          {match.team_a || 'TBD'} <em>vs</em> {match.team_b || 'TBD'}
        </strong>
        <span className="dash-fixture__place">
          <MapPin size={12} /> {match.venue || 'Venue TBD'}
        </span>
      </div>
      <span className="dash-fixture__time">{formatTime(match.scheduled_at)}</span>
    </Link>
  );
}

function RecentRow({ result }) {
  const aWon = result.score_a > result.score_b;
  const bWon = result.score_b > result.score_a;
  return (
    <div className="dash-result">
      <div className="dash-result__meta">
        <span>
          <SportMark name={result.sport_name} size="xs" /> {result.sport_name}
        </span>
        <span>Final</span>
      </div>
      <div className={`dash-result__team${aWon ? ' is-winner' : ''}`}>
        <span>{result.team_a}</span>
        <strong>{result.score_a}</strong>
      </div>
      <div className={`dash-result__team${bWon ? ' is-winner' : ''}`}>
        <span>{result.team_b}</span>
        <strong>{result.score_b}</strong>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/admin/dashboard');
  const counts = data?.counts;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin control room"
        title={`Season command centre`}
        subtitle={`Keep the schedule moving, ${firstName(user?.full_name)}. Here's the state of play.`}
        actions={
          <>
            <Link to="/admin/sports" className="btn btn--ghost">
              <Trophy size={16} /> Sports &amp; brackets
            </Link>
            <Link to="/admin/matches" className="btn btn--primary">
              <CalendarClock size={16} /> Match control
            </Link>
          </>
        }
      />

      {error ? (
        <ErrorPanel error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingPanel label="Reading the season…" />
      ) : (
        <>
          <div className="stat-grid stat-grid--admin">
            <StatCard
              label="Students"
              value={counts?.students ?? 0}
              hint="Registered accounts"
              icon={Users}
              tone="cream"
            />
            <StatCard
              label="Sports"
              value={counts?.sports ?? 0}
              hint="Active disciplines"
              icon={Trophy}
              tone="lime"
              to="/admin/sports"
            />
            <StatCard
              label="Teams"
              value={counts?.teams ?? 0}
              hint="On the roster"
              icon={ShieldCheck}
              tone="cream"
              to="/admin/teams"
            />
            <StatCard
              label="Scheduled"
              value={counts?.scheduled ?? 0}
              hint="Awaiting play"
              icon={Calendar}
              tone="cream"
              to="/admin/matches"
            />
            <StatCard
              label="Live"
              value={counts?.ongoing ?? 0}
              hint="On the court now"
              icon={Sparkles}
              tone="orange"
              to="/admin/matches"
            />
            <StatCard
              label="Completed"
              value={counts?.completed ?? 0}
              hint="Results recorded"
              icon={ClipboardList}
              tone="cream"
              to="/admin/matches"
            />
          </div>

          <div className="admin-grid">
            <section className="panel">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Next on the clock</p>
                  <h2>Upcoming fixtures</h2>
                </div>
                <Link to="/admin/matches" className="link-arrow">
                  Manage <ArrowUpRight size={15} />
                </Link>
              </div>
              {data?.upcoming?.length ? (
                <div className="dash-list">
                  {data.upcoming.map((match) => (
                    <UpcomingRow key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="panel__inner">
                  <EmptyState
                    compact
                    icon={CalendarClock}
                    title="No fixtures waiting"
                    description="Generate a bracket or schedule the next round."
                  />
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Fresh from the court</p>
                  <h2>Latest results</h2>
                </div>
                <Link to="/standings" className="link-arrow">
                  Standings <ArrowUpRight size={15} />
                </Link>
              </div>
              {data?.recent?.length ? (
                <div className="dash-list">
                  {data.recent.map((result) => (
                    <RecentRow key={result.id} result={result} />
                  ))}
                </div>
              ) : (
                <div className="panel__inner">
                  <EmptyState
                    compact
                    icon={Trophy}
                    title="No results recorded"
                    description="Completed matches will show up here."
                  />
                </div>
              )}
            </section>

            <aside className="panel admin-quick">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Shortcuts</p>
                  <h2>Run the season</h2>
                </div>
              </div>
              <div className="quick-actions">
                <Link to="/admin/sports" className="quick-action">
                  <span className="quick-action__icon quick-action__icon--lime">
                    <Trophy size={19} />
                  </span>
                  <div>
                    <strong>Build brackets</strong>
                    <span>Create events and generate match trees.</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
                <Link to="/admin/matches" className="quick-action">
                  <span className="quick-action__icon">
                    <CalendarClock size={19} />
                  </span>
                  <div>
                    <strong>Schedule &amp; score</strong>
                    <span>Set venues, start games, record results.</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
                <Link to="/admin/teams" className="quick-action">
                  <span className="quick-action__icon">
                    <Users size={19} />
                  </span>
                  <div>
                    <strong>Team desk</strong>
                    <span>Review rosters and manage entries.</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <p className="admin-quick__foot">
                <ShieldCheck size={14} /> Changes are live for every student immediately.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
