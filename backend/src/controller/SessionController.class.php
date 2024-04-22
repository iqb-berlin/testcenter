<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;

class SessionController extends Controller {
  protected static array $_workspaces = [];

  /**
   * @codeCoverageIgnore
   */
  public static function putSessionAdmin(Request $request, Response $response): Response {
    $body = RequestBodyParser::getElements($request, [
      "name" => null,
      "password" => null
    ]);

    $token = self::adminDAO()->createAdminToken($body['name'], $body['password']);

    $admin = self::adminDAO()->getAdmin($token);
    $workspaces = self::adminDAO()->getWorkspaces($token);
    $accessSet = AccessSet::createFromAdminToken($admin, ...$workspaces);

    if (!$accessSet->hasAccessType('workspaceAdmin') and !$accessSet->hasAccessType('superAdmin')) {
      throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 204);
    }

    return $response->withJson($accessSet);
  }

  public static function putSessionLogin(Request $request, Response $response): Response {
    $body = RequestBodyParser::getElements($request, [
      "name" => null,
      "password" => ''
    ]);

    $loginSession = self::sessionDAO()->getOrCreateLoginSession($body['name'], $body['password']);

    if (!$loginSession) {
      $userName = htmlspecialchars($body['name']);
      throw new HttpBadRequestException($request, "No Login for `$userName` with this password.");
    }

    if (!$loginSession->getLogin()->isCodeRequired()) {
      $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, '');

      CacheService::removeAuthentication($personSession);

      $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
      $groupMonitors = self::sessionDAO()->getGroupMonitors($personSession);
      $accessSet = AccessSet::createFromPersonSession($personSession, null, ...$testsOfPerson, ...$groupMonitors);

      self::registerDependantSessions($loginSession);
      CacheService::storeAuthentication($personSession);

    } else {
      $accessSet = AccessSet::createFromLoginSession($loginSession);
    }

    return $response->withJson($accessSet);
  }

  /**
   * @codeCoverageIgnore
   */
  public static function putSessionPerson(Request $request, Response $response): Response {
    $body = RequestBodyParser::getElements($request, [
      'code' => ''
    ]);
    $loginSession = self::sessionDAO()->getLoginSessionByToken(self::authToken($request)->getToken());
    $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, $body['code']);
    CacheService::removeAuthentication($personSession); // TODO X correct?!
    $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
    CacheService::storeAuthentication($personSession);
    return $response->withJson(AccessSet::createFromPersonSession($personSession,null , ...$testsOfPerson));
  }

  private static function registerDependantSessions(LoginSession $login): void {
    $members = self::sessionDAO()->getDependantSessions($login);

    $workspace = self::getWorkspace($login->getLogin()->getWorkspaceId());
    $bookletFiles = [];

    foreach ($members as $member) {
      /* @var $member LoginSession */

      if (Mode::hasCapability($member->getLogin()->getMode(), 'alwaysNewSession')) {
        continue;
      }

      if (!Mode::hasCapability($member->getLogin()->getMode(), 'monitorable')) {
        continue;
      }

      if (!$member->getToken()) {
        $member = SessionController::sessionDAO()->createLoginSession($member->getLogin());
      }

      foreach ($member->getLogin()->getBooklets() as $code => $booklets) {
        $memberPersonSession = SessionController::sessionDAO()->createOrUpdatePersonSession($member, $code, true, false);

        foreach ($booklets as $bookletId) {
          if (!isset($bookletFiles[$bookletId])) {
            $bookletFile = $workspace->getFileById('Booklet', $bookletId);
            $bookletFiles[$bookletId] = $bookletFile;
          } else {
            $bookletFile = $bookletFiles[$bookletId];
          }
          /* @var $bookletFile XMLFileBooklet */

          $test = self::testDAO()->getTestByPerson($memberPersonSession->getPerson()->getId(), $bookletId);
          if (!$test) {
            $test = self::testDAO()->createTest($memberPersonSession->getPerson()->getId(), $bookletId, $bookletFile->getLabel());
          }

          $sessionMessage = SessionChangeMessage::session($test->id, $memberPersonSession);
          $sessionMessage->setTestState([], $bookletId);
          BroadcastService::sessionChange($sessionMessage);
        }
      }
    }
  }

  private static function getWorkspace(int $workspaceId): Workspace {
    if (!isset(self::$_workspaces[$workspaceId])) {
      self::$_workspaces[$workspaceId] = new Workspace($workspaceId);
    }

    return self::$_workspaces[$workspaceId];
  }

  public static function getSession(Request $request, Response $response): Response {
    $authToken = self::authToken($request);

    if ($authToken->getType() == "login") {
      $loginSession = self::sessionDAO()->getLoginSessionByToken($authToken->getToken());
      return $response->withJson(AccessSet::createFromLoginSession($loginSession));
    }

    if ($authToken->getType() == "person") {
      $personSession = self::sessionDAO()->getPersonSessionByToken($authToken->getToken());
      $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
      $workspaceName = self::workspaceDAO($personSession->getLoginSession()->getLogin()->getWorkspaceId())->getWorkspaceName();
      $groupMonitors = self::sessionDAO()->getGroupMonitors($personSession);
      $accessSet = AccessSet::createFromPersonSession($personSession, $workspaceName, ...$testsOfPerson, ...$groupMonitors);
      return $response->withJson($accessSet);
    }

    if ($authToken->getType() == "admin") {
      $admin = self::adminDAO()->getAdmin($authToken->getToken());
      $workspaces = self::adminDAO()->getWorkspaces($authToken->getToken());
      $accessSet = AccessSet::createFromAdminToken($admin, ...$workspaces);
      self::adminDAO()->refreshAdminToken($authToken->getToken());
      return $response->withJson($accessSet);
    }

    throw new HttpUnauthorizedException($request);
  }

  public static function deleteSession(Request $request, Response $response): Response {
    $authToken = self::authToken($request);

    if ($authToken->getType() == "person") {
      self::sessionDAO()->deletePersonToken($authToken);
    }

    if ($authToken->getType() == "admin") {
      self::adminDAO()->deleteAdminSession($authToken);
    }

    // nothing to do for login-sessions; they have constant token as they are only the first step of 2f-auth
    return $response->withStatus(205);
  }
}
