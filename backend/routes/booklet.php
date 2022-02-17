<?php
declare(strict_types=1);

use Slim\App;

global $app;

$app->group('/booklet', function(App $app) {

    $app->get('/{booklet_name}/data', [BookletController::class, 'getData']);
    $app->get('/{booklet_name}',[BookletController::class, 'getBooklet']);
})
    ->add(new RequireToken('person'));
