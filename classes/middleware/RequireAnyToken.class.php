<?php
/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequireAnyToken {


    function __invoke(Request $request, Response $response, $next) { // TODO unit-test

        $requirePersonToken = new RequirePersonToken();
        $requireLoginToken = new RequireLoginToken();
        $requireAdminToken = new RequireAdminToken();

        try {
            $tokenString = $requireLoginToken->getTokenFromHeader($request);
            $authToken = $requireLoginToken->createTokenObject($tokenString);

        } catch (HttpUnauthorizedException $exception) {

            try {

                $tokenString = $requirePersonToken->getTokenFromHeader($request);
                $authToken = $requirePersonToken->createTokenObject($tokenString);

            } catch (HttpUnauthorizedException $exception) {

                try {

                    $tokenString = $requireAdminToken->getTokenFromHeader($request);
                    $authToken = $requireAdminToken->createTokenObject($tokenString);

                } catch (HttpUnauthorizedException $exception) {

                    throw new HttpUnauthorizedException($request, "No suitable auth credentials at all in header");
                }
            }
        }

        $request = $request->withAttribute('AuthToken', $authToken);

        // don't call $next in trc/catch block to avoid side effects
        return $next($request, $response);
    }
}
