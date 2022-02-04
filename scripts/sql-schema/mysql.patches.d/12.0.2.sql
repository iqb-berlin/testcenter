-- While updating to 12.0.0, it occurred, that the update script failed in the middle, when
-- there was unit with a null-entry for responses.
-- This script should fix it: transfer the data and finish the script correctly.

alter table unit_data modify content text null;

drop procedure if exists fix_broken_responses_migration;
insert into meta(metaKey, value, category) values ('12.0.2', 'started', 'debug fix_broken_responses_migration');


create procedure fix_broken_responses_migration()
    begin

    insert into meta(metaKey, value, category) values ('fix_broken_responses_migration called', '1', 'debug fix_broken_responses_migration');

    if exists (select * from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'units' and COLUMN_NAME = 'responses')
    then

        insert into meta(metaKey, value, category) values ('fix_broken_responses_migration if', ' 2', 'debug fix_broken_responses_migration');

        insert unit_data (unit_id, part_id, content, ts, response_type)
            (
                select id,
                       'all',
                       responses,
                       responses_ts,
                       responsetype
                from units as u
                where not exists(
                        select * from unit_data as ud where ud.unit_id = u.id
                    )
            );

        alter table units drop column responses;
        alter table units drop column responsetype;
        alter table units drop column responses_ts;
        alter table units drop column restorepoint;
        alter table units drop column restorepoint_ts;
    end if;
end;


call fix_broken_responses_migration();
