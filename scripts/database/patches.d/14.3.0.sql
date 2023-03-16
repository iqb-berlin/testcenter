alter table logins
  modify workspace_id bigint unsigned null;

delete from logins
  where workspace_id not in (select id from workspaces);

alter table logins
  add constraint logins_workspaces_id_fk
    foreign key (workspace_id) references workspaces (id) on delete cascade;