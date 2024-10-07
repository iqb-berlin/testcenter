<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Http\ServerRequest as Request;

class HandleOptionalToken {
  protected array $requiredTypes = [];

  public function __construct(string ...$requiredTypes) {
    $this->requiredTypes = $requiredTypes;
  }

  function __invoke(Request $request, RequestHandler $handler) {
    $tokenString = $this->getOptionalTokenFromHeader($request);

    if (is_null($tokenString)) {
      return $handler->handle($request);
    }

    $sessionDAO = new SessionDAO();
    $token = $sessionDAO->getToken($tokenString, $this->requiredTypes);
    $request = $request->withAttribute('AuthToken', $token);
    return $handler->handle($request);
  }

  private function getOptionalTokenFromHeader(Request $request): ?string {
    if (!$request->hasHeader('AuthToken')) {
      return null;
    }

    $authToken = $request->getHeaderLine('AuthToken');

    if (!$authToken) {
      return null;
    }

    return $authToken;
  }
}
