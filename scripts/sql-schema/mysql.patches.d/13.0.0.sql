alter table login_sessions drop column token;

rename table login_sessions to logins;

alter table logins add password varchar(100) null;
alter table logins add source_file varchar(30) null;

-- TODO data migration
-- TODO grouplabel, validFor ...

alter table person_sessions drop foreign key fk_person_login;
alter table logins drop primary key;
alter table logins drop column id;
alter table logins add constraint logins_pk primary key (name, workspace_id);

create index index_fk_logins on login_sessions (name, workspace_id);

create table login_sessions (
    id          bigint unsigned auto_increment,
    workspace_id      bigint unsigned not null,
    name              varchar(50)     not null,
    valid_until timestamp       null,
    token       varchar(50)     not null,
    constraint login_sessions_id_uindex unique (id)
) collate = utf8_german2_ci;

create index index_fk_login_session_login on login_sessions (id);

alter table login_sessions add constraint login_sessions_pk primary key (id);


alter table person_sessions add constraint fk_person_login foreign key (login_id) references login_sessions (id) on delete cascade;

alter table person_sessions change login_id login_sessions_id bigint unsigned not null;
