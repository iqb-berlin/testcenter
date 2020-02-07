<?php

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php/sys.php', function(App $app) {

    $dbConnection = new DBConnectionSuperAdmin();


    $app->post('/user/add', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app, $dbConnection) {

        $response = $app->subRequest(
            'PUT',
            "/user",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            $request->getBody()
        );
        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });


    $app->post('/user/pw', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app, $dbConnection) {

        $requestBody = json_decode($request->getBody());
        $user = $dbConnection->getUserByName($requestBody->n);

        if (!$user) {
            throw new HttpBadRequestException($request, "User not found " . print_r($user,1));
        }

        $response = $app->subRequest(
            'PATCH',
            "/user/{$user['id']}/password",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            $request->getBody()
        );
        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });


    $app->post('/users/delete', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app, $dbConnection) {

        $response = $app->subRequest(
            'DELETE',
            "/users",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            $request->getBody()
        );
        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });


    $app->post('/user/workspaces', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app, $dbConnection) {

        $requestBody = json_decode($request->getBody());
        $user = $dbConnection->getUserByName($requestBody->u);

        $response = $app->subRequest(
            'PATCH',
            "/user/{$user['id']}/workspaces",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            json_encode(array('ws' => $requestBody->ws))
        );
        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });

})->add(new NormalAuth());
