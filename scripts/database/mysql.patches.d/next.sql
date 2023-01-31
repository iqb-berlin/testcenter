-- In order to make it impossible two have more than one login of one name,

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
        select min(id) as firstId
        from login_sessions
    )
delete from login_sessions
where id not in (select firstId from firstIds);

-- 3.) make name unique in login_session_table
alter table login_sessions
    add constraint unique_login_session
        unique (name)