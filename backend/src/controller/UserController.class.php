<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;

class UserController extends Controller {
  public static function getWorkspaces(Request $request, Response $response): Response {
    $userId = (int) $request->getAttribute('user_id');
    $workspaces = self::superAdminDAO()->getWorkspacesByUser($userId);
    return $response->withJson($workspaces);
  }

  public static function patchWorkspaces(Request $request, Response $response): Response {
    $requestBody = JSON::decode($request->getBody()->getContents());
    $userId = (int) $request->getAttribute('user_id');

    if (!isset($requestBody->ws) or (!count($requestBody->ws))) {
      throw new HttpBadRequestException($request, "Workspace-list (ws) is missing.");
    }

    self::superAdminDAO()->setWorkspaceRightsByUser($userId, $requestBody->ws);

    return $response;
  }

  public static function putUser(Request $request, Response $response): Response {
    $requestBody = JSON::decode($request->getBody()->getContents());
    if (!isset($requestBody->p) or !isset($requestBody->n)) {
      throw new HttpBadRequestException($request, "Username or Password missing");
    }

    self::superAdminDAO()->createUser($requestBody->n, $requestBody->p);

    $response->getBody()->write(htmlspecialchars($requestBody->n));
    return $response->withStatus(201);
  }

  public static function patchPassword(Request $request, Response $response): Response {
    /**
     * TODO change p to password
     * TODO validate old password by changing
     */

    $requestBody = JSON::decode($request->getBody()->getContents());
    $userId = (int) $request->getAttribute('user_id');

    if (!isset($requestBody->p)) {
      throw new HttpBadRequestException($request, "Password missing");
    }

    self::superAdminDAO()->setPassword($userId, $requestBody->p);

    return $response;
  }

  public static function patchSuperAdminStatus(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $requestBody = JSON::decode($request->getBody()->getContents());
    $userId = (int) $request->getAttribute('user_id');
    $toStatusString = $request->getAttribute('to_status');
    $toBeSuperAdmin = in_array($toStatusString, ['on', 'true', 1, '1', 'TRUE', 'True', 'ON', 'On'], true);
    $NotToBeSuperAdmin = in_array($toStatusString, ['off', 'false', 0, '0', 'FALSE', 'False', 'OFF', 'Off'], true);

    if (!($toBeSuperAdmin xor $NotToBeSuperAdmin)) {
      throw new HttpBadRequestException($request, "New Status `$toStatusString` is undefined!");
    }

    if (!isset($requestBody->p)) {
      throw new HttpBadRequestException($request, "Provide Password for security reasons!");
    }

    if (!self::superAdminDAO()->checkPassword($authToken->getId(), $requestBody->p)) {
      throw new HttpForbiddenException($request, "Invalid password $requestBody->p {$authToken->getId()}");
    }

    self::superAdminDAO()->setSuperAdminStatus($userId, ($toStatusString == 'on'));

    return $response;
  }
}
