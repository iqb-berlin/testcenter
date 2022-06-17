insert into `users` values (1,'super','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,1);
insert into `users` values (2,'i_exist_but_am_not_allowed_anything','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,0);
insert into admin_sessions (token, user_id, valid_until) values('admin_token', 1, '2222-01-01 00:00:00');
insert into admin_sessions (token, user_id, valid_until) values('other_admin_token', 2, '2222-01-01 00:00:00');
insert into `workspaces` values (1,'example_workspace');
insert into `workspace_users` values (1, 1, 'RW');


insert into logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
values ('test', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

insert into logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
values ('test-expired', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2000-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

insert into logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
values ('monitor', 'pw_hash', 'monitor-group', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

insert into logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
values ('sample_user', 'pw_hash', 'run-hot-return', 1, '{"xxx":["BOOKLET.SAMPLE-1"]}', 'testdata.sql', null, '2030-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');

insert into logins (name, password, mode, workspace_id, codes_to_booklets, source, valid_from, valid_to, valid_for, group_name, group_label, custom_texts)
values ('future_user', 'pw_hash', 'run-hot-return', 1, '{}', 'testdata.sql', '2030-01-02 10:00:00', '2040-01-02 10:00:00', null, 'sample_group', 'Sample Group', '');


insert into login_sessions (name, workspace_id, group_name, token)
values ('test', 1, 'sample_group', 'nice_token');

insert into login_sessions (name, workspace_id, group_name, token)
values ('test-expired', 1, 'sample_group', 'expired_token');

insert into login_sessions (name, workspace_id, group_name, token)
values ('monitor', 1, 'sample_group', 'monitor_token');

insert into login_sessions (name, workspace_id, group_name, token)
values ('sample_user', 1, 'sample_group', 'test_token');

insert into login_sessions (name, workspace_id, group_name, token)
values ('future_user', 1, 'sample_group', 'future_token');

insert into login_sessions (name, workspace_id, group_name, token)
values ('session_of_deleted_login', 1, 'sample_group', 'deleted_login_token');

insert into person_sessions(code, login_sessions_id, valid_until, token, name_suffix)
values ('xxx', 4, '2030-01-02 10:00:00', 'person-token', 'xxx');

insert into person_sessions(code, login_sessions_id, valid_until, token, name_suffix)
values ('xxx', 4, '2010-01-02 10:00:00', 'expired-person-token', 'xxx');

insert into person_sessions(code, login_sessions_id, valid_until, token, name_suffix)
values ('', 2, '2000-01-02 10:00:00', 'person-of-expired-login-token', '');

insert into person_sessions(code, login_sessions_id, valid_until, token, name_suffix)
values ('', 5, '2040-01-02 10:00:00', 'person-of-future-login-token', '');

insert into tests (name, person_id, laststate, locked, label, running, timestamp_server)
values ('first sample test', 1, '{"CURRENT_UNIT_ID":"UNIT_1"}', 0, 'first test label', 1, 1643014459);

insert into tests (name, person_id, laststate, locked, label, running, timestamp_server)
values ('BOOKLET.SAMPLE-1', 1, '', 0, 'second test label', 1, 1643014459);

insert into units (name, booklet_id, laststate)
values ('UNIT_1', 1, '{"SOME_STATE":"WHATEVER"}');

insert into units (name, booklet_id, laststate)
values ('UNIT.SAMPLE', 1, '{"PRESENTATIONCOMPLETE":"yes"}');

insert into unit_logs (unit_id, logentry, timestamp)
values (2, 'sample unit log', 1597903000);

insert into test_logs (booklet_id, logentry, timestamp)
values (1, 'sample log entry', 1597903000);

insert into test_reviews (booklet_id, reviewtime, priority, categories, entry)
values (1, '2030-01-01 12:00:00', 1, '', 'sample booklet review');

insert into unit_reviews (unit_id, reviewtime, priority, categories, entry)
values (2, '2030-01-01 12:00:00', 1, '', 'this is a sample unit review');

insert into unit_data (unit_id, part_id, content, ts, response_type)
values (1, 'all', '{"name":"Sam Sample","age":34}', 1597903000, 'the-response-type');

insert into unit_data (unit_id, part_id, content, ts, response_type)
values (2, 'all', '{"name":"Elias Example","age":35}', 1597903000, 'the-response-type');

insert into unit_data (unit_id, part_id, content, ts, response_type)
values (2, 'other', '{"other":"stuff"}', 1597903000, 'the-response-type');


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

insert into files(workspace_id, name, id, label, description, type)
values(1, 'Booklet.xml', 'BOOKLET.SAMPLE-1', 'Sample Booklet Label', 'Desc', 'Booklet');

insert into files(workspace_id, name, id, label, description, type)
values(1, 'Booklet-no-test.xml', 'BOOKLET.NO.TEST', 'Booklet without test', 'No test yet', 'Booklet');
