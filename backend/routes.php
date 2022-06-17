<?php
declare(strict_types=1);

use Slim\App;

global $app;

$app->get('/', [SystemController::class, 'get']);

$app->group('/booklet', function(App $app) {

    $app->get('/{booklet_name}/data', [BookletController::class, 'getData']);
    $app->get('/{booklet_name}',[BookletController::class, 'getBooklet']);
})
    ->add(new RequireToken('person'));

$app->get('/flush-broadcasting-service', [SystemController::class, 'getFlushBroadcastingService']);

$app->get('/list/routes', [SystemController::class, 'getListRoutes']);

$app->group('/monitor', function(App $app) {

    $app->get('/group/{group_name}', [MonitorController::class, 'getGroup']);

    $app->get('/test-sessions', [MonitorController::class, 'getTestSessions']);

    $app->put('/command', [MonitorController::class, 'putCommand']);

    $app->post('/group/{group_name}/tests/unlock', [MonitorController::class, 'postUnlock']);

    $app->post('/group/{group_name}/tests/lock', [MonitorController::class, 'postLock']);
})
    ->add(new IsGroupMonitor())
    ->add(new RequireToken('person'));

$app->get('/session', [SessionController::class, 'getSession'])
    ->add(new RequireToken('login', 'person', 'admin'));

$app->put('/session/admin', [SessionController::class, 'putSessionAdmin']);

$app->put('/session/login', [SessionController::class, 'putSessionLogin']);

$app->put('/session/person', [SessionController::class, 'putSessionPerson'])
    ->add(new RequireToken('login'));

$app->group('/speed-test', function(App $app) {

    $app->get('/random-package/{size}', [SpeedtestController::class, 'getRandomPackage']);

    $app->post('/random-package', [SpeedtestController::class, 'postRandomPackage']);
});

$app->get('/sys-checks', [SystemController::class, 'getSysChecks']);

$app->get('/system/config', [SystemController::class, 'getSystemConfig']);

$app->patch('/system/config/app', [SystemController::class, 'patchAppConfig'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->patch('/system/config/custom-texts', [SystemController::class, 'patchCustomTexts'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->get('/system/time', [SystemController::class, 'getSystemTime']);

$app->group('/test', function(App $app) {

    $app->put('', [TestController::class, 'put']);

    $app->get('/{test_id}', [TestController::class, 'get'])
        ->add(new IsTestWritable());

    $app->get('/{test_id}/unit/{unit_name}[/alias/{alias}]', [TestController::class, 'getUnit']);

    $app->get('/{test_id}/resource/{resource_name}', [TestController::class, 'getResource']);

    $app->put('/{test_id}/unit/{unit_name}/review', [TestController::class, 'putUnitReview'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/review', [TestController::class, 'putReview'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/unit/{unit_name}/response', [TestController::class, 'putUnitResponse'])
        ->add(new IsTestWritable());

    $app->patch('/{test_id}/state', [TestController::class, 'patchState'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/log', [TestController::class, 'putLog'])
        ->add(new IsTestWritable());

    $app->patch('/{test_id}/unit/{unit_name}/state', [TestController::class, 'putUnitState'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/unit/{unit_name}/log', [TestController::class, 'putUnitLog'])
        ->add(new IsTestWritable());

    $app->patch('/{test_id}/lock', [TestController::class, 'patchLock'])
        ->add(new IsTestWritable());

    $app->get('/{test_id}/commands', [TestController::class, 'getCommands']);

    $app->patch('/{test_id}/command/{command_id}/executed', [TestController::class, 'patchCommandExecuted']);

})
    ->add(new RequireToken('person'));

$app->group('/test', function(App $app) { // TODO Spec

    $app->post('/{test_id}/connection-lost', [TestController::class, 'postConnectionLost']);
});

$app->group('/workspace', function(App $app) {

    $app->get('/{ws_id}', [WorkspaceController::class, 'get'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/results', [WorkspaceController::class, 'getResults'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/responses', [WorkspaceController::class, 'deleteResponses'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/file/{type}/{filename}', [WorkspaceController::class, 'getFile'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->post('/{ws_id}/file', [WorkspaceController::class, 'postFile'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/files', [WorkspaceController::class, 'getFiles'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/files', [WorkspaceController::class, 'deleteFiles'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/report/{type}', [WorkspaceController::class, 'getReport'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/sys-check/reports/overview', [WorkspaceController::class, 'getSysCheckReportsOverview'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/sys-check/reports', [WorkspaceController::class, 'deleteSysCheckReports'])
        ->add(new IsWorkspacePermitted('RW'));

})
    ->add(new RequireToken('admin'));

$app->group('/user', function(App $app) {

    $app->get('/{user_id}/workspaces', [UserController::class, 'getWorkspaces']);

    $app->patch('/{user_id}/workspaces', [UserController::class, 'patchWorkspaces']);

    $app->put('', [UserController::class, 'putUser']);

    $app->patch('/{user_id}/password', [UserController::class, 'patchPassword']);

    $app->patch('/{user_id}/super-admin/{to_status}', [UserController::class, 'patchSuperAdminStatus']);
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

$app->group('/workspace', function(App $app) {

    $app->put('', [WorkspaceController::class, 'put']);

    $app->patch('/{ws_id}', [WorkspaceController::class, 'patch']);

    $app->patch('/{ws_id}/users', [WorkspaceController::class, 'patchUsers']);

    $app->get('/{ws_id}/users', [WorkspaceController::class, 'getUsers']);
})
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->group('/workspace/{ws_id}/sys-check', function(App $app) {

    $app->get('/{sys-check_name}', [WorkspaceController::class, 'getSysCheck']);

    $app->get('/{sys-check_name}/unit-and-player', [WorkspaceController::class, 'getSysCheckUnitAndPLayer']);

    $app->put('/{sys-check_name}/report', [WorkspaceController::class, 'putSysCheckReport']);
});

$app->get('/workspaces', [SystemController::class, 'getWorkspaces'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->delete('/workspaces', [SystemController::class, 'deleteWorkspaces'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->get('/{auth_token}/resource/{resource_name}', [TestController::class, 'getResource']);

$app->get('/{auth_token}/resource/{package_name}/[{path:.*}]', [TestController::class, 'getResourceFromPackage']);