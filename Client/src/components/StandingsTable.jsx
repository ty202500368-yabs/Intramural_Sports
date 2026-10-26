import { EmptyState } from './ui';
import { TrendingUp } from 'lucide-react';

const num = (value) => Number(value ?? 0);

export default function StandingsTable({ rows = [], emptyAction }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="The table is wide open"
        description="Standings appear as soon as teams register and results are recorded."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="standings-table__rank">#</th>
            <th className="standings-table__team">Team</th>
            <th title="Played">P</th>
            <th title="Wins">W</th>
            <th title="Draws">D</th>
            <th title="Losses">L</th>
            <th title="Points for">PF</th>
            <th title="Points against">PA</th>
            <th title="Point difference">+/−</th>
            <th className="standings-table__pts" title="Points">
              PTS
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const diff = num(row.points_for) - num(row.points_against);
            const rank = index + 1;
            return (
              <tr key={row.team_id} className={rank <= 3 ? `is-top is-top-${rank}` : ''}>
                <td className="standings-table__rank">
                  <span className={`rank-chip rank-chip--${Math.min(rank, 4)}`}>{rank}</span>
                </td>
                <td className="standings-table__team">
                  <span>{row.name}</span>
                </td>
                <td>{num(row.played)}</td>
                <td>{num(row.wins)}</td>
                <td>{num(row.draws)}</td>
                <td>{num(row.losses)}</td>
                <td>{num(row.points_for)}</td>
                <td>{num(row.points_against)}</td>
                <td className={diff > 0 ? 'is-positive' : diff < 0 ? 'is-negative' : ''}>
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="standings-table__pts">{num(row.pts)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="standings-legend">3 points for a win · 1 point for a draw · 0 for a loss.</p>
    </div>
  );
}
