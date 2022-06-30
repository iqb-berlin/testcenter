create index admin_sessions_user_id_index
    on admin_sessions (user_id);

create unique index users_id_uindex
    on users (id);

create index login_sessions_name_index
    on login_sessions (name);

create index logins_name_index
    on logins (name);

create index person_sessions_login_sessions_id_index
    on person_sessions (login_sessions_id);
