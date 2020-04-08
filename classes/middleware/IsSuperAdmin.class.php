<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsSuperAdmin {

    function __invoke(Request $request, Response $response, $next) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        if (!$authToken) {
            throw new HttpInternalServerErrorException($request, 'Validated AuthToken not found.');
        }

        if ($authToken->getType() != 'admin') {
            throw new HttpInternalServerErrorException($request, "AuthToken of wrong type: " . $authToken->getType());
        }

        if ($authToken->getMode() != 'super-admin') {
            throw new HttpForbiddenException($request, "Only SuperAdmins can do that!");
        }

        return $next($request, $response);
    }
}
