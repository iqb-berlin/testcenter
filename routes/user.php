<?php
declare(strict_types=1);

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;


$app->group('/user', function(App $app) {

    $superAdminDAO = new SuperAdminDAO();

    $app->get('/{user_id}/workspaces', function(Request $request, Response $response) use ($superAdminDAO) {

        $userId = (int) $request->getAttribute('user_id');
        $workspaces = $superAdminDAO->getWorkspacesByUser($userId);
        return $response->withJson($workspaces);
    });


    $app->patch('/{user_id}/workspaces', function(Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $userId = (int) $request->getAttribute('user_id');

        if (!isset($requestBody->ws) or (!count($requestBody->ws))) {
            throw new HttpBadRequestException($request, "Workspace-list (ws) is missing.");
        }

        $superAdminDAO->setWorkspaceRightsByUser($userId, $requestBody->ws);

        return $response;
    });


    $app->put('', function(Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        if (!isset($requestBody->p) or !isset($requestBody->n)) {
            throw new HttpBadRequestException($request, "Username or Password missing");
        }

        $superAdminDAO->addUser($requestBody->n, $requestBody->p);

        return $response->withStatus(201);
    });


    $app->patch('/{user_id}/password', function(Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $userId = (int) $request->getAttribute('user_id');

        if (!isset($requestBody->p)) {
            throw new HttpBadRequestException($request, "Password missing");
        }

        $superAdminDAO->setPassword($userId, $requestBody->p);

        return $response;
    });

})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());
