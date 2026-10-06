BEGIN;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TYPE site_status as ENUM('active', 'paused');

CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) UNIQUE NOT NULL,
    status site_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now(),
    user_id INT REFERENCES users(id),

    CONSTRAINT uq_user_url UNIQUE (user_id, url)

);

CREATE INDEX idx_sites_user_id ON sites(user_id);

CREATE TYPE check_status as ENUM('up', 'down', 'timeout', 'error');

CREATE TABLE history (
    id BIGSERIAL PRIMARY KEY,
    site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    checked_at TIMESTAMP NOT NULL DEFAULT now(),
    status check_status NOT NULL, 
    response_time INT,

    CONSTRAINT chk_response_time_positive CHECK (response_time is NULL OR response_time >= 0)
);

CREATE INDEX idx_history_site_id ON history(site_id);
CREATE INDEX idx_history_checked_at ON history(checked_at DESC);
CREATE INDEX idx_history_site_id_checked_at ON history(site_id, checked_at DESC);

COMMIT;