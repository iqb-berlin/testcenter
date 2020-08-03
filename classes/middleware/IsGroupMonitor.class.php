<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsGroupMonitor {

    function __invoke(Request $request, Response $response, $next) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        if ($authToken->getMode() !== 'monitor-group') {

            throw new HttpForbiddenException($request, "Access Denied: 
                Wrong mode for personSession: `{$authToken->getMode()}`. `monitor-group` required.");
        }

        return $next($request, $response);
    }
}
