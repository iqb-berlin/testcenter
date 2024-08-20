alter table workspaces
  add column workspace_hash varchar(255) not null default '';


-- 15.3
alter table file_relations
  modify relationship_type enum ('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'usesScheme', 'unknown') not null;
