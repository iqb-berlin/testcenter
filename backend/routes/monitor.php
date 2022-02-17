<?php

use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;

global $app;

$app->group('/monitor', function(App $app) {

    $app->get('/group/{group_name}', [MonitorController::class, 'getGroup']);

    $app->get('/test-sessions', [MonitorController::class, 'getTestSessions']);

    $app->put('/command', [MonitorController::class, 'putCommand']);

    $app->post('/group/{group_name}/tests/unlock', [MonitorController::class, 'postUnlock']);

    $app->post('/group/{group_name}/tests/lock', [MonitorController::class, 'postLock']);
})
    ->add(new IsGroupMonitor())
    ->add(new RequireToken('person'));
