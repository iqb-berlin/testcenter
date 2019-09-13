<?php

/**
 * status: all routes starting with /php -> endpoints are refactored and new route exists. old endpoint points to new one
 */

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php', function(App $app) {

    $app->post('/login.php/login', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $response = $app->subRequest('POST', "/login", '', $request->getHeaders(), array(), $request->getBody()->getContents());

        return $response->withHeader("Warning", "endpoint deprecated");
    });
});
