-- 1. remove data from login-session which will be part of new logins table
-- data can be deleted safely, because it is stored in teh XMLs and they have to be read in after patching the DB anyway

alter table login_sessions drop column mode;
alter table login_sessions drop column codes_to_booklets;
alter table login_sessions drop column group_name;
alter table login_sessions drop column custom_texts;
alter table login_sessions drop column valid_until;


-- 2. create table logins

create table logins (
    name varchar(50) not null,
    password varchar(100) not null,
    mode varchar(20) not null,
    workspace_id bigint not null,
    codes_to_booklets text null,
    source varchar(30) null,
    valid_from timestamp null,
    valid_to timestamp null,
    valid_for int null,
    group_name varchar(100),
    group_label text null,
    custom_texts text null,
    constraint logins_pk primary key (name)
);

create index index_fk_logins on login_sessions (name);
create index index_fk_login_session_login on login_sessions (id);


-- 3. change person_sessions table logins

alter table person_sessions change login_id login_sessions_id bigint unsigned not null;
alter table person_sessions change laststate group_name varchar(100) null;
alter table person_sessions drop column group_name;

