<?php
declare(strict_types=1);

use Slim\App;

global $app;

$app->group('/user', function(App $app) {

    $app->get('/{user_id}/workspaces', [UserController::class, 'getWorkspaces']);

    $app->patch('/{user_id}/workspaces', [UserController::class, 'patchWorkspaces']);

    $app->put('', [UserController::class, 'putUser']);

    $app->patch('/{user_id}/password', [UserController::class, 'patchPassword']);

    $app->patch('/{user_id}/super-admin/{to_status}', [UserController::class, 'patchSuperAdminStatus']);
})
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));
