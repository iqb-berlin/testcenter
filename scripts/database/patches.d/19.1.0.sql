-- Verona metadata 3.x knows the module type WIDGET.
ALTER TYPE verona_module_type ADD VALUE IF NOT EXISTS 'widget';

-- The model from Verona metadata 3.1: a widget's model (e.g. PERIODIC_TABLE) or the definition type a player supports.
ALTER TABLE files ADD COLUMN IF NOT EXISTS verona_model text NOT NULL DEFAULT '';

-- Modules with metadata 3.x were stored without their metadata. An empty hash makes the next initialization read
-- every workspace again, even when no file has changed.
UPDATE workspaces SET workspace_hash = '';
