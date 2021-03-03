<?php
declare(strict_types=1);

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

global $app;

$app->group('/speed-test', function(App $app) {

    $app->get('/random-package/{size}', [SpeedtestController::class, 'getRandomPackage']);

    $app->post('/random-package', [SpeedtestController::class, 'postRandomPackage']);
});
