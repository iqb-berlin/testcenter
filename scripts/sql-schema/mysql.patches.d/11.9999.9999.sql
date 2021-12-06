SET GLOBAL SQL_MODE = "NO_AUTO_VALUE_ON_ZERO,PIPES_AS_CONCAT";

create table unit_data (
  unit_id bigint(20) unsigned,
  part_id varchar(50) not null,
  content text not null,
  ts bigint(20) NOT NULL DEFAULT '0',
  response_type varchar(50),
  constraint unit_data_pk primary key (unit_id, part_id)
);

alter table unit_data
    add constraint unit_data_units_id_fk
        foreign key (unit_id) references units (id) on delete cascade;

insert unit_data (unit_id, part_id, content, ts, response_type)
(select id, 'all', responses, responses_ts, responsetype from units);

alter table units drop column responses;
alter table units drop column responsetype;
alter table units drop column responses_ts;
alter table units drop column restorepoint;
alter table units drop column restorepoint_ts;

