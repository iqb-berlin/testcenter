<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class MayReview {
  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    /** @var AuthToken $authToken */
    $authToken = $request->getAttribute('AuthToken');

    if (!Mode::hasCapability($authToken->getMode(), ModeCapability::CAN_REVIEW)) {
      throw new HttpForbiddenException($request, "Reviews are not available in mode `{$authToken->getMode()}`.");
    }

    return $handler->handle($request);
  }
}
