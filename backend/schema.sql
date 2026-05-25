-- ResourceBridge Database Schema
-- Run this in your Neon SQL editor to initialize tables
-- Note: SQLAlchemy will also auto-create these on first boot via create_all()

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    category VARCHAR(50) CHECK (
        category IN (
            'immigration', 'school', 'housing', 'employment',
            'healthcare', 'benefits', 'emergency', 'Uncategorized'
        )
    ),
    ocr_text TEXT,
    ai_summary TEXT,
    ai_summary_es TEXT,
    action_items JSONB,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_emergency ON documents(is_emergency);