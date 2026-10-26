import { ArrowUpRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FORMATS } from '../lib/sports';
import { SportMark } from './ui';

export default function SportCard({ sport }) {
  return (
    <Link to={`/sports/${sport.id}`} className="sport-card">
      <div className="sport-card__top">
        <SportMark name={sport.name} size="md" />
        <span className="sport-card__arrow">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="sport-card__copy">
        <h3>{sport.name}</h3>
        <p>{sport.description || 'Campus competition, season-long glory.'}</p>
      </div>
      <div className="sport-card__foot">
        <span>
          <Users size={14} /> {Number(sport.team_count)} {Number(sport.team_count) === 1 ? 'team' : 'teams'}
        </span>
        <span>{FORMATS[sport.format] || 'Tournament'}</span>
      </div>
    </Link>
  );
}
