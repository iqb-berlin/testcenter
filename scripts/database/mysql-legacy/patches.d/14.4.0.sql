-- A) Add missing foreign key
delete from unit_data where unit_id not in (select id from units);

alter table unit_data
  add constraint unit_data_units_id_fk
    foreign key (unit_id) references units (id) on delete cascade;

-- B) In order to make it impossible two have more than one login of one name,

-- 1.) link all person_sessions which are linking to duplicate login_sessions to the correct login_session instead
with
  replaceIds as (
    select ls1.name, ls1.id as replaceThis, min(ls2.id) as replaceWith
    from login_sessions ls1
      inner join login_sessions ls2 on ls2.name = ls1.name and ls1.id > ls2.id
    group by ls1.id
  )
update
  person_sessions
set
  login_sessions_id = (select replaceWith from replaceIds where replaceThis = login_sessions_id)
where
  login_sessions_id in (select replaceThis from replaceIds);

-- 2.) remove those duplicate login_sessions
with
  firstIds as (
    select ls1.name, ls1.id as firstId, min(ls2.id) as replaceWith
    from login_sessions ls1
         inner join login_sessions ls2 on ls2.name = ls1.name and ls1.id > ls2.id
    group by ls1.id
  )
delete from login_sessions
where id in (select firstId from firstIds);

-- 3.) make name unique in login_session_table
alter table login_sessions
  add constraint unique_login_session
    unique (name);

-- Prevent creation of two person_sessions for one login_session where only one is allowed

-- 1.) rename duplicate name suffixes
with duplicates as (
  select p1.id
  from person_sessions as p1
    left join person_sessions as p2 on p1.login_sessions_id = p2.login_sessions_id and p1.name_suffix = p2.name_suffix
  where p1.id != p2.id
)
update
  person_sessions
set
  name_suffix = name_suffix || '_' || person_sessions.id
where id in (select id from duplicates);

-- 2.) make name_suffix unique for given login_sessions_id in person_sessions
alter table person_sessions
  add constraint unique_person_session
    unique (login_sessions_id, name_suffix);

-- make token unique for person_sessions

-- 1.) duplicate tokens are *extremely* unlikely. But if we don't want to get an error if they exist for some reason.
with duplicates as (
  select p1.id
  from person_sessions as p1
       left join person_sessions as p2 on p1.token = p2.token
  where p1.id != p2.id
)
update
  person_sessions
set
  token = 'this_was_a_duplicate_token_before_update_' || id
where id in (select id from duplicates);

-- 2.) make token unique for person_sessions
alter table person_sessions
  add constraint unique_person_session_token
    unique (token);
