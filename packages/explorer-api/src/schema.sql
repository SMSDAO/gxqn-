-- GXQ Network V3.0.0 — Database Schema for PostgreSQL
-- Source of Truth for Explorer, Account Abstraction Registry, and Governance

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(32) DEFAULT 'USER',
    smart_wallet_address VARCHAR(42) NOT NULL,
    provider VARCHAR(32) DEFAULT 'deterministic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smart_wallets (
    address VARCHAR(42) PRIMARY KEY,
    owner_email VARCHAR(255) REFERENCES users(email),
    aa_provider VARCHAR(32) NOT NULL,
    chain_id INTEGER NOT NULL,
    init_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
    id BIGINT PRIMARY KEY,
    hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    validator VARCHAR(42) NOT NULL,
    tx_count INTEGER DEFAULT 0,
    gas_used BIGINT DEFAULT 0,
    gas_limit BIGINT DEFAULT 30000000,
    base_fee_gwei NUMERIC(10, 4) DEFAULT 1.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    hash VARCHAR(66) PRIMARY KEY,
    block_id BIGINT REFERENCES blocks(id),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value_wei NUMERIC(78, 0) DEFAULT 0,
    asset VARCHAR(16) DEFAULT 'GXQ',
    status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'PENDING', 'REVERTED')),
    method VARCHAR(64) DEFAULT 'transfer',
    gas_used BIGINT DEFAULT 21000,
    gas_fee NUMERIC(24, 6) DEFAULT 0.000021,
    correlation_id VARCHAR(64),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_flags (
    flag_key VARCHAR(64) PRIMARY KEY,
    flag_value BOOLEAN NOT NULL DEFAULT false,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial admin
INSERT INTO users (id, email, name, role, smart_wallet_address, provider)
VALUES ('usr_admin_genesis', 'gxqstudio@gmail.com', 'GXQ Studio Lead Architect', 'SUPER_ADMIN', '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8', 'deterministic')
ON CONFLICT (email) DO NOTHING;

-- Seed system flags
INSERT INTO system_flags (flag_key, flag_value, updated_by)
VALUES 
  ('is_launchpad_paused', false, 'gxqstudio@gmail.com'),
  ('is_swap_paused', false, 'gxqstudio@gmail.com'),
  ('emergency_maintenance_mode', false, 'gxqstudio@gmail.com')
ON CONFLICT (flag_key) DO NOTHING;
