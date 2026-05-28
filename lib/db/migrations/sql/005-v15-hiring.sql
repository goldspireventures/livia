-- v1.5: hiring intake posts (owner-facing JD + applicant pipeline stub)
CREATE TABLE IF NOT EXISTS hiring_posts (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  description text,
  role_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hiring_posts_business_idx ON hiring_posts(business_id);

CREATE TABLE IF NOT EXISTS hiring_applications (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES hiring_posts(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_email text,
  applicant_phone text,
  note text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hiring_applications_post_idx ON hiring_applications(post_id);
