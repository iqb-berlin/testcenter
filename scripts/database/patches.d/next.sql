alter table login_session_groups
  add column last_modified timestamp not null default '1970-01-01 00:00:01';

alter table login_session_groups
  modify column last_modified timestamp not null;

