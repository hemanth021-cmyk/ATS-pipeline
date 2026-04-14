-- ATS Pipeline — initial schema (PostgreSQL)
-- Apply with: psql "$DATABASE_URL" -f src/db/init.sql

-- -----------------------------------------------------------------------------
-- companies (Step 8 — JWT auth; jobs belong to a registered company)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- jobs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id              SERIAL PRIMARY KEY,
  company_id      INTEGER NOT NULL REFERENCES companies (id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  active_capacity INTEGER NOT NULL CHECK (active_capacity > 0),
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- applications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id                  SERIAL PRIMARY KEY,
  job_id              INTEGER REFERENCES jobs (id),
  applicant_name      VARCHAR(255) NOT NULL,
  applicant_email     VARCHAR(255) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'submitted'
                      CHECK (status IN (
                        'submitted',
                        'waitlisted',
                        'active',
                        'ack_pending',
                        'hired',
                        'rejected',
                        'withdrawn'
                      )),
  waitlist_position   INTEGER,
  penalty_count       INTEGER DEFAULT 0,
  ack_deadline        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications (job_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_waitlist ON applications (job_id, waitlist_position)
  WHERE status = 'waitlisted';

-- -----------------------------------------------------------------------------
-- audit_log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id                    SERIAL PRIMARY KEY,
  application_id      INTEGER REFERENCES applications (id),
  job_id              INTEGER REFERENCES jobs (id),
  from_status         VARCHAR(20),
  to_status           VARCHAR(20) NOT NULL,
  reason              VARCHAR(100),
  waitlist_pos_before INTEGER,
  waitlist_pos_after  INTEGER,
  triggered_by        VARCHAR(50),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- decay_timers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decay_timers (
  id               SERIAL PRIMARY KEY,
  application_id INTEGER UNIQUE REFERENCES applications (id),
  ack_deadline     TIMESTAMPTZ NOT NULL,
  is_processed     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
