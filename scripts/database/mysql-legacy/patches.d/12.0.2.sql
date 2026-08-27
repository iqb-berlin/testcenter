# noinspection SqlResolveForFile

start transaction;

create table if not exists unit_data (
    unit_id bigint(20) unsigned,
    part_id varchar(50) not null,
    content text null,
    ts bigint(20) NOT NULL DEFAULT '0',
    response_type varchar(50),
    constraint unit_data_pk primary key (unit_id, part_id)
);

drop procedure if exists data_migration;


create procedure data_migration()
begin

    -- While updating to 12.0.0 with the original 12.0.0 patch, it occurred, that the update script failed in
    -- the middle, when there was unit with a null-entry for responses.
    -- This script should handle even this half-successfully patch

    if exists (select * from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'units' and COLUMN_NAME = 'responses')
    then

        alter table unit_data modify content text null;

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

call data_migration();
drop procedure if exists data_migration;

commit;
