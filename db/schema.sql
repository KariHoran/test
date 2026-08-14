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
    created_at      TIMESTAMPTZ DEFAULT NOW()
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
