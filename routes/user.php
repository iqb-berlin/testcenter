<?php
declare(strict_types=1);

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
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

    /**
     * TODO change p to password
     * TODO validate old password by changing
     */


    $app->put('', function(Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        if (!isset($requestBody->p) or !isset($requestBody->n)) {
            throw new HttpBadRequestException($request, "Username or Password missing");
        }

        $superAdminDAO->createUser($requestBody->n, $requestBody->p);

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


    $app->patch('/{user_id}/super-admin/{to_status}',
        function(Request $request, Response $response) use ($superAdminDAO) {

            /* @var $authToken AuthToken */
            $authToken = $request->getAttribute('AuthToken');
            $requestBody = JSON::decode($request->getBody()->getContents());
            $userId = (int) $request->getAttribute('user_id');
            $toStatusString = $request->getAttribute('to_status');
            $toBeSuperAdmin = in_array($toStatusString, ['on', 'true', 1, '1', 'TRUE', 'True', 'ON', 'On'], true);
            $NotToBeSuperAdmin = in_array($toStatusString, ['off', 'false', 0, '0', 'FALSE', 'False', 'OFF', 'Off'], true);

            if (!($toBeSuperAdmin xor $NotToBeSuperAdmin)) {
                throw new HttpBadRequestException($request, "New Status `$toStatusString` is undefined!");
            }

            if (!isset($requestBody->p)) {
                throw new HttpBadRequestException($request, "Provide Password for security reasons!");
            }

            if (!$superAdminDAO->checkPassword($authToken->getId(), $requestBody->p)) {
                throw new HttpForbiddenException($request, "Invalid password {$requestBody->p} {$authToken->getId()}");
            }

            $superAdminDAO->setSuperAdminStatus($userId, ($toStatusString == 'on'));

            return $response;
    });


})
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));
