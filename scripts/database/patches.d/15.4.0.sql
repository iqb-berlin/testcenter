alter table file_relations
  modify relationship_type enum ('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'usesScheme', 'unknown') not null;

alter table tests
  add file_id varchar(50) not null,
  modify name varchar(250) not null;

update tests set file_id = name;