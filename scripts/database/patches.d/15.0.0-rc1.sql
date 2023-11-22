-- A new table from group_tokens.
-- The authentication is done group-wise now (not person-wise) because we assume that isp-caches can caches calls
-- better if there is no difference between them (even not in the headers).
-- This a has the nice side effect, that we can store group-labels here (and potentially validTo as well).
-- and keep them, even if the login is gone (wich was an old known problem before, but a lesser one, since labels don't
-- appear in the final data).

create table login_session_groups (
  workspace_id bigint unsigned not null,
  group_label text not null,
  group_name varchar(100) not null,
  token varchar(50) not null,
  constraint login_session_groups_unique_token
    unique (token),
  constraint login_session_groups_pk
    primary key(workspace_id, group_name)
    -- atm group_names are globally unique, so that would be enough for a primary key,
    -- but we intend to change that eventually.
) collate = utf8mb3_german2_ci;

-- migrate existing data

insert
  into login_session_groups (group_name, group_label, workspace_id, token)
select
  login_sessions.group_name,
  if(group_label is not null, group_label,login_sessions.group_name) as group_label,
  -- when the login is already deleted but not the collected data, we don't have any chance to get the group_label
  login_sessions.workspace_id,
  md5(rand()) as group_token
  -- already started sessions from previous versions do not have a group_token, since such thing did not exist
  -- we have to provide one here. it's not as cryptographically secure as the real tokens created by the backend
  -- but for the (hopefully) rare cases of a migration from tc 14 to 15 during a running study they should do.
from
  login_sessions
  left join logins on (login_sessions.group_name = logins.group_name and login_sessions.workspace_id = logins.workspace_id)
group by
  login_sessions.group_name, login_sessions.workspace_id, group_label;

-- add new foreign key
-- so the login_session_groups table can be cleared when the data should be deleted.

alter table login_sessions
  add index login_sessions_groups_fk (workspace_id, group_name);

alter table login_session_groups
  add constraint login_sessions_fk
    foreign key (workspace_id, group_name) references login_sessions (workspace_id, group_name)
      on delete cascade;
