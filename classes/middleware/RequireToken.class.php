<?php

/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequireToken {

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($request->getHeaderLine('AuthToken'));
        $personToken = $authToken->p;
        $loginToken = $authToken->l ?? ''; // TODO check this too?

        if (!isset($authToken->p) or strlen($personToken) == 0) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: p missing');
        }

        //$dbConnectionTC = new DBConnectionTC();

//        $tokenInfo = $dbConnectionTC->validateToken($personToken, $loginToken); // TODO implement

        $authToken = new TestAuthToken($personToken, $loginToken);
        $request = $request->withAttribute('AuthToken', $authToken);

        return $next($request, $response);
    }
}

