<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class IsSuperAdmin {

  function __invoke(Request $request, RequestHandler $handler): ResponseInterface {
    $this->checkAuthToken($request);

    return $handler->handle($request);
  }

  /**
   * @param Request $request
   * @return void
   */
  public function checkAuthToken(Request $request): void {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    if (!$authToken) {
      throw new HttpInternalServerErrorException($request, 'Validated AuthToken not found.');
    }

    if ($authToken->getType() != 'admin') {
      throw new HttpInternalServerErrorException($request, "AuthToken of wrong type: " . $authToken->getType());
    }

    if ($authToken->getMode() != 'super-admin') {
      throw new HttpForbiddenException($request, "Only SuperAdmins can do that!");
    }
  }
}
