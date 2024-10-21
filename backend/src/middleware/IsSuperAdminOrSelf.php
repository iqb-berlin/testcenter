<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Http\ServerRequest;

class IsSuperAdminOrSelf extends IsSuperAdmin {
  public function __invoke(ServerRequest $request, RequestHandlerInterface $handler): ResponseInterface {
    try {
      $this->checkAuthToken($request);
    } catch(Exception $e) {
      $authToken = $request->getAttribute('AuthToken');
      $requestUserId = (int) $request->getAttribute('__route__')->getArgument('user_id');
      $adminDao = new AdminDAO();
      $dbUserId = (int) $adminDao->getAdmin($authToken->getToken())->getId();

      if ($requestUserId !== $dbUserId) {
        throw new HttpInternalServerErrorException($request, 'User is neither owner nor super admin');
      }
    }

    return $handler->handle($request);
  }
}