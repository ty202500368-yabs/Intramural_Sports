import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import auth from './routes/auth.js';
import sports from './routes/sports.js';
import teams from './routes/teams.js';
import matches from './routes/matches.js';
import admin from './routes/admin.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/auth', auth);
app.use('/api/sports', sports);
app.use('/api/teams', teams);
app.use('/api/matches', matches);
app.use('/api/admin', admin);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'That value already exists' });
  if (err.code === '23503') return res.status(400).json({ error: 'Related record not found' });
  res.status(500).json({ error: 'Server error' });
});

app.listen(process.env.PORT, () => console.log(`API on :${process.env.PORT}`));