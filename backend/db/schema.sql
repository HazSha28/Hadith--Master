-- Hadith Master PostgreSQL Schema

-- Books Table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    book_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_hadiths INTEGER,
    authenticity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hadiths Table
CREATE TABLE IF NOT EXISTS hadiths (
    id SERIAL PRIMARY KEY,
    firestore_id VARCHAR(100) UNIQUE,
    book_id VARCHAR(50) REFERENCES books(book_id),
    hadith_number VARCHAR(20),
    kitab TEXT,
    bab TEXT,
    arabic_text TEXT,
    english_translation TEXT,
    urdu_translation TEXT,
    narrator TEXT,
    isnad TEXT,
    matn TEXT,
    grade VARCHAR(50),
    scholar_verification TEXT,
    authenticity_level VARCHAR(50),
    source_reference TEXT,
    themes JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hadiths_book_id ON hadiths(book_id);
CREATE INDEX IF NOT EXISTS idx_hadiths_grade ON hadiths(grade);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_hadiths_english_search ON hadiths USING GIN (to_tsvector('english', english_translation));
CREATE INDEX IF NOT EXISTS idx_hadiths_arabic_search ON hadiths USING GIN (to_tsvector('arabic', arabic_text));
