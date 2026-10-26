import { Trophy } from 'lucide-react';
import { dayBadge, formatTime } from '../lib/format';
import { StatusBadge } from './ui';

function roundLabel(round, total) {
  if (round === total) return 'Final';
  if (round === total - 1) return 'Semifinals';
  if (round === total - 2) return 'Quarterfinals';
  return `Round ${round}`;
}

function BracketTeam({ name, score, winner, tbd }) {
  return (
    <div
      className={`bracket-team${winner ? ' is-winner' : ''}${tbd ? ' is-tbd' : ''}`}
    >
      <span>{name || 'TBD'}</span>
      <span className="bracket-team__score">{score ?? ''}</span>
    </div>
  );
}

export default function BracketView({ matches = [] }) {
  if (!matches.length) return null;

  const total = Math.max(...matches.map((match) => Number(match.round)));
  const rounds = Array.from({ length: total }, (_, index) => index + 1);
  const final = matches.find((match) => Number(match.round) === total);
  const champion =
    final?.status === 'completed'
      ? final.winner_id === final.team_a_id
        ? final.team_a
        : final.team_b
      : null;

  return (
    <div className="bracket-scroll">
      <div className="bracket" style={{ '--rounds': total }}>
        {rounds.map((round) => {
          const roundMatches = matches
            .filter((match) => Number(match.round) === round)
            .sort((a, b) => a.match_number - b.match_number);
          return (
            <section className="bracket-round" key={round}>
              <h3 className="bracket-round__title">{roundLabel(round, total)}</h3>
              <div className="bracket-round__matches">
                {roundMatches.map((match) => {
                  const done = match.status === 'completed';
                  const badge = dayBadge(match.scheduled_at);
                  const hasDate = Boolean(match.scheduled_at);
                  return (
                    <article
                      className={`bracket-match bracket-match--${match.status}`}
                      key={match.id}
                    >
                      <div className="bracket-match__head">
                        <span>Match {match.match_number}</span>
                        <StatusBadge status={match.status} />
                      </div>
                      <BracketTeam
                        name={match.team_a}
                        score={done ? match.score_a : null}
                        winner={done && match.winner_id === match.team_a_id}
                        tbd={!match.team_a}
                      />
                      <BracketTeam
                        name={match.team_b}
                        score={done ? match.score_b : null}
                        winner={done && match.winner_id === match.team_b_id}
                        tbd={!match.team_b}
                      />
                      <div className="bracket-match__foot">
                        {hasDate ? (
                          <span>
                            {badge.month} {badge.day} · {formatTime(match.scheduled_at)}
                          </span>
                        ) : (
                          <span>Schedule TBD</span>
                        )}
                        {match.venue && <span>{match.venue}</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="bracket-round bracket-round--champion">
          <h3 className="bracket-round__title">Champion</h3>
          <div className={`champion-card${champion ? ' is-filled' : ''}`}>
            <span className="champion-card__icon">
              <Trophy size={24} />
            </span>
            <strong>{champion || 'To be crowned'}</strong>
            <span>{champion ? 'Season champion' : 'Win the final'}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
