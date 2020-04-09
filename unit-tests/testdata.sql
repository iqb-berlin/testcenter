INSERT INTO admin_sessions (token, user_id, valid_until) VALUES('admin_token', 1, '2222-01-01 00:00:00');
INSERT INTO `users` VALUES (1,'super','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,1);
INSERT INTO `users` VALUES (2,'i_exist_but_am_not_allowed_anything','f75b1eaaf7cd2d28210b360435259648aff4cecb',NULL,0);
INSERT INTO `workspace_users` VALUES (1,1,'RW');
INSERT INTO `workspaces` VALUES (1,'example_workspace');

INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name)
VALUES (1, 'test', 'run-hot-return', 1, '2030-01-02 10:00:00', 'nice_token', '{"xxx":["BOOKLET.SAMPLE"]}', 'sample_group');
INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name)
VALUES (2, 'test', 'run-hot-return', 1, '2000-01-02 10:00:00', 'expired_token', '{"xxx":["BOOKLET.SAMPLE"]}', 'sample_group');
