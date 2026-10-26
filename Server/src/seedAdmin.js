import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
await pool.query(
  `INSERT INTO users (full_name, email, password_hash, role)
   VALUES ('Administrator', lower($1), $2, 'admin')
   ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
  [process.env.ADMIN_EMAIL, hash]
);
console.log('Admin ready:', process.env.ADMIN_EMAIL);
await pool.end();