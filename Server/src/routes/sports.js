import { Router } from 'express';
import { pool, query } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
const FORMATS = ['single_elimination', 'round_robin'];

router.get('/', async (req, res) => {
  const { rows } = await query(`
    SELECT s.*,
      (SELECT COUNT(*) FROM teams t   WHERE t.sport_id = s.id)::int AS team_count,
      (SELECT COUNT(*) FROM matches m WHERE m.sport_id = s.id)::int AS match_count
    FROM sports s ORDER BY s.name`);
  res.json(rows);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description = '', format = 'single_elimination' } = req.body;
  if (!name?.trim() || !FORMATS.includes(format))
    return res.status(400).json({ error: 'Valid name and format required' });
  const { rows } = await query(
    'INSERT INTO sports (name, description, format) VALUES ($1,$2,$3) RETURNING *',
    [name.trim(), description, format]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, description = '', format } = req.body;
  if (!name?.trim() || !FORMATS.includes(format))
    return res.status(400).json({ error: 'Valid name and format required' });
  const { rows } = await query(
    'UPDATE sports SET name=$1, description=$2, format=$3 WHERE id=$4 RETURNING *',
    [name.trim(), description, format, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Sport not found' });
  res.json(rows[0]);
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { rowCount } = await query('DELETE FROM sports WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Sport not found' });
  res.status(204).end();
});

router.get('/:id/standings', async (req, res) => {
  const { rows } = await query(
    `SELECT *, (points_for - points_against)::int AS diff
     FROM standings WHERE sport_id = $1
     ORDER BY pts DESC, diff DESC, points_for DESC, name`,
    [req.params.id]
  );
  res.json(rows);
});

//Generate para sa sports match 
const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

router.post('/:id/bracket', authenticate, requireAdmin, async (req, res) => {
  const sportId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [sport] } = await client.query('SELECT * FROM sports WHERE id=$1', [sportId]);
    if (!sport) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Sport not found' }); }

    const { rows: existing } = await client.query('SELECT 1 FROM matches WHERE sport_id=$1 LIMIT 1', [sportId]);
    if (existing.length) { await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Bracket already exists. Clear it first.' }); }

    const { rows: teamRows } = await client.query('SELECT id FROM teams WHERE sport_id=$1', [sportId]);
    const teams = shuffle(teamRows.map((t) => t.id));
    if (teams.length < 2) { await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Need at least 2 teams' }); }

    if (sport.format === 'round_robin') {
      let n = 1;
      for (let i = 0; i < teams.length; i++)
        for (let j = i + 1; j < teams.length; j++)
          await client.query(
            `INSERT INTO matches (sport_id, round, match_number, team_a_id, team_b_id)
             VALUES ($1, 1, $2, $3, $4)`, [sportId, n++, teams[i], teams[j]]);
    } else {
      const size = nextPow2(teams.length);
      const rounds = Math.log2(size);
      const ids = {};

      for (let r = rounds; r >= 1; r--) {
        ids[r] = [];
        const count = size / 2 ** r;
        for (let i = 0; i < count; i++) {
          const next = r < rounds ? ids[r + 1][Math.floor(i / 2)] : null;
          const slot = r < rounds ? (i % 2 === 0 ? 'A' : 'B') : null;
          const { rows: [m] } = await client.query(
            `INSERT INTO matches (sport_id, round, match_number, next_match_id, next_slot)
             VALUES ($1,$2,$3,$4,$5) RETURNING id`, [sportId, r, i + 1, next, slot]);
          ids[r].push(m.id);
        }
      }

      const half = size / 2;
      for (let i = 0; i < half; i++) {
        const a = teams[i], b = teams[i + half] ?? null;
        const matchId = ids[1][i];
        if (b) {
          await client.query('UPDATE matches SET team_a_id=$1, team_b_id=$2 WHERE id=$3', [a, b, matchId]);
        } else {
          await client.query(
            `UPDATE matches SET team_a_id=$1, winner_id=$1, status='completed' WHERE id=$2`, [a, matchId]);
          const nextId = ids[2]?.[Math.floor(i / 2)];
          if (nextId) await client.query(
            `UPDATE matches SET ${i % 2 === 0 ? 'team_a_id' : 'team_b_id'}=$1 WHERE id=$2`, [a, nextId]);
        }
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally { client.release(); }
});

router.delete('/:id/bracket', authenticate, requireAdmin, async (req, res) => {
  await query('DELETE FROM matches WHERE sport_id=$1', [req.params.id]); // results cascade
  res.status(204).end();
});

export default router;