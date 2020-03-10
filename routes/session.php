<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;

$app->post('/login/admin', function(Request $request, Response $response) use ($app) { // TODO rename to put session admin

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

$app->put('/session/group', function(Request $request, Response $response) use ($app) {

    $body = RequestBodyParser::getElements($request, [
        "name" => null,
        "password" => ''
    ]);

    $myDBConnection = new DBConnectionStart();

    if (!$body['name']) {

        throw new HttpBadRequestException($request, "Authentication credentials missing.");
    }

    $dataDirPath = ROOT_DIR . '/' . WorkspaceController::dataDirName;
    $availableBookletsForLogin = [];

    foreach (Folder::glob($dataDirPath, 'ws_*') as $workspaceDir) {

        $workspaceId = array_pop(explode('_', $workspaceDir));
        $workspaceController = new WorkspaceController((int)$workspaceId);
        $availableBookletsForLogin = $workspaceController->findAvailableBookletsForLogin($body['name'], $body['password']);
        if (count($availableBookletsForLogin)) {
            break;
        }
    }

    if (!count($availableBookletsForLogin)) {

        throw new HttpUnauthorizedException($request, "No Login for `{$body['name']}` with `{$body['password']}`");
    }

    $testSession = new TestSession($availableBookletsForLogin);
    error_log(print_r($availableBookletsForLogin['mode'],1));
    error_log(print_r($testSession->mode,1));
    $loginToken = $myDBConnection->getOrCreateLoginToken($testSession, ($testSession->mode == 'run-hot-restart'));

    $testSession->loginToken = $loginToken;
    $testSession->workspaceName = $myDBConnection->getWorkspaceName($availableBookletsForLogin['workspaceId']);

    /**
     * STAND:
     * # case B und C
     * # login/group and login/person Auseinanderziehung vorbereiten
     * # fall ordner ohne teststaker subfolder abfangen (muss net error)
     * # falsche credentials
     * # custom texts in [GET] session ?!
     * # DB connection login fn überarbeiten
     * # passwortloeses login
     * # neue modes

     * # groupToken guter Name?
     * implement personmtoken auth
     * db klasse durchgehen
     *
     *
     * * ordnen wo welche DB klasse

     */


    return $response->withJson($testSession);

});

$app->put('/session/person', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $dbConnectionStart = new DBConnectionStart();

    $body = RequestBodyParser::getElements($request, [
        'code' => 0
    ]);

    $loginId = $dbConnectionStart->getLoginId($authToken->getToken());

    if ($loginId == null) {
        throw new HttpForbiddenException($request);
    }

    $person = $dbConnectionStart->getOrCreatePerson($loginId, $body['code']);


    return $response->withJson($person);

})->add(new RequireLoginToken());


$app->get('/session', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $myDBConnection = new DBConnectionStart();

    if ($authToken::type == "group") {

        $session = $myDBConnection->getSessionByLoginToken($authToken->getToken());
        if (count($session->booklets) > 0 ) {
            return $response->withJson($session);
        }
    }

    if ($authToken::type == "person") {

        $session = $myDBConnection->getSessionByPersonToken($authToken->getToken());
        if (count($session->booklets) > 0 ) {
            return $response->withJson($session);
        }
    }

    // TODO add type admin !

    throw new HttpUnauthorizedException($request);

})->add(new RequireLoginToken());
