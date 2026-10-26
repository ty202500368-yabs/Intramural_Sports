import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Modal } from './ui';

let localId = 1;
const blankMember = () => ({
  key: `member-${localId++}`,
  full_name: '',
  jersey_number: '',
  position: '',
});

export default function TeamFormModal({
  open,
  onClose,
  onSaved,
  sports = [],
  team = null,
  defaultSportId = null,
}) {
  const { notify } = useToast();
  const editing = Boolean(team);

  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [members, setMembers] = useState([blankMember()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openSports = useMemo(() => sports.filter((sport) => !Number(sport.match_count)), [sports]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setBusy(false);
    if (team) {
      setSportId(String(team.sport_id));
      setName(team.name);
      setMembers(
        team.members?.length
          ? team.members.map((member) => ({
              key: `member-${localId++}`,
              full_name: member.full_name || '',
              jersey_number:
                member.jersey_number === null || member.jersey_number === undefined
                  ? ''
                  : String(member.jersey_number),
              position: member.position || '',
            }))
          : [blankMember()],
      );
    } else {
      const preferred = defaultSportId
        ? openSports.find((sport) => String(sport.id) === String(defaultSportId))
        : null;
      setSportId(preferred ? String(preferred.id) : openSports[0] ? String(openSports[0].id) : '');
      setName('');
      setMembers([blankMember()]);
    }
  }, [open, team, openSports, defaultSportId]);

  const updateMember = (key, field, value) => {
    setMembers((current) =>
      current.map((member) => (member.key === key ? { ...member, [field]: value } : member)),
    );
  };

  const removeMember = (key) => {
    setMembers((current) => (current.length === 1 ? [blankMember()] : current.filter((m) => m.key !== key)));
  };

  const addMember = () => setMembers((current) => [...current, blankMember()]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give your team a name.');
      return;
    }
    if (!sportId) {
      setError('Choose a sport for your team.');
      return;
    }

    const selectedSport = sports.find((sport) => String(sport.id) === String(sportId));
    if (!editing && selectedSport && Number(selectedSport.match_count)) {
      setError('Registration is closed for that sport.');
      return;
    }

    const cleaned = members.filter(
      (member) => member.full_name.trim() || member.jersey_number !== '' || member.position.trim(),
    );

    for (const member of cleaned) {
      if (!member.full_name.trim()) {
        setError('Every listed player needs a full name.');
        return;
      }
      if (member.jersey_number !== '') {
        const jersey = Number(member.jersey_number);
        if (!Number.isInteger(jersey) || jersey < 0 || jersey > 999) {
          setError('Jersey numbers must be a whole number from 0 to 999.');
          return;
        }
      }
    }

    const jerseys = cleaned
      .filter((member) => member.jersey_number !== '')
      .map((member) => Number(member.jersey_number));
    if (new Set(jerseys).size !== jerseys.length) {
      setError('Jersey numbers must be unique within the team.');
      return;
    }

    const payload = {
      name: trimmedName,
      members: cleaned.map((member) => ({
        full_name: member.full_name.trim(),
        jersey_number: member.jersey_number === '' ? null : Number(member.jersey_number),
        position: member.position.trim() || null,
      })),
    };

    setBusy(true);
    try {
      const result = editing
        ? await api.put(`/teams/${team.id}`, payload)
        : await api.post('/teams', { ...payload, sport_id: Number(sportId) });
      notify(editing ? 'Team updated.' : 'Team registered. Welcome to the season!');
      onSaved?.(result);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      eyebrow={editing ? 'Roster editor' : 'New entry'}
      title={editing ? `Edit ${team?.name}` : 'Register a team'}
      description={
        editing
          ? 'Update the team name or make changes to the roster.'
          : 'Put your squad on the board. You can update your roster before brackets are drawn.'
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="team-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Register team'}
          </button>
        </>
      }
    >
      <form id="team-form" onSubmit={submit} className="form-stack">
        {error && <div className="form-error">{error}</div>}

        {!editing && !openSports.length && (
          <div className="form-note">
            Registration is currently closed for every sport. Check back when a new bracket
            opens.
          </div>
        )}

        <div className="form-grid">
          <label className="field">
            <span className="field__label">Sport</span>
            <select
              value={sportId}
              onChange={(event) => setSportId(event.target.value)}
              disabled={editing || busy}
              required
            >
              <option value="">Choose a sport</option>
              {sports.map((sport) => (
                <option
                  key={sport.id}
                  value={sport.id}
                  disabled={!editing && Number(sport.match_count) > 0}
                >
                  {sport.name}
                  {Number(sport.match_count) > 0 ? ' — registration closed' : ''}
                </option>
              ))}
            </select>
            {!editing && (
              <span className="field__hint">
                Registration closes once the bracket for a sport is generated.
              </span>
            )}
          </label>

          <label className="field">
            <span className="field__label">Team name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Blazing Falcons"
              maxLength={80}
              required
              autoFocus={editing}
            />
            <span className="field__hint">Keep it recognisable — this shows on the bracket.</span>
          </label>
        </div>

        <div className="roster-head">
          <div>
            <h3>
              <Users size={17} /> Roster
            </h3>
            <p>Add your players, jersey numbers, and positions.</p>
          </div>
          <span className="pill pill--soft">
            {members.length} {members.length === 1 ? 'slot' : 'slots'}
          </span>
        </div>

        <div className="roster-editor">
          <div className="roster-editor__head">
            <span>Player name</span>
            <span>Jersey #</span>
            <span>Position</span>
            <span />
          </div>
          {members.map((member, index) => (
            <div className="roster-editor__row" key={member.key}>
              <label className="field field--bare">
                <span className="sr-only">Player {index + 1} full name</span>
                <input
                  type="text"
                  value={member.full_name}
                  onChange={(event) => updateMember(member.key, 'full_name', event.target.value)}
                  placeholder="Full name"
                  maxLength={120}
                />
              </label>
              <label className="field field--bare">
                <span className="sr-only">Player {index + 1} jersey number</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={member.jersey_number}
                  onChange={(event) =>
                    updateMember(member.key, 'jersey_number', event.target.value)
                  }
                  placeholder="00"
                />
              </label>
              <label className="field field--bare">
                <span className="sr-only">Player {index + 1} position</span>
                <input
                  type="text"
                  value={member.position}
                  onChange={(event) => updateMember(member.key, 'position', event.target.value)}
                  placeholder="Guard"
                  maxLength={40}
                />
              </label>
              <button
                type="button"
                className="icon-btn icon-btn--plain roster-editor__remove"
                onClick={() => removeMember(member.key)}
                aria-label={`Remove player ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn--dashed btn--sm" onClick={addMember}>
          <Plus size={15} /> Add another player
        </button>
      </form>
    </Modal>
  );
}
