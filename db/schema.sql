-- Companies schema
-- Separate categories/cities tables are not used: the dataset is flat,
-- categories and cities are free-text with no hierarchy or extra metadata.

CREATE TABLE IF NOT EXISTS companies (
    id              SERIAL PRIMARY KEY,
    external_id     VARCHAR(32) UNIQUE,
    name            VARCHAR(512) NOT NULL,
    category        VARCHAR(256),
    city            VARCHAR(256),
    address         VARCHAR(512),
    rating          NUMERIC(3, 1),
    reviews_count   INTEGER DEFAULT 0,
    website         VARCHAR(512),
    phone           VARCHAR(64),
    phone_status    VARCHAR(32) DEFAULT 'unknown',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Natural key for deduplication when external_id is missing
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_address
    ON companies (name, address);

CREATE INDEX IF NOT EXISTS idx_companies_city ON companies (city);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies (category);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);

-- Reviews table (loaded separately for anomaly analysis)
CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    external_id     VARCHAR(32),
    name            VARCHAR(512),
    category        VARCHAR(256),
    city            VARCHAR(256),
    address         VARCHAR(512),
    rating          VARCHAR(32),
    reviews_count   VARCHAR(32),
    website         VARCHAR(512),
    phone           VARCHAR(64),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_external_id ON reviews (external_id);

-- Contacts (LPR / decision makers)
CREATE TABLE IF NOT EXISTS contacts (
    id                  SERIAL PRIMARY KEY,
    company_id          INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name          VARCHAR(128),
    last_name           VARCHAR(128),
    title               VARCHAR(256),
    email               VARCHAR(256),
    phone               VARCHAR(64),
    is_decision_maker   BOOLEAN DEFAULT false,
    email_status        VARCHAR(32) DEFAULT 'unknown',
    phone_status        VARCHAR(32) DEFAULT 'unknown',
    source              VARCHAR(64) DEFAULT 'mock',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_title ON contacts (title);
CREATE INDEX IF NOT EXISTS idx_contacts_decision_maker ON contacts (is_decision_maker);

-- ICP (Ideal Customer Profile) saved searches
CREATE TABLE IF NOT EXISTS icp_profiles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(256) NOT NULL,
    criteria        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
