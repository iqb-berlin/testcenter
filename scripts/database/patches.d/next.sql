create table login_session_groups (
  group_name varchar(50) not null
    primary key,
  group_label text not null,
  token varchar(50) not null,
  constraint login_session_groups_unique_token
    unique (token)
);
-- TODO X foreign key