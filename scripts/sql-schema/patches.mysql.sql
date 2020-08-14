-- patches for validity time control https://github.com/iqb-berlin/testcenter-iqb-php/issues/67
alter table persons modify valid_until timestamp default NULL null;
alter table logins modify valid_until timestamp default NULL null;

-- patches to keep custom Texts in db https://github.com/iqb-berlin/testcenter-iqb-php/issues/53
alter table logins add customTexts text;

-- various changes for the sake of better wording
rename table booklets to tests;
rename table bookletlogs to test_logs;
rename table bookletreviews to test_reviews;
alter table logins change booklet_def codes_to_booklets text null;
alter table test_reviews drop column reviewer;
rename table admintokens to admin_sessions;
rename table logins to login_sessions;
rename table persons to person_sessions;
rename table unitlogs to unit_logs;
rename table unitreviews to unit_reviews;
alter table admin_sessions change id token varchar(50) not null;
alter table login_sessions change customTexts custom_texts text null;
alter table login_sessions change groupname group_name varchar(100) not null;
alter table unit_reviews drop column reviewer;

-- for group-monitor
alter table tests add running tinyint(1) default 0 not null;

-- for group-monitor command
create unique index person_sessions_id_uindex
    on person_sessions (id);

create table test_commands
(
    id bigint UNSIGNED not null auto_increment primary key,
    uuid varchar(50) not null unique,
    test_id bigint UNSIGNED not null,
    keyword varchar(50) not null,
    parameter text null,
    commander_id bigint UNSIGNED null,
    constraint test_commands_person_sessions_id_fk
        foreign key (commander_id) references person_sessions (id)
            on delete set null,
    constraint test_commands_tests_id_fk
        foreign key (test_id) references tests (id)
            on delete cascade
);

create unique index test_commands_id_uindex
    on test_commands (id);
