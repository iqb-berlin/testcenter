INSERT INTO admin_sessions (token, user_id, valid_until) VALUES('admin_token', 1, '2222-01-01 00:00:00');
INSERT INTO `users` VALUES (1,'super','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,1);
INSERT INTO `users` VALUES (2,'i_exist_but_am_not_allowed_anything','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,0);
INSERT INTO `workspace_users` VALUES (1,1,'RW');
INSERT INTO `workspaces` VALUES (1,'example_workspace');

INSERT INTO logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
VALUES ('test', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

INSERT INTO logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
VALUES ('test-expired', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2000-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

INSERT INTO logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
VALUES ('monitor', 'pw_hash', 'monitor-group', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

INSERT INTO logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
VALUES ('sample_user', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

INSERT INTO logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
VALUES ('future_user', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', '2030-01-02 10:00:00', '2040-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');


INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('test', 1, 'nice_token');

INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('test-expired', 1, 'expired_token');

INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('monitor', 1, 'monitor_token');

INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('sample_user', 1, 'test_token');

INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('future_user', 1, 'future_token');

INSERT INTO login_sessions (name, workspace_id, token)
VALUES ('session_of_deleted_login', 1, 'deleted_login_token');

INSERT INTO person_sessions(code, login_sessions_id, valid_until, token)
VALUES ('xxx', 4, '2030-01-02 10:00:00', 'person-token');

INSERT INTO person_sessions(code, login_sessions_id, valid_until, token)
VALUES ('xxx', 4, '2010-01-02 10:00:00', 'expired-person-token');

INSERT INTO person_sessions(code, login_sessions_id, valid_until, token)
VALUES ('', 2, '2000-01-02 10:00:00', 'person-of-expired-login-token');

INSERT INTO person_sessions(code, login_sessions_id, valid_until, token)
VALUES ('', 5, '2040-01-02 10:00:00', 'person-of-future-login-token');

INSERT INTO tests (id, name, person_id, laststate, locked, label)
VALUES (1, 'first sample test', 1, '{"CURRENT_UNIT_ID":"UNIT_1"}', 0, 'first tests label');

INSERT INTO tests (id, name, person_id, laststate, locked, label)
VALUES (0, 'BOOKLET.SAMPLE-1', 0, '{"CURRENT_UNIT_ID":"UNIT_1"}', 0, 'first tests label');

INSERT INTO units (id, name, booklet_id, laststate)
VALUES (1, 'UNIT_1', 1, '{"SOME_STATE":"WHATEVER"}');

INSERT INTO units (id, name, booklet_id, laststate)
VALUES (2, 'UNIT.SAMPLE', 0, '{"PRESENTATIONCOMPLETE":"yes"}');

INSERT INTO unit_logs (unit_id, logentry, timestamp)
VALUES (2, 'sample unit log', 1597903000);

INSERT INTO test_logs (booklet_id, logentry, timestamp)
VALUES (0, 'sample log entry', 1597903000);

INSERT INTO test_reviews (booklet_id, reviewtime, priority, categories, entry)
VALUES (0, '2030-01-01 12:00:00', 1, '', 'sample booklet review');

INSERT INTO unit_reviews (unit_id, reviewtime, priority, categories, entry)
VALUES (2, '2030-01-01 12:00:00', 1, '', 'this is a sample unit review');

insert into test_commands(id, test_id, keyword, parameter, commander_id, timestamp) values (1, 1, 'COMMAND_C', '[]', 3, 1597903000);
insert into test_commands(id, test_id, keyword, parameter, commander_id, timestamp) values (2, 1, 'COMMAND_A', '["param1"]', 3, 1597900000);
insert into test_commands(id, test_id, keyword, parameter, commander_id, timestamp) values (3, 1, 'COMMAND_D', '["param1", "param2"]', null, 1597904000);
insert into test_commands(id, test_id, keyword, parameter, commander_id, timestamp) values (4, 1, 'COMMAND_B', '', 3, 1597901000);
insert into test_commands(id, test_id, keyword, parameter, commander_id, timestamp) values (1, 2, 'COMMAND_X', '', 3, 1597902000);


insert into meta(category, metaKey, value) values ('cat1', 'keyA', 'valueA');
insert into meta(category, metaKey, value) values ('cat1', 'keyB', 'valueB');
insert into meta(category, metaKey, value) values ('cat2', 'keyA', 'valueA');
insert into meta(category, metaKey, value) values ('cat2', 'keyB', 'valueB');
insert into meta(category, metaKey, value) values (null, 'key-no-cat', 'value-no-cat');

insert into unit_data (unit_id, part_id, content, ts, response_type) values (1, 'all', '{"name":"Sam Sample","age":34}', 1597903000, 'the-response-type');
insert into unit_data (unit_id, part_id, content, ts, response_type) values (2, 'all', '{"name":"Elias Example","age":35}', 1597903000, 'the-response-type');
insert into unit_data (unit_id, part_id, content, ts, response_type) values (2, 'other', '{"other":"stuff"}', 1597903000, 'the-response-type');