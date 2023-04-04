<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;

class IsTestWritable {

  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    $routeContext = RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();
    $params = $route->getArguments();

    if (!isset($params['test_id']) or ((int) $params['test_id'] < 1)) {
      throw new HttpBadRequestException($request, "No valid test-Id: {$params['test_id']}");
    }

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $sessionDAO = new SessionDAO();

    if (!$sessionDAO->ownsTest($authToken->getToken(), $params['test_id'])) {
      throw new HttpForbiddenException($request, "Access to test {$params['test_id']} is not provided.");
    }

    return $handler->handle($request);
  }
}
