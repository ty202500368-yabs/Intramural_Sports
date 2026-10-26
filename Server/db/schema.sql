-- SQL toh
DROP VIEW  IF EXISTS standings;
DROP TABLE IF EXISTS results, matches, team_members, teams, sports, users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE sports (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  description TEXT,
  format      VARCHAR(20)  NOT NULL DEFAULT 'single_elimination'
              CHECK (format IN ('single_elimination', 'round_robin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id         SERIAL PRIMARY KEY,
  sport_id   INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  captain_id INT REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sport_id, name)
);

CREATE TABLE team_members (
  id            SERIAL PRIMARY KEY,
  team_id       INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  full_name     VARCHAR(120) NOT NULL,
  jersey_number INT CHECK (jersey_number BETWEEN 0 AND 999),
  position      VARCHAR(40),
  UNIQUE (team_id, jersey_number)
);

CREATE TABLE matches (
  id            SERIAL PRIMARY KEY,
  sport_id      INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  round         INT NOT NULL DEFAULT 1,
  match_number  INT NOT NULL DEFAULT 1,
  team_a_id     INT REFERENCES teams(id) ON DELETE SET NULL,
  team_b_id     INT REFERENCES teams(id) ON DELETE SET NULL,
  winner_id     INT REFERENCES teams(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ,
  venue         VARCHAR(120),
  status        VARCHAR(12) NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'ongoing', 'completed')),
  next_match_id INT REFERENCES matches(id) ON DELETE SET NULL,  -- bracket tree
  next_slot     CHAR(1) CHECK (next_slot IN ('A', 'B')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (team_a_id IS NULL OR team_b_id IS NULL OR team_a_id <> team_b_id)
);

CREATE TABLE results (
  id          SERIAL PRIMARY KEY,
  match_id    INT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  score_a     INT NOT NULL CHECK (score_a >= 0),
  score_b     INT NOT NULL CHECK (score_b >= 0),
  recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_sport    ON teams(sport_id);
CREATE INDEX idx_matches_sport  ON matches(sport_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_time   ON matches(scheduled_at);

CREATE VIEW standings AS
WITH games AS (
  SELECT m.sport_id, m.team_a_id AS team_id, r.score_a AS pf, r.score_b AS pa
  FROM matches m JOIN results r ON r.match_id = m.id
  WHERE m.team_a_id IS NOT NULL AND m.team_b_id IS NOT NULL
  UNION ALL
  SELECT m.sport_id, m.team_b_id, r.score_b, r.score_a
  FROM matches m JOIN results r ON r.match_id = m.id
  WHERE m.team_a_id IS NOT NULL AND m.team_b_id IS NOT NULL
)
SELECT t.sport_id, t.id AS team_id, t.name,
       COUNT(g.team_id)                          AS played,
       COUNT(g.team_id) FILTER (WHERE g.pf > g.pa)  AS wins,
       COUNT(g.team_id) FILTER (WHERE g.pf = g.pa)  AS draws,
       COUNT(g.team_id) FILTER (WHERE g.pf < g.pa)  AS losses,
       COALESCE(SUM(g.pf), 0)                    AS points_for,
       COALESCE(SUM(g.pa), 0)                    AS points_against,
       COUNT(g.team_id) FILTER (WHERE g.pf > g.pa) * 3
         + COUNT(g.team_id) FILTER (WHERE g.pf = g.pa) AS pts
FROM teams t
LEFT JOIN games g ON g.team_id = t.id
GROUP BY t.id;

INSERT INTO sports (name, description, format) VALUES
  ('Basketball', '5-on-5 men''s and women''s', 'single_elimination'),
  ('Volleyball', '6-on-6 indoor',              'round_robin'),
  ('Badminton',    'Singles and doubles',        'round_robin'),
  ('Table Tennis', 'Singles',                    'single_elimination'),
  ('Futsal',       '5-a-side indoor football',   'round_robin'),
  ('Sepak Takraw', 'Regu of 3',                  'single_elimination'),
  ('Chess',        'Individual rapid tournament','round_robin')
ON CONFLICT (name) DO NOTHING;