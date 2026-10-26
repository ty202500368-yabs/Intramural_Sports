import { Pencil, Trash2, UserRound, Users } from 'lucide-react';
import { Modal, SportMark } from './ui';

export default function TeamDetailModal({ open, team, onClose, canManage, onEdit, onDelete }) {
  if (!team) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={team.sport_name}
      title={team.name}
      size="md"
      footer={
        canManage ? (
          <>
            <button type="button" className="btn btn--danger-soft" onClick={onDelete}>
              <Trash2 size={15} /> Delete team
            </button>
            <button type="button" className="btn btn--primary" onClick={onEdit}>
              <Pencil size={15} /> Edit roster
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        )
      }
    >
      <div className="team-detail__top">
        <SportMark name={team.sport_name} size="lg" />
        <div className="team-detail__meta">
          <span className="team-detail__chip">
            <UserRound size={14} /> Captain: {team.captain_name || 'Unassigned'}
          </span>
          <span className="team-detail__chip">
            <Users size={14} /> {team.members?.length || 0} players
          </span>
        </div>
      </div>

      <div className="roster-view">
        <div className="roster-view__head">
          <span>#</span>
          <span>Player</span>
          <span>Position</span>
        </div>
        {team.members?.length ? (
          team.members.map((member) => (
            <div className="roster-view__row" key={member.id}>
              <span className="jersey-badge">
                {member.jersey_number === null || member.jersey_number === undefined
                  ? '—'
                  : member.jersey_number}
              </span>
              <strong>{member.full_name}</strong>
              <span>{member.position || '—'}</span>
            </div>
          ))
        ) : (
          <div className="roster-view__empty">
            No players listed yet. The captain can add the roster before the bracket is drawn.
          </div>
        )}
      </div>
    </Modal>
  );
}
