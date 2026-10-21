ALTER TYPE verona_module_type ADD VALUE IF NOT EXISTS 'widget';
ALTER TABLE files ADD COLUMN verona_model text NOT NULL DEFAULT '';

-- Re-read uploaded metadata during initialization, even when files have not changed.
UPDATE workspaces SET workspace_hash = '';
