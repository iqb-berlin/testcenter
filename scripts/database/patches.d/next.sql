alter table workspaces
  add column workspace_hash varchar(255) not null default '',
  add column content_type varchar(255) not null default 'mixed';