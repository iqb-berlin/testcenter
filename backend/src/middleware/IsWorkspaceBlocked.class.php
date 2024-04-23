<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpException;
use Slim\Exception\HttpForbiddenException;
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

    $workspace = new Workspace((int) $params['ws_id']);

    if (file_exists($workspace->getWorkspacePath() . '/.lock')) {
      throw new HttpException($request, 'Workspace blocked by another upload or deletion action.', 409);
    }
// TODO X
//    file_put_contents($workspace->getWorkspacePath() . '/.lock', '.');
    register_shutdown_function(function() use ($workspace) {
      unlink($workspace->getWorkspacePath() . '/.lock');
    });

    return $handler->handle($request);
  }
}
