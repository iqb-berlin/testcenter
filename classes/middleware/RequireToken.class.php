<?php
/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;

abstract class RequireToken {

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        $tokenString = $this->getTokenFromHeader($request);

        $request = $request->withAttribute('AuthToken', $this->createTokenObject($tokenString));

        return $next($request, $response);
    }


    function getTokenFromHeader(Request $request): string { // TODO unit-test

        $tokenName = $this->getTokenName();

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($request->getHeaderLine('AuthToken'));

        if (!isset($authToken->$tokenName) or strlen($authToken->$tokenName) == 0) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: `$tokenName` missing');
        }

        return $authToken->$tokenName;
    }

    abstract function createTokenObject(string $tokenString): AuthToken;

    abstract function getTokenName(): string;
}
