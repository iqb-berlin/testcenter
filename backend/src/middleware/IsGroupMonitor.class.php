<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;

class IsGroupMonitor {
  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $routeContext = RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();
    $params = $route->getArguments();

    switch ($authToken->getMode()) {
      default:
        throw new HttpForbiddenException($request, "Access Denied: Not in Monitor Mode.");
      case 'monitor-group':
        if (isset($params['group']) and ($authToken->getGroup() !== $params['group'])) { //
          throw new HttpForbiddenException($request, "Access Denied for Group: `{$params['group']}`");
        }
        $groups = [$authToken->getGroup()];
        break;
      case 'monitor-study':
        $sessionDao = new SessionDAO();
        $groups = $sessionDao->getGroups($authToken->getWorkspaceId());
        if (isset($params['group']) and !array_key_exists($params['group'], $groups)) {
          throw new HttpForbiddenException($request, "Access Denied for Group: `{$params['group']}`");
        }
    }

    return $handler->handle($request->withAttribute('groups', $groups));
  }
}
