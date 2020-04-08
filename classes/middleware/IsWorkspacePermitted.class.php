<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class IsWorkspacePermitted {


    private $_necessaryRole = "";


    function __construct(string $necessaryRole = '') {

        $this->_necessaryRole = $necessaryRole;
    }


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

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $adminDAO = new AdminDAO();

        if (!$adminDAO->hasAdminAccessToWorkspace($authToken->getToken(), (int) $params['ws_id'])) {

            throw new HttpForbiddenException($request,"Access to workspace ws_{$params['ws_id']} is not provided.");
        }

        $userRoleOnWorkspace = $role = $adminDAO->getWorkspaceRole($authToken->getToken(), (int) $params['ws_id']);

        if ($this->_necessaryRole and (!in_array($this->_necessaryRole, Role::withChildren($userRoleOnWorkspace)))) {

            throw new HttpForbiddenException($request,"Access Denied: Role `{$this->_necessaryRole}` on workspace `ws_{$params['ws_id']}`, needed. Only `{$userRoleOnWorkspace}` provided.");
        }

        return $next($request, $response);

    }
}
