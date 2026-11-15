-- KaySwap PostgreSQL Database Initialization Schema
-- Dedicated strictly for User Feedback & Community Reviews
-- psql -U postgres -d kayswap -f init.sql

CREATE TABLE IF NOT EXISTS kayswap_feedbacks (
    id VARCHAR(100) PRIMARY KEY,
    address VARCHAR(66) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(64) NOT NULL,
    comment TEXT NOT NULL,
    swap_tx_hash VARCHAR(100),
    is_first_swap BOOLEAN DEFAULT FALSE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kayswap_feedbacks_timestamp ON kayswap_feedbacks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kayswap_feedbacks_address ON kayswap_feedbacks(LOWER(address));
