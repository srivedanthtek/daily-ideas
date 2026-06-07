-- Add content_hash column to ideas table for deduplication
ALTER TABLE ideas ADD COLUMN content_hash TEXT;

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_ideas_content_hash ON ideas(content_hash);