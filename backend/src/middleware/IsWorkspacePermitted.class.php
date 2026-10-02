<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;

class IsWorkspacePermitted {
  private WorkspaceRole $necessaryRole;

  function __construct(WorkspaceRole $necessaryRole) {
    $this->necessaryRole = $necessaryRole;
  }

  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    $routeContext = RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();
    $params = $route->getArguments();

    if (!isset($params['ws_id']) or ((int) $params['ws_id'] < 1)) {
      throw new HttpNotFoundException($request, "No valid workspace: `{$params['ws_id']}`");
    }

    /** @var AuthToken $authToken */
    $authToken = $request->getAttribute('AuthToken');

    $adminDAO = new AdminDAO();

    if (!$adminDAO->hasAdminAccessToWorkspace($authToken->getToken(), (int) $params['ws_id'])) {
      throw new HttpNotFoundException($request, "Workspace `{$params['ws_id']}` not found.");
    }

    $userRoleOnWorkspace = $adminDAO->getWorkspaceRole($authToken->getToken(), (int) $params['ws_id']);

    if (!WorkspaceRole::tryFrom($userRoleOnWorkspace)?->includes($this->necessaryRole)) {
      throw new HttpForbiddenException($request, "Access Denied: Role `{$this->necessaryRole->value}` on workspace `ws_{$params['ws_id']}`, needed. Only `{$userRoleOnWorkspace}` provided.");
    }

    return $handler->handle($request);

  }
}
