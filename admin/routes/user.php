<?php

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;


$app->group('/user', function(App $app) {

    $dbConnection = new DBConnectionSuperadmin();

    $app->get('/{user_id}/workspaces', function(Request $request, Response $response) use ($dbConnection) {

        $userId = $request->getAttribute('user_id');
        $workspaces = $dbConnection->getWorkspacesByUser($userId);  // TODO original function took name?!
        return $response->withJson($workspaces);
    });


    $app->patch('/{user_id}/workspaces', function(Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());
        $userId = $request->getAttribute('user_id');

        if (!isset($requestBody->ws) or (!count($requestBody->ws))) {
            throw new HttpBadRequestException($request, "Workspace-list (ws) is missing."); // TODO original function took name?!
        }

        $dbConnection->setWorkspaceRightsByUser($userId, $requestBody->ws);

        return $response;
    });


    $app->put('', function(Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->p) or !isset($requestBody->n)) {
            throw new HttpBadRequestException($request, "Username or Password missing");
        }

        $dbConnection->addUser($requestBody->n, $requestBody->p);

        return $response;
    });


    $app->patch('/{user_id}/password', function(Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());
        $userId = $request->getAttribute('user_id');

        if (!isset($requestBody->p)) {
            throw new HttpBadRequestException($request, "Password missing"); // TODO original function took name?!
        }

        $dbConnection->setPassword($userId, $requestBody->p);

        return $response;
    });

});
