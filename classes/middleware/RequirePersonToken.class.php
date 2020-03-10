<?php

/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequirePersonToken {

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($request->getHeaderLine('AuthToken'));

        if (!isset($authToken->p) or strlen($authToken->p) == 0) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: p missing');
        }

        $personToken = $authToken->p;

        $sessionDAO = new SessionDAO();
        $person = $sessionDAO->getPerson($personToken);

        $authToken = new PersonAuthToken($personToken, $person['workspace_id'], $person['id'], $person['login_id']);
        $request = $request->withAttribute('AuthToken', $authToken);

        return $next($request, $response);
    }
}

