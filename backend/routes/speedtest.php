<?php
declare(strict_types=1);

use Slim\App;

global $app;

$app->group('/speed-test', function(App $app) {

    $app->get('/random-package/{size}', [SpeedtestController::class, 'getRandomPackage']);

    $app->post('/random-package', [SpeedtestController::class, 'postRandomPackage']);
});
