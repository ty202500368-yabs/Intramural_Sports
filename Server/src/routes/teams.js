import { Router } from 'express';
import { pool, query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const TEAM_SELECT = `
  SELECT t.id, t.name, t.sport_id, t.captain_id, s.name AS sport_name,
         u.full_name AS captain_name,
         COALESCE(json_agg(json_build_object(
           'id', tm.id, 'full_name', tm.full_name,
           'jersey_number', tm.jersey_number, 'position', tm.position)
           ORDER BY tm.jersey_number) FILTER (WHERE tm.id IS NOT NULL), '[]') AS members
  FROM teams t
  JOIN sports s ON s.id = t.sport_id
  LEFT JOIN users u ON u.id = t.captain_id
  LEFT JOIN team_members tm ON tm.team_id = t.id`;

router.get('/', async (req, res) => {
  const { sport_id, q } = req.query;
  const where = [], params = [];
  if (sport_id) { params.push(sport_id); where.push(`t.sport_id = $${params.length}`); }
  if (q)        { params.push(`%${q}%`); where.push(`t.name ILIKE $${params.length}`); }
  const { rows } = await query(
    `${TEAM_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     GROUP BY t.id, s.name, u.full_name ORDER BY s.name, t.name`, params);
  res.json(rows);
});

router.get('/mine', authenticate, async (req, res) => {
  const { rows } = await query(
    `${TEAM_SELECT} WHERE t.captain_id = $1 GROUP BY t.id, s.name, u.full_name ORDER BY t.name`,
    [req.user.id]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query(
    `${TEAM_SELECT} WHERE t.id = $1 GROUP BY t.id, s.name, u.full_name`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Team not found' });
  res.json(rows[0]);
});

async function saveMembers(client, teamId, members = []) {
  await client.query('DELETE FROM team_members WHERE team_id=$1', [teamId]);
  for (const m of members) {
    if (!m.full_name?.trim()) continue;
    await client.query(
      `INSERT INTO team_members (team_id, full_name, jersey_number, position)
       VALUES ($1,$2,$3,$4)`,
      [teamId, m.full_name.trim(),
       m.jersey_number === '' || m.jersey_number == null ? null : Number(m.jersey_number),
       m.position || null]);
  }
}

router.post('/', authenticate, async (req, res) => {
  const { sport_id, name, members } = req.body;
  if (!sport_id || !name?.trim()) return res.status(400).json({ error: 'Sport and team name required' });

  const locked = await query('SELECT 1 FROM matches WHERE sport_id=$1 LIMIT 1', [sport_id]);
  if (locked.rowCount) return res.status(409).json({ error: 'Registration is closed for this sport' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [team] } = await client.query(
      'INSERT INTO teams (sport_id, captain_id, name) VALUES ($1,$2,$3) RETURNING *',
      [sport_id, req.user.id, name.trim()]);
    await saveMembers(client, team.id, members);
    await client.query('COMMIT');
    res.status(201).json(team);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

async function ownerOrAdmin(req, res) {
  const { rows } = await query('SELECT * FROM teams WHERE id=$1', [req.params.id]);
  const team = rows[0];
  if (!team) { res.status(404).json({ error: 'Team not found' }); return null; }
  if (req.user.role !== 'admin' && team.captain_id !== req.user.id) {
    res.status(403).json({ error: 'Not your team' }); return null; }
  return team;
}

router.put('/:id', authenticate, async (req, res) => {
  const team = await ownerOrAdmin(req, res); if (!team) return;
  const { name, members } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Team name required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE teams SET name=$1 WHERE id=$2', [name.trim(), team.id]);
    await saveMembers(client, team.id, members);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

router.delete('/:id', authenticate, async (req, res) => {
  const team = await ownerOrAdmin(req, res); if (!team) return;
  const locked = await query('SELECT 1 FROM matches WHERE sport_id=$1 LIMIT 1', [team.sport_id]);
  if (locked.rowCount && req.user.role !== 'admin')
    return res.status(409).json({ error: 'Schedule already generated. Contact an admin.' });
  await query('DELETE FROM teams WHERE id=$1', [team.id]);
  res.status(204).end();
});

export default router;