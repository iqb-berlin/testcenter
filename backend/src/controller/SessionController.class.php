<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class SessionController extends Controller {
  protected static array $_workspaces = [];

  /**
   * @codeCoverageIgnore
   */
  public static function putSessionAdmin(Request $request, Response $response): Response {
    usleep(500000); // 0.5s delay to slow down brute force attack

    $body = RequestBodyParser::getElementsFromRequest($request, [
      "name" => 'REQUIRED',
      "password" => 'REQUIRED'
    ]);

    $attempts = CacheService::getFailedLogins($body['name']);
    if ($attempts >= 5) {
      throw new HttpError("Too many login attempts", 429);
    }

    $token = self::adminDAO()->createAdminToken($body['name'], $body['password']);

    if (is_a($token, FailedLogin::class)) {
      CacheService::addFailedLogin($body['name']);
      throw new HttpError("No login with this password.", 400);
    }

    $admin = self::adminDAO()->getAdmin($token);
    $workspaces = self::adminDAO()->getWorkspaces($token);
    $accessSet = AccessSet::createFromAdminToken($admin, ...$workspaces);

    if (!$accessSet->hasAccessType(AccessObjectType::WORKSPACE_ADMIN) and !$accessSet->hasAccessType(AccessObjectType::SUPER_ADMIN)) {
      throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 204);
    }

    return $response->withJson($accessSet);
  }

  public static function putSessionLogin(Request $request, Response $response): Response {
    $body = RequestBodyParser::getElementsFromRequest($request, [
      "name" => 'REQUIRED',
      "password" => ''
    ]);

    $attempts = CacheService::getFailedLogins($body['name']);
    if ($attempts >= 5) {
      throw new HttpError("Too many login attempts", 429);
    }

    $loginSession = self::sessionDAO()->getOrCreateLoginSession($body['name'], $body['password']);

    if (!is_a($loginSession, LoginSession::class)) {
      if ($loginSession === FailedLogin::wrongPasswordProtectedLogin) {
        CacheService::addFailedLogin($body['name']);
      }
      $userName = htmlspecialchars($body['name']);
      throw new HttpBadRequestException($request, "No Login for `$userName` with this password.");
    }

    if (!$loginSession->getLogin()->isCodeRequired()) {
      $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, '');

      CacheService::removeAuthentication($personSession);

      $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
      $groupMonitors = self::sessionDAO()->getGroupMonitors($personSession);
      $sysChecks = self::sessionDAO()->getSysChecksOfPerson($personSession);
      $accessSet = AccessSet::createFromPersonSession($personSession, ...$testsOfPerson, ...$groupMonitors, ...$sysChecks);

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
    $body = RequestBodyParser::getElementsFromRequest($request, [
      'code' => ''
    ]);

    $loginSession = self::sessionDAO()->getLoginSessionByToken(self::authToken($request)->getToken());

    $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, $body['code']);
    CacheService::removeAuthentication($personSession);
    $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
    CacheService::storeAuthentication($personSession);
    return $response->withJson(AccessSet::createFromPersonSession($personSession, ...$testsOfPerson));
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
        $memberPersonSession = SessionController::sessionDAO()->createOrUpdatePersonSession(
          $member,
          $code,
          true,
          false
        );

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
            $test = self::testDAO()->createTest(
              $memberPersonSession->getPerson()->getId(),
              $bookletId,
              $bookletFile->getLabel()
            );
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
      $workspace = self::workspaceDAO($personSession->getLoginSession()->getLogin()->getWorkspaceId());
      $workspaceData = new WorkspaceData(
        $workspace->getWorkspaceId(),
        $workspace->getWorkspaceName(),
        'R'
      );
      $groupMonitors = self::sessionDAO()->getGroupMonitors($personSession);
      $sysChecks = self::sessionDAO()->getSysChecksOfPerson($personSession);

      $accessSet = AccessSet::createFromPersonSession($personSession, $workspaceData, ...$testsOfPerson, ...$groupMonitors, ...$sysChecks);
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
