<?php

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

/** @noinspection PhpUnusedParameterInspection */

$app->group('/user', function(App $app) {

    $dbConnection = new DBConnectionSuperadmin();

    $app->get('/{user_id}/workspaces', function (Request $request, Response $response) use ($dbConnection) {

        $userId = $request->getAttribute('user_id');
        $workspaces = $dbConnection->getWorkspacesByUser($userId);
        return $response->withJson($workspaces);
    });
});
