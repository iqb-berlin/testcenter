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

        $loginToken = $authToken->l ?? '';
        $personToken = $authToken->p;

        //$dbConnectionTC = new DBConnectionTC();
        //$tokenInfo = $dbConnectionTC->validateToken($personToken, $loginToken); // TODO implement

        $authToken = new PersonAuthToken($personToken, $loginToken);
        $request = $request->withAttribute('AuthToken', $authToken);

        return $next($request, $response);
    }
}

