<?php

/**
 * status: all routes starting with /php/ws.php -> endpoints are refactored but route is still the old one
 */

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php/sys.php', function(App $app) {

    $dbConnection = new DBConnectionSuperadmin();

    $app->post('/workspaces/delete', function (Request $request, Response $response) use ($dbConnection) { // todo use [del]
        $bodyData = json_decode($request->getBody());
        $workspaceList = isset($bodyData->ws) ? $bodyData->ws : []; // TODO is it clever to allow emptyness?

        $dbConnection->deleteWorkspaces($workspaceList);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return number of deleted?
    });


    $app->post('/workspace/users', function (Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());

        if (!isset($requestBody->ws) or !isset($requestBody->u) or (!count($requestBody->u))) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "Workspace ID (ws) or user-list (u) is missing");
        }

        $dbConnection->setUsersByWorkspace($requestBody->ws, $requestBody->u);

        $response->getBody()->write('true'); // TODO don't give anything back | number of updated rows?

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return number of deleted?
    });

})->add(new NormalAuth());
