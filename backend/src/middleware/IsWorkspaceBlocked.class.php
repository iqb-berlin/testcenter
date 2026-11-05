<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;

class IsWorkspaceBlocked {
  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    $routeContext = RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();
    $params = $route->getArguments();

    if (!isset($params['ws_id']) or ((int) $params['ws_id'] < 1)) {
      throw new HttpNotFoundException($request, "No valid workspace: `{$params['ws_id']}`");
    }

    $workspaceDAO = new WorkspaceDAO((int) $params['ws_id']);
    $lockedAt = $workspaceDAO->lockWorkspace();

    if ($lockedAt === null) {
      throw new HttpException($request, 'Workspace blocked by another upload or deletion action.', 409);
    }

    try {
      return $handler->handle($request);
    } finally {
      $workspaceDAO->unlockWorkspace($lockedAt);
    }
  }
}
