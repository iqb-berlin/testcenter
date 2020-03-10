<?php
/** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsTestWritable {

    function __invoke(Request $request, Response $response, $next) {

        $route = $request->getAttribute('route');
        $params = $route->getArguments();

        if (!isset($params['test_id']) or ((int) $params['test_id'] < 1)) {
            throw new HttpBadRequestException($request, "No valid test-Id: {$params['test_id']}");
        }

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $sessionDAO = new SessionDAO();

        if (!$sessionDAO->canWriteTestData($authToken->getToken(), $params['test_id'])) {
            throw new HttpForbiddenException($request,"Access to test {$params['test_id']} is not provided.");
        }

        return $next($request, $response);
    }
}
