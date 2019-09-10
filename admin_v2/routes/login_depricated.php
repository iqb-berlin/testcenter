<?php

/**
 * status: all routes starting with /php -> endpoints are refactored and new route exists. old endpoint points to new one
 */

use Slim\App;

$app->group('/php', function(App $app) {

    $app->post('/login.php/login', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $response = $app->subRequest('POST', "/login", '', $request->getHeaders(), array(), $request->getBody()->getContents());

        return $response->withHeader("Warning", "endpoint deprecated");
    });
});
