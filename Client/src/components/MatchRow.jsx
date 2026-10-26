import { Clock, MapPin } from 'lucide-react';
import { dayBadge, formatRound, formatTime, toDate } from '../lib/format';
import { SportMark, StatusBadge } from './ui';

export default function MatchRow({ match, showSport = true, action = null, compact = false }) {
  const badge = dayBadge(match.scheduled_at);
  const completed = match.status === 'completed';
  const bothTeams = Boolean(match.team_a && match.team_b);
  const hasScore = completed && match.score_a !== null && match.score_b !== null;
  const teamAWon = completed && match.winner_id === match.team_a_id;
  const teamBWon = completed && match.winner_id === match.team_b_id;

  return (
    <article className={`match-row${compact ? ' match-row--compact' : ''}`}>
      <div className="match-date">
        <span>{badge.weekday}</span>
        <strong>{badge.day}</strong>
        <span>{badge.month}</span>
      </div>

      <div className="match-row__body">
        <div className="match-row__meta">
          {showSport && (
            <span className="match-row__sport">
              <SportMark name={match.sport_name} size="xs" />
              {match.sport_name}
            </span>
          )}
          <span className="match-row__round">{formatRound(match)}</span>
        </div>

        <div className="match-teams">
          <div
            className={`match-team${teamAWon ? ' is-winner' : ''}${
              !match.team_a ? ' is-tbd' : ''
            }`}
          >
            <span className="match-team__name">{match.team_a || 'Winner TBD'}</span>
            {hasScore && <span className="match-team__score">{match.score_a}</span>}
          </div>
          <div
            className={`match-team${teamBWon ? ' is-winner' : ''}${
              !match.team_b ? ' is-tbd' : ''
            }`}
          >
            <span className="match-team__name">{match.team_b || 'Winner TBD'}</span>
            {hasScore && <span className="match-team__score">{match.score_b}</span>}
          </div>
        </div>

        <div className="match-row__sub">
          <span>
            <Clock size={13} />
            {!toDate(match.scheduled_at)
              ? 'Time to be announced'
              : completed
                ? `Played ${formatTime(match.scheduled_at)}`
                : formatTime(match.scheduled_at)}
          </span>
          <span>
            <MapPin size={13} />
            {match.venue || 'Venue TBD'}
          </span>
          {!bothTeams && <span className="match-row__note">Teams not yet decided</span>}
        </div>
      </div>

      <div className="match-row__aside">
        <StatusBadge status={match.status} />
        {action}
      </div>
    </article>
  );
}
