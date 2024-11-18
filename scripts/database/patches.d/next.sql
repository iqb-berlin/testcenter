start transaction;

alter table units
  add column laststate_update_ts text after laststate;

with duplicates as (
  select u1.id
  from units as u1
       left join units as u2 on u1.name = u2.name and u1.booklet_id = u2.booklet_id
  where u1.id > u2.id
)
update
  units
set
  name = name || ' (duplicate id: ' || id || ')'
where id in (select id from duplicates);

alter table units
  change booklet_id test_id bigint unsigned not null,
  add constraint unique (test_id, name);

-- unit_data
alter table unit_data
  collate = utf8mb3_german2_ci,
  add unit_name varchar(50) not null after part_id,
  add test_id bigint unsigned not null after unit_name;

update unit_data
  inner join units on unit_data.unit_id = units.id
set
  unit_data.unit_name = units.name,
  unit_data.test_id = units.test_id;

alter table unit_data
  drop foreign key unit_data_units_id_fk,
  drop primary key,
  add primary key (part_id, test_id, unit_name),
  add constraint unit_data_fk
    foreign key (test_id, unit_name) references units (test_id, name)
      on delete cascade,
  drop column unit_id;



-- reviews

alter table unit_reviews
  add unit_name varchar(50) not null first,
  add test_id bigint unsigned not null after unit_name;

update unit_reviews
  left join units on unit_reviews.unit_id = units.id
set
  unit_name = units.name,
  unit_reviews.test_id = units.test_id;

create index unit_reviews_unit_index
  on unit_reviews (unit_name, test_id);

alter table unit_reviews
  drop foreign key fk_review_unit;

drop index index_fk_review_unit on unit_reviews;

alter table unit_reviews
  drop column unit_id,
  add constraint unit_reviews_fk
    foreign key (test_id, unit_name) references units (test_id, name)
      on delete cascade;


-- logs
alter table unit_logs
  add unit_name varchar(50) not null first,
  add test_id bigint unsigned not null after unit_name;

update unit_logs
  left join units on unit_logs.unit_id = units.id
set
  unit_name = units.name,
  unit_logs.test_id = units.test_id;

alter table unit_logs
  drop foreign key fk_log_unit,
  drop column unit_id,
  add constraint unit_logs_fk
    foreign key (test_id, unit_name) references units (test_id, name)
      on delete cascade;

-- units itself
alter table units
  drop primary key,
  add primary key (test_id, name),
  drop column id;

commit;