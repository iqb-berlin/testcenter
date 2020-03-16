<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;

$app->put('/session/admin', function(Request $request, Response $response) use ($app) {

    $adminDAO = new AdminDAO();

    $body = RequestBodyParser::getElements($request, [
        "name" => null,
        "password" => null
    ]);

    $token = $adminDAO->createAdminToken($body['name'], $body['password']);

    $session = $adminDAO->getAdminSession($token);

    if ((count($session->workspaces) == 0) and !$session->isSuperadmin) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 202);
    }

    return $response->withJson($session);
});

$app->put('/session/login', function(Request $request, Response $response) use ($app) {

    $body = RequestBodyParser::getElements($request, [
        "name" => null,
        "password" => ''
    ]);

    $sessionDAO = new SessionDAO();

    if (!$body['name']) {

        throw new HttpBadRequestException($request, "Authentication credentials missing.");
    }

    $availableBookletsForLogin = [];

    foreach (WorkspaceController::getAll() as $workspaceController) { /* @var WorkspaceController $workspaceController */

        $availableBookletsForLogin = $workspaceController->findAvailableBookletsForLogin($body['name'], $body['password']);

        if (count($availableBookletsForLogin)) {
            break;
        }
    }

    if (!count($availableBookletsForLogin)) {

        throw new HttpUnauthorizedException($request, "No Login for `{$body['name']}` with `{$body['password']}`");
    }

    $testSession = new TestSession($availableBookletsForLogin);
    $loginToken = $sessionDAO->getOrCreateLoginToken($testSession, ($testSession->mode == 'run-hot-restart'));

    $testSession->loginToken = $loginToken;
    $testSession->workspaceName = $sessionDAO->getWorkspaceName($availableBookletsForLogin['workspaceId']);

    return $response->withJson($testSession);

});

$app->put('/session/person', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $sessionDAO = new SessionDAO();

    $body = RequestBodyParser::getElements($request, [
        'code' => 0
    ]);

    $loginId = $sessionDAO->getLoginId($authToken->getToken());

    if ($loginId == null) {
        throw new HttpForbiddenException($request);
    }

    $person = $sessionDAO->getOrCreatePerson($loginId, $body['code']);

    return $response->withJson([
        'personId' => $person['id'],
        'personToken' => $person['token'],
        'code' => $person['code']
    ]);

})->add(new RequireLoginToken());


$app->get('/session', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $sessionDAO = new SessionDAO();

    if ($authToken::type == "login") {

        $session = $sessionDAO->getSessionByLoginToken($authToken->getToken());
        return $response->withJson($session);
    }

    if ($authToken::type == "person") {

        $session = $sessionDAO->getSessionByPersonToken($authToken->getToken());
        return $response->withJson($session);
    }

    $adminDAO = new AdminDAO();

    if ($authToken::type == "admin") {

        $session = $adminDAO->getAdminSession($authToken->getToken());
        return $response->withJson($session);
    }

    throw new HttpUnauthorizedException($request);

})
    ->add(new RequireAnyToken());
