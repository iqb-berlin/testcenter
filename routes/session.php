<?php
declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;
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

    if (($session->getAccessWorkspaceAdmin()) and ($session->getAccessSuperAdmin() == null)) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 202);
    }

    return $response->withJson($session);
});

$app->put('/session/login', function(Request $request, Response $response) use ($app) {

    $body = RequestBodyParser::getElements($request, [
        "name" => null,
        "password" => ''
    ]);

    if (!$body['name']) {

        throw new HttpBadRequestException($request, "Authentication credentials missing.");
    }

    $loginData = null;

    foreach (TesttakersFolder::getAll() as $testtakersFolder) { /* @var TesttakersFolder $testtakersFolder */

        $loginData = $testtakersFolder->findLoginData($body['name'], $body['password']);

        if ($loginData != null) {
            break;
        }
    }

    if ($loginData == null) {

        $shortPW = preg_replace('/(^.).*(.$)/m', '$1***$2', $body['password']);
        throw new HttpUnauthorizedException($request, "No Login for `{$body['name']}` with `{$shortPW}`");
    }

    $sessionDAO = new SessionDAO();

    $loginSession = $sessionDAO->getOrCreateLogin($loginData, ($loginData->mode == 'run-hot-restart'));

    if (array_keys($loginData->booklets) == ['']) {

        $person = $sessionDAO->getOrCreatePerson($login, $body['code']);

        $session = new Session(
            $person['token'],
            "{$login->name}/{$person['code']}",
            [],
            (object) [] // TODO restore customTexts
        );
        $session->setAccessTest($login->booklets[$person['code']] ?? []);


    } else {

        $session = $loginSession;
    }

    return $response->withJson($session);
});

$app->put('/session/person', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $sessionDAO = new SessionDAO();

    $body = RequestBodyParser::getElements($request, [
        'code' => ''
    ]);

    $login = $sessionDAO->getLogin($authToken->getToken());

    $person = $sessionDAO->getOrCreatePerson($login, $body['code']);

    $session = new Session(
        $person['token'],
        "{$login->name}/{$person['code']}",
        [],
        (object) [] // TODO restore customTexts
    );
    $session->setAccessTest($login->booklets[$person['code']] ?? []);

    return $response->withJson($session);

})->add(new RequireLoginToken());


$app->get('/session', function(Request $request, Response $response) use ($app) {

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $sessionDAO = new SessionDAO();

    if ($authToken::type == "login") {

        $loginSession = $sessionDAO->getLogin($authToken->getToken());
        $codeRequired = (array_keys($loginSession->booklets) == ['']);

        // TODO remove workaround with https://github.com/iqb-berlin/testcenter-iqb-php/issues/76
        $session = new Session(
            $loginSession->token,
            $loginSession->name,
            $codeRequired ? ['codeRequired'] : []
        );

        return $response->withJson($session);
    }

    if ($authToken::type == "person") {

        $oldSession = $sessionDAO->getSessionByPersonToken($authToken->getToken());

        $session = new Session(
            $oldSession->personToken,
            "{$oldSession->groupName}/{$oldSession->name}/{$oldSession->code}",
            [],
            $oldSession->customTexts
        );
        $session->setAccessTest($oldSession->booklets);

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
