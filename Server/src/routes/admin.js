//GETTER NG API
import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  const [counts, upcoming, recent] = await Promise.all([
    query(`SELECT
       (SELECT COUNT(*) FROM users WHERE role='student')::int AS students,
       (SELECT COUNT(*) FROM sports)::int                     AS sports,
       (SELECT COUNT(*) FROM teams)::int                      AS teams,
       (SELECT COUNT(*) FROM matches WHERE status='scheduled')::int AS scheduled,
       (SELECT COUNT(*) FROM matches WHERE status='ongoing')::int   AS ongoing,
       (SELECT COUNT(*) FROM matches WHERE status='completed')::int AS completed`),
    query(`SELECT m.id, m.scheduled_at, m.venue, s.name AS sport_name, ta.name AS team_a, tb.name AS team_b
           FROM matches m JOIN sports s ON s.id = m.sport_id
           LEFT JOIN teams ta ON ta.id = m.team_a_id LEFT JOIN teams tb ON tb.id = m.team_b_id
           WHERE m.status <> 'completed' AND m.team_a_id IS NOT NULL AND m.team_b_id IS NOT NULL
           ORDER BY m.scheduled_at NULLS LAST LIMIT 5`),
    query(`SELECT m.id, s.name AS sport_name, ta.name AS team_a, tb.name AS team_b, r.score_a, r.score_b
           FROM results r JOIN matches m ON m.id = r.match_id JOIN sports s ON s.id = m.sport_id
           LEFT JOIN teams ta ON ta.id = m.team_a_id LEFT JOIN teams tb ON tb.id = m.team_b_id
           ORDER BY r.recorded_at DESC LIMIT 5`),
  ]);
  res.json({ counts: counts.rows[0], upcoming: upcoming.rows, recent: recent.rows });
});

export default router;