alter table tests modify file_id varchar(50) comment 'This is the real field mapping to the booklet ID, can have same value more than once. `name` has additional information regarding adaptivity and the pre-configured state of the test.';
alter table tests modify name varchar(250) comment 'This includes the file_id + the symbol "#" for further information for adaptivity and the pre-configured state of the test - the combination of all configs must be unique';

alter table tests add unique (person_id, name);

