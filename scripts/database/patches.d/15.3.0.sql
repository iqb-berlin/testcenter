alter table users add column pw_set_by_admin boolean not null default false;

alter table logins
  add monitors text null;