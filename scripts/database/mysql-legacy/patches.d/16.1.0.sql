-- start migration of duplicates
-- step 1: delete duplicate tests that are empty (=empty laststate)
delete t
from tests t
where t.id in (select id from (select id, row_number() over (partition by name, person_id order by laststate) as rn from tests) rankedName where rn > 1 and laststate = '{}');

-- step 2: reroute dependencies of duplicates that are not empty
-- step 2a: test_logs
with duplicates as (
  select
    min(t1.id) as lowest_duplicate_id,
    t2.id as other_duplicate_id
  from tests as t1
       left join tests as t2 on t1.name = t2.name and t1.person_id = t2.person_id
  where t1.id < t2.id
  group by t2.id
)
update
  test_logs
set
  test_logs.booklet_id = (select lowest_duplicate_id from duplicates where booklet_id = other_duplicate_id)
where booklet_id in (select other_duplicate_id from duplicates);


-- step 2b: test_reviews
with duplicates as (
  select
    min(t1.id) as lowest_duplicate_id,
    t2.id as other_duplicate_id
  from tests as t1
       left join tests as t2 on t1.name = t2.name and t1.person_id = t2.person_id
  where t1.id < t2.id
  group by t2.id
)
update
  test_reviews
set
  test_reviews.booklet_id = (select lowest_duplicate_id from duplicates where booklet_id = other_duplicate_id)
where booklet_id in (select other_duplicate_id from duplicates);

-- step 2c: units
with duplicates as (
  select
    min(t1.id) as lowest_duplicate_id,
    t2.id as other_duplicate_id
  from tests as t1
       left join tests as t2 on t1.name = t2.name and t1.person_id = t2.person_id
  where t1.id < t2.id
  group by t2.id
)
update
  units
set
  units.booklet_id = (select lowest_duplicate_id from duplicates where booklet_id = other_duplicate_id)
where booklet_id in (select other_duplicate_id from duplicates);

-- step 2d: test_commands don't need to be migrated as they all live in parallel to each other

-- step 3: delete the written test duplicates
with duplicates as (
  select
    min(t1.id) as lowest_duplicate_id,
    t2.id as other_duplicate_id
  from tests as t1
       left join tests as t2 on t1.name = t2.name and t1.person_id = t2.person_id
  where t1.id < t2.id
  group by t2.id
)
delete from tests where id in (select other_duplicate_id from duplicates);

-- migration of duplicates complete

alter table tests modify file_id varchar(50) comment 'This is the real field mapping to the booklet ID, can have same value more than once. `name` has additional information regarding adaptivity and the pre-configured state of the test.';
alter table tests modify name varchar(250) comment 'This includes the file_id + the symbol "#" for further information for adaptivity and the pre-configured state of the test - the combination of all configs must be unique';

alter table tests add unique (person_id, name);

