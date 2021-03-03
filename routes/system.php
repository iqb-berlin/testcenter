<?php
declare(strict_types=1);

global $app;

$app->get('/', [SystemController::class, 'get']);

$app->get('/workspaces', [SystemController::class, 'getWorkspaces'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->delete('/workspaces', [SystemController::class, 'deleteWorkspaces'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->get('/users', [SystemController::class, 'getUsers'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->delete('/users', [SystemController::class, 'deleteUsers'])
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));

$app->get('/list/routes', [SystemController::class, 'getListRoutes']);

$app->get('/version', [SystemController::class, 'getVersion']);

$app->get('/system/config', [SystemController::class, 'getSystemConfig']);

$app->get('/flush-broadcasting-service', [SystemController::class, 'getFlushBroadcastingService']);

$app->get('/sys-checks', [SystemController::class, 'getSysChecks']);
