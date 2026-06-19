-- Migration: add_families_table
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  passcode_hash TEXT NOT NULL
);

-- Add family_id to children table
ALTER TABLE children ADD COLUMN family_id TEXT REFERENCES families(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
