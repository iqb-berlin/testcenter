## handle long file names
alter table logins modify source varchar(120) not null;
alter table files modify id varchar(120) null;

## differentiate XX and Xx as different logins
alter table logins modify name varchar(50) binary not null;
alter table login_sessions modify name varchar(50) binary not null;