<?php
declare(strict_types=1);

use Slim\App;

$app->group('/test', function(App $app) {

    $app->put('', [TestController::class, 'put']);

    $app->get('/{test_id}', [TestController::class, 'get']);

    $app->get('/{test_id}/unit/{unit_name}[/alias/{alias}]', [TestController::class, 'getUnit']);

    $app->get('/{test_id}/resource/{resource_name}', [TestController::class, 'getResource']);

    $app->put('/{test_id}/unit/{unit_name}/review', [TestController::class, 'putUnitReview'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/review', [TestController::class, 'putReview'])
        ->add(new IsTestWritable());

    $app->put('/{test_id}/unit/{unit_name}/response', [TestController::class, 'putUnitResponse'])
        ->add(new IsTestWritable());

    $app->patch('/{test_id}/unit/{unit_name}/restorepoint', [TestController::class, 'patchUnitRestorepoint'])
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
