<?php

/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequireGroupToken {

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($request->getHeaderLine('AuthToken'));

        if (!isset($authToken->l) or strlen($authToken->l) == 0) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: p missing');
        }

        $loginToken = $authToken->l;
        $personToken = $authToken->p ?? '';

        //$dbConnectionTC = new DBConnectionTC();
        //$tokenInfo = $dbConnectionTC->validateToken($personToken, $loginToken); // TODO implement


        $authToken = $personToken ? new PersonAuthToken($personToken) : new GroupAuthToken($loginToken);

        $request = $request->withAttribute('AuthToken', $authToken);
        return $next($request, $response);
    }
}

