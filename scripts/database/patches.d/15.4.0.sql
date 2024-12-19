alter table file_relations
  modify relationship_type enum ('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'usesScheme', 'unknown') not null;

alter table tests
  add file_id varchar(50) not null;
alter table tests
  modify name varchar(250) not null;

update tests set file_id = name;
alter table login_session_groups
  drop foreign key login_sessions_fk;

alter table login_session_groups
  add constraint login_sessions_fk
    foreign key (workspace_id, group_name) references login_sessions (workspace_id, group_name)
      on update cascade on delete cascade;

