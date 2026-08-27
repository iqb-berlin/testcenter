alter table login_sessions
  drop key unique_login_session;

alter table login_sessions
  add constraint unique_login_session
    unique (name, workspace_id);
