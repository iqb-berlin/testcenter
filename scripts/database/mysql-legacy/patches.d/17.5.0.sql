alter table test_reviews
  add column id bigint unsigned auto_increment primary key first;

alter table unit_reviews
  add column id bigint unsigned auto_increment primary key first;


alter table test_reviews
  add column person_id bigint unsigned null after booklet_id,
  add constraint fk_test_reviews_person
    foreign key (person_id) references person_sessions(id)
      on delete cascade;

alter table unit_reviews
  add column person_id bigint unsigned null after unit_name,
  add constraint fk_unit_reviews_person
    foreign key (person_id) references person_sessions(id)
      on delete cascade;

create index idx_test_reviews_person on test_reviews(person_id);
create index idx_unit_reviews_person on unit_reviews(person_id);

alter table test_reviews
  add column reviewer varchar(255) default null after entry;

alter table unit_reviews
  add column reviewer varchar(255) default null after entry;