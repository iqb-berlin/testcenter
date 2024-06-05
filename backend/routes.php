<?php
declare(strict_types=1);

use Slim\Routing\RouteCollectorProxy;

global $app;

$app->get('/', [SystemController::class, 'get']);

$app->group('/booklet', function(RouteCollectorProxy $group) {
  /* @deprecated */
  $group->get('/{booklet_name}/data', [BookletController::class, 'getData']);

  $group->get('/{booklet_name}', [BookletController::class, 'getBooklet']);
})
  ->add(new RequireToken('person'));

$app->get('/flush-broadcasting-service', [SystemController::class, 'getFlushBroadcastingService']);

$app->post('/clear-cache', [SystemController::class, 'postClearCache']);

$app->get('/list/routes', [SystemController::class, 'getListRoutes']);

$app->group('/monitor', function(RouteCollectorProxy $group) {
  /* @deprecated */
  $group->get('/group/{group_name}', [MonitorController::class, 'getGroup']);

  $group->get('/test-sessions', [MonitorController::class, 'getTestSessions']);

  $group->get('/group/{group_name}/test-sessions', [MonitorController::class, 'getTestSessions']);

  $group->put('/command', [MonitorController::class, 'putCommand']);

  $group->post('/group/{group_name}/tests/unlock', [MonitorController::class, 'postUnlock']);

  $group->post('/group/{group_name}/tests/lock', [MonitorController::class, 'postLock']);
})
  ->add(new IsGroupMonitor())
  ->add(new RequireToken('person'));

$app->get('/session', [SessionController::class, 'getSession'])
  ->add(new RequireToken('login', 'person', 'admin'));

$app->put('/session/admin', [SessionController::class, 'putSessionAdmin']);

$app->put('/session/login', [SessionController::class, 'putSessionLogin']);

$app->put('/session/person', [SessionController::class, 'putSessionPerson'])
  ->add(new RequireToken('login'));

$app->delete('/session', [SessionController::class, 'deleteSession'])
  ->add(new RequireToken('person', 'login', 'admin'));

$app->group('/speed-test', function(RouteCollectorProxy $group) {
  $group->get('/random-package/{size}', [SpeedtestController::class, 'getRandomPackage']);

  $group->post('/random-package', [SpeedtestController::class, 'postRandomPackage']);
});

$app->get('/sys-checks', [SystemController::class, 'getSysChecks']);

$app->get('/system/config', [SystemController::class, 'getConfig']);

$app->patch('/system/config/app', [SystemController::class, 'patchAppConfig'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->patch('/system/config/custom-texts', [SystemController::class, 'patchCustomTexts'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->get('/system/time', [SystemController::class, 'getTime']);

$app->get('/system/status', [SystemController::class, 'getStatus']);

$app->group('/test', function(RouteCollectorProxy $group) {
  $group->put('', [TestController::class, 'put']);

  $group->get('/{test_id}', [TestController::class, 'get'])
    ->add(new IsTestWritable());

  $group->get('/{test_id}/unit/{unit_name}[/alias/{alias}]', [TestController::class, 'getUnit']);

  $group->put('/{test_id}/unit/{unit_name}/review', [TestController::class, 'putUnitReview'])
    ->add(new IsTestWritable());

  $group->put('/{test_id}/review', [TestController::class, 'putReview'])
    ->add(new IsTestWritable());

  $group->put('/{test_id}/unit/{unit_name}/response', [TestController::class, 'putUnitResponse'])
    ->add(new IsTestWritable());

  $group->patch('/{test_id}/state', [TestController::class, 'patchState'])
    ->add(new IsTestWritable());

  $group->put('/{test_id}/log', [TestController::class, 'putLog'])
    ->add(new IsTestWritable());

  $group->patch('/{test_id}/unit/{unit_name}/state', [TestController::class, 'putUnitState'])
    ->add(new IsTestWritable());

  $group->put('/{test_id}/unit/{unit_name}/log', [TestController::class, 'putUnitLog'])
    ->add(new IsTestWritable());

  $group->patch('/{test_id}/lock', [TestController::class, 'patchLock'])
    ->add(new IsTestWritable());

  $group->get('/{test_id}/commands', [TestController::class, 'getCommands']);

  $group->patch('/{test_id}/command/{command_id}/executed', [TestController::class, 'patchCommandExecuted']);

})
  ->add(new RequireToken('person'));

$app->group('/test', function(RouteCollectorProxy $group) {
  $group->post('/{test_id}/connection-lost', [TestController::class, 'postConnectionLost']);
});

$app->group('/attachment/{attachmentId}', function(RouteCollectorProxy $group) {
  $group->get('/file/{fileId}', [AttachmentController::class, 'getFile']);

  $group->delete('/file/{fileId}', [AttachmentController::class, 'deleteFile']);

  $group->post('/file', [AttachmentController::class, 'postFile']);

  $group->get('/data', [AttachmentController::class, 'getData']);

  $group->get('/page', [AttachmentController::class, 'getAttachmentPage']);
})
  ->add(new MayModifyAttachments())
  ->add(new RequireToken('person'));

$app->group('/attachments', function(RouteCollectorProxy $group) {
  $group->get('/list', [AttachmentController::class, 'getList']);

  $group->get('/pages', [AttachmentController::class, 'getAttachmentsPages']);
})
  ->add(new MayModifyAttachments())
  ->add(new RequireToken('person', 'admin'));

$app->get('/workspace/{ws_id}/studyresults', [WorkspaceController::class, 'getResults'])
  ->add(new IsGroupMonitor())
  ->add(new RequireToken('person'));

$app->group('/workspace', function(RouteCollectorProxy $group) {
  /* @deprecated */
  $group->get('/{ws_id}', [WorkspaceController::class, 'get'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->get('/{ws_id}/results', [WorkspaceController::class, 'getResults'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->delete('/{ws_id}/responses', [WorkspaceController::class, 'deleteResponses'])
    ->add(new IsWorkspacePermitted('RW'));

  $group->get('/{ws_id}/file/{type}/{filename}', [WorkspaceController::class, 'getFile'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->post('/{ws_id}/file', [WorkspaceController::class, 'postFile'])
    ->add(new IsWorkspaceBlocked())
    ->add(new IsWorkspacePermitted('RW'));

  $group->get('/{ws_id}/files', [WorkspaceController::class, 'getFiles'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->delete('/{ws_id}/files', [WorkspaceController::class, 'deleteFiles'])
    ->add(new IsWorkspaceBlocked())
    ->add(new IsWorkspacePermitted('RW'));

  $group->get('/{ws_id}/report/{type}', [WorkspaceController::class, 'getReport'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->get('/{ws_id}/sys-check/reports/overview', [WorkspaceController::class, 'getSysCheckReportsOverview'])
    ->add(new IsWorkspacePermitted('RO'));

  $group->delete('/{ws_id}/sys-check/reports', [WorkspaceController::class, 'deleteSysCheckReports'])
    ->add(new IsWorkspacePermitted('RW'));
})
  ->add(new RequireToken('admin'));

$app->group('/user', function(RouteCollectorProxy $group) {
  $group->get('/{user_id}/workspaces', [UserController::class, 'getWorkspaces']);

  $group->patch('/{user_id}/workspaces', [UserController::class, 'patchWorkspaces']);

  $group->put('', [UserController::class, 'putUser']);

  $group->patch('/{user_id}/password', [UserController::class, 'patchPassword']);

  $group->patch('/{user_id}/super-admin/{to_status}', [UserController::class, 'patchSuperAdminStatus']);
})
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->get('/users', [SystemController::class, 'getUsers'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->delete('/users', [SystemController::class, 'deleteUsers'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->get('/version', [SystemController::class, 'getVersion']);

$app->group('/workspace', function(RouteCollectorProxy $group) {
  $group->put('', [WorkspaceController::class, 'put']);

  $group->patch('/{ws_id}', [WorkspaceController::class, 'patch']);

  $group->patch('/{ws_id}/users', [WorkspaceController::class, 'patchUsers']);

  $group->get('/{ws_id}/users', [WorkspaceController::class, 'getUsers']);
})
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->group('/workspace/{ws_id}/sys-check', function(RouteCollectorProxy $group) {
  $group->get('/{sys-check_name}', [WorkspaceController::class, 'getSysCheck']);

  $group->get('/{sys-check_name}/unit-and-player', [WorkspaceController::class, 'getSysCheckUnitAndPLayer']);

  $group->put('/{sys-check_name}/report', [WorkspaceController::class, 'putSysCheckReport']);
});

$app->get('/workspaces', [SystemController::class, 'getWorkspaces'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));

$app->delete('/workspaces', [SystemController::class, 'deleteWorkspaces'])
  ->add(new IsSuperAdmin())
  ->add(new RequireToken('admin'));


$app->get('/file/{group_token}/ws_{ws_id}/{path:.*}', [TestController::class, 'getFile']);