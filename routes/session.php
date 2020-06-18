<?php
declare(strict_types=1);

$app->put('/session/admin', [SessionController::class, 'putSessionAdmin']);


$app->put('/session/login', [SessionController::class, 'putSessionLogin']);


$app->put('/session/person', [SessionController::class, 'putSessionPerson'])
    ->add(new RequireToken('login'));


$app->get('/session', [SessionController::class, 'getSession'])
    ->add(new RequireToken('login', 'person', 'admin'));
