-- patches for validity time control https://github.com/iqb-berlin/testcenter-iqb-php/issues/67
ALTER TABLE persons ALTER COLUMN valid_until DROP NOT NULL;
ALTER TABLE logins ALTER COLUMN valid_until DROP NOT NULL;

-- patches to keep custom Texts in db https://github.com/iqb-berlin/testcenter-iqb-php/issues/53
alter table logins add customTexts text;

-- various changes for the sake of better wording
ALTER TABLE booklets RENAME TO tests;
ALTER TABLE bookletlogs RENAME TO test_logs;
ALTER TABLE bookletreviews RENAME TO test_reviews;

alter table logins RENAME COLUMN booklet_def TO codes_to_booklets;
alter table test_reviews drop column reviewer;

ALTER TABLE admintokens RENAME TO admin_sessions;
ALTER TABLE logins RENAME TO login_sessions;
ALTER TABLE persons RENAME TO person_sessions;
ALTER TABLE unitlogs RENAME TO unit_logs;
ALTER TABLE unitreviews RENAME TO unit_reviews;

alter table admin_sessions RENAME COLUMN id TO token;
alter table login_sessions RENAME COLUMN customTexts TO custom_texts;
alter table login_sessions RENAME COLUMN groupname TO group_name;
alter table unit_reviews drop column reviewer;

-- for new modes (!)
ALTER TABLE "login_sessions"
    ALTER "mode" TYPE character varying(20),
    ALTER "mode" DROP DEFAULT,
    ALTER "mode" SET NOT NULL;
COMMENT ON COLUMN "login_sessions"."mode" IS '';
COMMENT ON TABLE "login_sessions" IS '';

-- for group-monitor
alter table tests add running boolean default false;

-- for group-monitor command
create unique index person_sessions_id_uindex on person_sessions (id);

create table test_commands
(
    id serial primary key,
    test_id integer NOT NULL,
    keyword character varying(50) not null,
    parameter text null,
    commander_id bigint null,
    timestamp timestamp not null default 0,
    executed bool null,
    constraint test_commands_person_sessions_id_fk
        foreign key (commander_id) references person_sessions (id)
            on delete set null,
    constraint test_commands_tests_id_fk
        foreign key (test_id) references tests (id)
            on delete cascade
);

create unique index test_commands_id_uindex on test_commands (id);
alter table test_commands add constraint test_commands_pk primary key (id);

