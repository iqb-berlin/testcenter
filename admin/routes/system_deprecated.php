<?php


use Slim\Http\Response;
use Slim\App;
use Slim\Http\Request;

$app->group('/php/sys.php', function(App $app) {

    $app->get('/workspaces', function (Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $user = $request->getQueryParam('u', '');
        if (strlen($user) > 0) {
            $response = $app->subRequest('GET', "/user/{$user}/workspaces", '', $request->getHeaders());
        } else {
            $response = $app->subRequest('GET', "/workspaces", '', $request->getHeaders());
        }

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/workspace/add', function (Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $requestBody = json_decode($request->getBody());
        $name = isset($requestBody->n) ? $requestBody->n : "";

        $response = $app->subRequest(
            'PUT',
            "/workspace",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            json_encode(array('name' => $name))
        );

        return $response->withHeader("Warning", "endpoint deprecated");
    });

})->add(new NormalAuth());
