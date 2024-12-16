-- the patch 15.0.0 contained a command, which does not work with MySQL > 8.4
-- the following procedure would delete this deprecated kind fo key

drop procedure if exists clean_pre_mysql_8_4_key;
create procedure clean_pre_mysql_8_4_key()
begin
  if exists (
    select * from INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    where TABLE_SCHEMA = database()
      and CONSTRAINT_TYPE = 'FOREIGN KEY'
      and CONSTRAINT_NAME = 'login_sessions_fk'
  ) then
    alter table login_session_groups
      drop constraint login_sessions_fk;
  end if;
end;
call clean_pre_mysql_8_4_key();
drop procedure if exists clean_pre_mysql_8_4_key;


alter table login_sessions
  add constraint login_session_groups_fk
    foreign key (workspace_id, group_name) references login_session_groups (workspace_id, group_name)
      on delete cascade;



