create index login_sessions_token_index on login_sessions (token);
create index person_sessions_token_index on person_sessions (token);

alter table logins convert to character set utf8 collate utf8_german2_ci;
alter table logins modify name varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;