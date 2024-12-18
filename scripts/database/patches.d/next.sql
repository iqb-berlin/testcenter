alter table login_session_groups
  drop foreign key login_sessions_fk;

alter table login_session_groups
  add constraint login_sessions_fk
    foreign key (workspace_id, group_name) references login_sessions (workspace_id, group_name)
      on update cascade on delete cascade;

