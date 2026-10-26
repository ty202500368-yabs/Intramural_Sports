//start or finish ng match, record result, etc
import { Router } from 'express';
import { pool, query } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { sport_id, status, team_id, q } = req.query;
  const where = [], p = [];
  const add = (sql, v) => { p.push(v); where.push(sql.replace('?', `$${p.length}`)); };
  if (sport_id) add('m.sport_id = ?', sport_id);
  if (status)   add('m.status = ?', status);
  if (team_id)  add('(m.team_a_id = ? OR m.team_b_id = ?)'.replaceAll('?', `$${p.length + 1}`), team_id);
  if (q)        add('(ta.name ILIKE ? OR tb.name ILIKE ? OR m.venue ILIKE ?)'
                    .replaceAll('?', `$${p.length + 1}`), `%${q}%`);

  const { rows } = await query(`
    SELECT m.*, s.name AS sport_name, s.format,
           ta.name AS team_a, tb.name AS team_b, w.name AS winner,
           r.score_a, r.score_b
    FROM matches m
    JOIN sports s ON s.id = m.sport_id
    LEFT JOIN teams ta ON ta.id = m.team_a_id
    LEFT JOIN teams tb ON tb.id = m.team_b_id
    LEFT JOIN teams w  ON w.id  = m.winner_id
    LEFT JOIN results r ON r.match_id = m.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY m.sport_id, m.round, m.match_number`, p);
  res.json(rows);
});

router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { scheduled_at = null, venue = null, status = null } = req.body;
  if (status && !['scheduled', 'ongoing'].includes(status))
    return res.status(400).json({ error: "Status can only be set to scheduled or ongoing. Record a result to complete a match." });
  const { rows } = await query(
    `UPDATE matches SET
       scheduled_at = COALESCE($1, scheduled_at),
       venue        = COALESCE($2, venue),
       status       = COALESCE($3, status)
     WHERE id = $4 AND status <> 'completed' RETURNING *`,
    [scheduled_at, venue, status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Match not found or already completed' });
  res.json(rows[0]);
});

router.post('/:id/result', authenticate, requireAdmin, async (req, res) => {
  const a = Number(req.body.score_a), b = Number(req.body.score_b);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0)
    return res.status(400).json({ error: 'Scores must be whole numbers, 0 or higher' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [m] } = await client.query(
      `SELECT m.*, s.format FROM matches m JOIN sports s ON s.id = m.sport_id
       WHERE m.id = $1 FOR UPDATE`, [req.params.id]);
    if (!m) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Match not found' }); }
    if (!m.team_a_id || !m.team_b_id) { await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Both teams must be decided first' }); }
    if (m.format === 'single_elimination' && a === b) { await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No draws in elimination — decide a winner' }); }

    if (m.next_match_id) {
      const { rows: [nx] } = await client.query('SELECT status FROM matches WHERE id=$1', [m.next_match_id]);
      if (nx?.status === 'completed') { await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Next round already played; cannot change this result' }); }
    }

    const winner = a > b ? m.team_a_id : b > a ? m.team_b_id : null;
    await client.query(
      `INSERT INTO results (match_id, score_a, score_b, recorded_by) VALUES ($1,$2,$3,$4)
       ON CONFLICT (match_id) DO UPDATE
       SET score_a = $2, score_b = $3, recorded_by = $4, recorded_at = now()`,
      [m.id, a, b, req.user.id]);
    await client.query(`UPDATE matches SET status='completed', winner_id=$1 WHERE id=$2`, [winner, m.id]);

    if (winner && m.next_match_id) {
      const col = m.next_slot === 'A' ? 'team_a_id' : 'team_b_id';
      await client.query(`UPDATE matches SET ${col} = $1 WHERE id = $2`, [winner, m.next_match_id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true, winner_id: winner });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

export default router;