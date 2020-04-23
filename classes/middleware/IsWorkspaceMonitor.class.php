<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsWorkspaceMonitor {

    function __invoke(Request $request, Response $response, $next) {

        $route = $request->getAttribute('route');
        $params = $route->getArguments();

        if (!isset($params['ws_id']) or ((int) $params['ws_id'] < 1)) {

            throw new HttpNotFoundException($request, "No valid workspace: `{$params['ws_id']}`");
        }

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        if ($authToken->getMode() !== 'monitor-study') {

            throw new HttpForbiddenException($request, "Access Denied: 
                Wrong mode for personSession: `{$authToken->getMode()}`. `monitor-study` required.");
        }

        $adminDAO = new AdminDAO();

        if (!$adminDAO->hasMonitorAccessToWorkspace($authToken->getToken(), (int) $params['ws_id'])) {

            throw new HttpNotFoundException($request,"Workspace `{$params['ws_id']}` not accessible.");
        }

        return $next($request, $response);

    }
}
