-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE DOCUMENTS TABLE
-- FIX: Corrected broken CHECK constraint syntax (was: NOT NULL (category IN (...)))
-- FIX: Aligned columns with models.py (integer IDs, no full_name, added ai_summary, created_at)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    category VARCHAR(50) CHECK (
        category IN (
            'immigration',
            'school',
            'housing',
            'employment',
            'healthcare',
            'benefits',
            'emergency',
            'Uncategorized'
        )
    ),
    ocr_text TEXT,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);