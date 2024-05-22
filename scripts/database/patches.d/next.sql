alter table
  unit_reviews
add column page int8 null,
add column pageLabel varchar(255) null,
add column user_agent varchar(512) not null default '';

alter table
  test_reviews
add column user_agent varchar(512) not null default '';
