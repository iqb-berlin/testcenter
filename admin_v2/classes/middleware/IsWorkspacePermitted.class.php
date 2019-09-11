<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsWorkspacePermitted {

    /**
     * @param Request $request
     * @param Response $response
     * @param $next
     * @return mixed
     * @throws HttpBadRequestException
     * @throws HttpForbiddenException
     */
    function __invoke(Request $request, Response $response, $next) {

        $route = $request->getAttribute('route');
        $params = $route->getArguments();

        if (!isset($params['ws_id']) or ((int) $params['ws_id'] < 1)) {
            throw new HttpBadRequestException($request, "No valid workspace: {$params['ws_id']}");
        }

        $adminToken = $_SESSION['adminToken'];

        $dbConnectionAdmin = new DBConnectionAdmin();

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $params['ws_id'])) {
            throw new HttpForbiddenException($request,"Access to workspace ws_{$params['ws_id']} is not provided.");
        }

        return $next($request, $response);

    }
}
