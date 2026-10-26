//identifier if student or admin
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = ({ id, full_name, email, role }) => ({ id, full_name, email, role });

router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name?.trim() || !email?.includes('@') || (password || '').length < 8)
    return res.status(400).json({ error: 'Name, valid email and 8+ char password required' });

  if (!email.toLowerCase().endsWith('@wmsu.edu.ph'))
  return res.status(400).json({ error: 'Please use your @wmsu.edu.ph email' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, lower($2), $3) RETURNING *`,
    [full_name.trim(), email, hash]
  );
  res.status(201).json({ token: sign(rows[0]), user: publicUser(rows[0]) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = lower($1)', [email || '']);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(401).json({ error: 'Account not found' });
  res.json({ user: publicUser(rows[0]) });
});

export default router;