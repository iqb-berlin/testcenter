drop table test_commands;

create table test_commands
(
    id bigint UNSIGNED not null,
    test_id bigint UNSIGNED not null,
    keyword varchar(50) not null,
    parameter text null,
    commander_id bigint UNSIGNED null,
    timestamp timestamp not null,
    executed bool null default 0,
    primary key (id, test_id),
    constraint test_commands_person_sessions_id_fk
        foreign key (commander_id) references person_sessions (id)
            on delete set null,
    constraint test_commands_tests_id_fk
        foreign key (test_id) references tests (id)
            on delete cascade
);

create unique index test_commands_id_uindex on test_commands (id, test_id);
