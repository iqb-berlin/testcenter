<?php

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php/sys.php', function(App $app) {

    $dbConnection = new DBConnectionSuperadmin();

    $app->get('/users', function(Request $request, Response $response) use ($dbConnection) {

        $ws = $request->getQueryParam('ws', 0);
        if ($ws > 0) {
            $returner = $dbConnection->getUsersByWorkspace($ws);
        } else {
            $returner = $dbConnection->getUsers();
        }

        $response->getBody()->write(jsonencode($returner));

        return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
    });


    $app->post('/user/add', function(Request $request, Response $response) use ($dbConnection) { //TODO -> [PUT] /user
        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->n) or !isset($requestBody->p)) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "Username or Password missing");
        }

        $dbConnection->addUser($requestBody->n, $requestBody->p);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });


    $app->post('/user/pw', function(Request $request, Response $response) use ($dbConnection) {
        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->n) or !isset($requestBody->p)) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "Username or Password missing");
        }

        $dbConnection->setPassword($requestBody->n, $requestBody->p);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });


    $app->post('/users/delete', function(Request $request, Response $response) use ($dbConnection) { // TODO change to [DEL] /user
        $bodyData = json_decode($request->getBody());
        $userList = isset($bodyData->u) ? $bodyData->u : []; // TODO is it clever to allow emptyness?

        $dbConnection->deleteUsers($userList);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return umber of deleted?
    });


    $app->post('/user/workspaces', function(Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());

        if (!isset($requestBody->u) or !isset($requestBody->ws) or (!count($requestBody->ws))) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "User-Name (ws) or workspace-list (u) is missing. Provide user-NAME, not ID.");
        }

        $dbConnection->setWorkspacesByUser($requestBody->u, $requestBody->ws);

        $response->getBody()->write('true'); // TODO don't give anything back | number of updated rows?

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return number of deleted?
    });

})->add(new NormalAuth());
