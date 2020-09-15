<?php
declare(strict_types=1);

use Slim\App;

$app->group('/workspace', function(App $app) {

    $app->get('/{ws_id}', [WorkspaceController::class, 'get'])
        ->add(new IsWorkspacePermitted('MO'));

    $app->get('/{ws_id}/reviews', [WorkspaceController::class, 'getReviews'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/results', [WorkspaceController::class, 'getResults'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/responses', [WorkspaceController::class, 'getResponses'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/responses', [WorkspaceController::class, 'deleteResponses'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/logs', [WorkspaceController::class, 'getLogs'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/validation', [WorkspaceController::class, 'validation'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/file/{type}/{filename}', [WorkspaceController::class, 'getFile'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->post('/{ws_id}/file', [WorkspaceController::class, 'postFile'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/files', [WorkspaceController::class, 'getFiles'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/files', [WorkspaceController::class, 'deleteFiles'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/sys-check/reports', [WorkspaceController::class, 'getSysCheckReports'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/sys-check/reports/overview', [WorkspaceController::class, 'getSysCheckReportsOverview'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/sys-check/reports', [WorkspaceController::class, 'deleteSysCheckReports'])
        ->add(new IsWorkspacePermitted('RW'));

})
    ->add(new RequireToken('admin'));

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

$app->group('/workspace', function(App $app) {

    $app->patch('/{ws_id}/tests/unlock', [WorkspaceController::class, 'patchUnlock']);  // TODO name more RESTful

    $app->patch('/{ws_id}/tests/lock', [WorkspaceController::class, 'patchLock']);

    $app->get('/{ws_id}/status', [WorkspaceController::class, 'getStatus']);

    $app->get('/{ws_id}/booklets/started', [WorkspaceController::class, 'getBookletsStarted']);
})
    ->add(new IsWorkspaceMonitor())
    ->add(new RequireToken('person'));

