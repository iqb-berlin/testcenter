<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;

$app->post('/login/admin', function(Request $request, Response $response) use ($app) {

    $dbConnection = new DBConnectionAdmin();

    $requestBody = JSON::decode($request->getBody()); // TODO call them name and password

    if (isset($requestBody->n) and isset($requestBody->p)) {
        $token = $dbConnection->login($requestBody->n, $requestBody->p);
    } else if (isset($requestBody->at)) {
        $token = $requestBody->at;
    } else {
        throw new HttpBadRequestException($request, "Authentication credentials missing.");
    }

    $tokenInfo = $dbConnection->validateToken($token);

    $workspaces = $dbConnection->getWorkspaces($token);

    if ((count($workspaces) == 0) and !$tokenInfo['user_is_superadmin']) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 202);
    }

    return $response->withJson([
        'admintoken' => $token,
        'user_id' => $tokenInfo['user_id'],
        'name' => $tokenInfo['user_name'],
        'workspaces' => $workspaces,
        'is_superadmin' => $tokenInfo['user_is_superadmin']
    ]);
});

$app->post('/login/group', function(Request $request, Response $response) use ($app) {

    $body = RequestBodyParser::getElements($request, [
        "name" => '',
        "password" => ''
    ]);


    $myDBConnection = new DBConnectionStart();

    if (strlen($body['name']) > 0 && strlen($body['password']) > 0) {

        $dataDirPath = ROOT_DIR . '/' . WorkspaceController::dataDirName;

        foreach (Folder::glob($dataDirPath, 'ws_*') as $workspaceDir) {

            $workspaceId = array_pop(explode('_', $workspaceDir));
            $workspaceController = new WorkspaceController((int)$workspaceId);
            $availableBookletsForLogin = $workspaceController->findAvailableBookletsForLogin($body['name'], $body['password']);
            if (count($availableBookletsForLogin)) {
                break;
            }
        }

        if (count($availableBookletsForLogin)) {
            $loginToken = $myDBConnection->login(
                $availableBookletsForLogin['workspaceId'],
                $availableBookletsForLogin['groupname'],
                $availableBookletsForLogin['loginname'],
                $availableBookletsForLogin['mode'],
                $availableBookletsForLogin['booklets']
            );
            if (strlen($loginToken) > 0) {
                $loginData = new TestSession([
                    'loginToken' => $loginToken,
                    'mode' => $availableBookletsForLogin['mode'],
                    'groupName' => $availableBookletsForLogin['groupname'],
                    'loginName' => $availableBookletsForLogin['loginname'],
                    'workspaceName' => $myDBConnection->getWorkspaceName($availableBookletsForLogin['workspaceId']),
                    'booklets' => $availableBookletsForLogin['booklets'],
                    'customTexts' => $availableBookletsForLogin['customTexts']
                ]);
            }
        }

    /**
     * STAND:
     * # case B und C
     * login/group and login/person Auseinanderziehung vorbereiten
     * fall ordner ohne teststaker subfolder abfangen (muss net error)
     * DB connection login fn überarbeiten
     * passwortloeses login
     */

    }

    return $response->withJson($loginData);

});

$app->post('/login/person', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $dbConnectionStart = new DBConnectionStart();

    $body = RequestBodyParser::getElements($request, [
        'code' => 0, // was: c
    ]);

    $loginId = $dbConnectionStart->getLoginId($authToken->getToken());

    if ($loginId == null) {
        throw new HttpForbiddenException($request);
    }

    $person = $dbConnectionStart->getOrCreatePerson($loginId, $body['code']);

    return $response->withJson($person);

})->add(new RequireGroupToken());


$app->get('/session', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $myDBConnection = new DBConnectionStart();

    if ($authToken::type == "group") {

        $dbReturn = $myDBConnection->getAllBookletsByLoginToken($authToken->getToken());
        if (count($dbReturn['booklets']) > 0 ) {
            $session = new TestSession($dbReturn);
            return $response->withJson($session);
        }
    }


    if ($authToken::type == "person") {

        $dbReturn = $myDBConnection->getAllBookletsByPersonToken($authToken->getToken());
        if (count($dbReturn['booklets']) > 0 ) {
            $session = new TestSession($dbReturn);
            return $response->withJson($session);
        }
    }

    // TODO add type admin !

    throw new HttpUnauthorizedException($request);

})->add(new RequireGroupToken());
