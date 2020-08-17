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
