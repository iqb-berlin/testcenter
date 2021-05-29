INSERT INTO admin_sessions (token, user_id, valid_until) VALUES('admin_token', 1, '2222-01-01 00:00:00');
INSERT INTO `users` VALUES (1,'super','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,1);
INSERT INTO `users` VALUES (2,'i_exist_but_am_not_allowed_anything','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,0);
INSERT INTO `workspace_users` VALUES (1,1,'RW');
INSERT INTO `workspaces` VALUES (1,'example_workspace');

INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name)
VALUES (1, 'test', 'run-hot-return', 1, '2030-01-02 10:00:00', 'nice_token', '{"xxx":["BOOKLET.SAMPLE-1"]}', 'sample_group');

INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name)
VALUES (2, 'test', 'run-hot-return', 1, '2000-01-02 10:00:00', 'expired_token', '{"xxx":["BOOKLET.SAMPLE-1"]}', 'sample_group');

INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name)
VALUES (3, 'monitor', 'monitor-group', 1, '2030-01-02 10:00:00', 'monitor_token', '', 'sample_group');


INSERT INTO tests (id, name, person_id, laststate, locked, label)
VALUES (1, 'first sample test', 1, '{"CURRENT_UNIT_ID":"UNIT_1"}', 0, 'first tests label');

INSERT INTO units (id, name, booklet_id, laststate, responses, responsetype, responses_ts, restorepoint, restorepoint_ts)
VALUES (1, 'UNIT_1', 1, '{"SOME_STATE":"WHATEVER"}', '"some responses"', '', 1597903000, '"restore point"', 1597903000);

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
