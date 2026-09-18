<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Http\ServerRequest as Request;

/**
 * Answers CORS preflight requests before routing takes place.
 *
 * The actual CORS headers are added by the webserver (see `config/no-cors.htaccess`), the application only has to
 * make sure a preflight request is answered with a success status.
 *
 * This has to happen in a middleware and not in a route: a route matching every path would take part in the
 * route matching of every request and thus prevent the router from telling a wrong method (405) apart from an
 * unknown route (404).
 */
class HandleCorsPreflight {
  private ResponseFactoryInterface $responseFactory;

  public function __construct(ResponseFactoryInterface $responseFactory) {
    $this->responseFactory = $responseFactory;
  }

  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    if ($request->getMethod() === 'OPTIONS') {
      return $this->responseFactory->createResponse();
    }

    return $handler->handle($request);
  }
}
