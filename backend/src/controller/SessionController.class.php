<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;
use AltchaOrg\Altcha\Altcha;
use AltchaOrg\Altcha\BaseChallengeOptions;
use AltchaOrg\Altcha\ChallengeOptions;
use AltchaOrg\Altcha\Hasher\Algorithm;


class SessionController extends Controller {
  protected static array $_workspaces = [];
  private const SALT_LENGTH = 12;

    /**
   * @codeCoverageIgnore
   */
  public static function putSession(Request $request, Response $response): Response {

    $body = RequestHelper::getFields($request, [
      'algorithm' => 'REQUIRED',
      'challenge' => 'REQUIRED',
      'salt' => 'REQUIRED',
      'signature' => 'REQUIRED',
      'number' => 'REQUIRED'
    ]);

    $altcha = new Altcha(SystemConfig::$server_key);
    if (!$altcha -> verifySolution($body)) {
      throw new HttpError("Wrong challenge response", 400);
    }

    parse_str(substr($body['salt'], (SessionController::SALT_LENGTH << 1) + 1), $params);
    switch ($params['loginType']) {
      case 'admin':
        return $response->withJson(self::createAdminSession($request, $params['name'], $params['password']));
      case 'login':
        return $response->withJson(self::createLoginSession($request, $params['name'], $params['password']));
    }

    if (!$request->hasHeader('AuthToken')) {
      throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: missing');
    }

    $authToken = $request->getHeaderLine('AuthToken');
    if (!$authToken) {
      throw new HttpUnauthorizedException($request, "Auth Header not sufficient: empty");
    }

    return $response->withJson(
      self::createPersonSession(self::sessionDAO()->getToken($authToken, ['login'])->getToken(), $params['code'])
    );
  }


  /**
   * @codeCoverageIgnore
   */
  public static function putSessionAdmin(Request $request, Response $response): Response {

    $body = RequestHelper::getFields($request, [
      "name" => 'REQUIRED',
      "password" => ''
    ]);

    $password = $body['password'];
    $bruteForceProtectionSessions = implode(", ", SystemConfig::$bruteForceProtection_sessions);
    if ($password && in_array('admin', SystemConfig::$bruteForceProtection_sessions)) {
      throw new HttpError("Brute Force protection active. Challenge for this password(`$password`) must be solved to create a session(`$bruteForceProtectionSessions`)", 400);
    }

    return $response->withJson(self::createAdminSession($request, $body['name'], $body['password'] ));
  }

  public static function putSessionLogin(Request $request, Response $response): Response {

    $body = RequestHelper::getFields($request, [
      "name" => 'REQUIRED',
      "password" => ''
    ]);
    if ($body['password'] && in_array('login', SystemConfig::$bruteForceProtection_sessions)) {
      throw new HttpError("Brute Force protection active. Challenge for this password must be solved to create a session", 400);
    }

    return $response->withJson(self::createLoginSession($request, $body['name'], $body['password']));
  }

  /**
   * @codeCoverageIgnore
   */
  public static function putSessionPerson(Request $request, Response $response): Response {
    $body = RequestHelper::getFields($request, [
      'code' => ''
    ]);
    if ($body['code'] && in_array('person', SystemConfig::$bruteForceProtection_sessions)) {
      throw new HttpError("Brute Force protection active. Challenge for this code must be solved to create a session", 400);
    }
    return $response->withJson(self::createPersonSession(self::authToken($request)->getToken(), $body['code']));

  }

  private static function registerDependantSessions(LoginSession $login): void {
    $members = self::sessionDAO()->getDependantSessions($login);

    $workspace = self::getWorkspace($login->getLogin()->getWorkspaceId());
    $bookletFiles = [];
    $sessionChanges = [];
    /** @var $bookletFiles XMLFileBooklet[] */

    foreach ($members as $member) {
      /** @var $member LoginSession */

      if (Mode::hasCapability($member->getLogin()->getMode(), 'alwaysNewSession')) {
        continue;
      }

      if (!Mode::hasCapability($member->getLogin()->getMode(), 'monitorable')) {
        continue;
      }

      if (!$member->getToken()) {
        $member = SessionController::sessionDAO()->createLoginSession($member->getLogin());
      }

      $membersBooklets = $member->getLogin()->testNames();
      foreach ($membersBooklets as $code => $testNames) {
        $memberPersonSession = SessionController::sessionDAO()->createOrUpdatePersonSession($member, (string)$code, true, false);

        foreach ($testNames as $testNameStr) {
          /** @var $testNameStr string */
          $testName = TestName::fromString($testNameStr);
          if (!isset($bookletFiles[$testName->bookletFileId])) {
            $bookletFile = $workspace->getFileById('Booklet', $testName->bookletFileId);
            $bookletFiles[$testName->bookletFileId] = $bookletFile;
          } else {
            $bookletFile = $bookletFiles[$testName->bookletFileId];
          }
          /** @var $bookletFile XMLFileBooklet */

          for ($i = 0; $i < 5; $i++) {
            try {
              $test = self::testDAO()->getTestByPerson($memberPersonSession->getPerson()->getId(), $testName->name);
              if (!$test) {
                $test = self::testDAO()->createTest(
                  $memberPersonSession->getPerson()->getId(),
                  $testName,
                  $bookletFile->getLabel()
                );
              }

              break; // success
            } catch (Exception $e) {
              if ($i === 4){
                throw new Exception('Test Sessions could neither be found nor created.');
              }
            }
          }

          $sessionMessage = SessionChangeMessage::session($test->id, $memberPersonSession);
          $sessionMessage->setTestState((array) $test->state, $testName->name);
          $sessionChanges[] = $sessionMessage;
        }
      }
    }
    BroadcastService::sessionChanges($sessionChanges);
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

  public static function createSessionChallenge(Request $request, Response $response): Response {

    $body = RequestHelper::getFields($request, [
      'loginType' => 'REQUIRED',
      'name' => 'REQUIRED',
      'password' => 'REQUIRED'
    ]);

    return $response->withJson((new Altcha(SystemConfig::$server_key))->createChallenge(new ChallengeOptions(
      algorithm: Algorithm::SHA256,
      maxNumber: BaseChallengeOptions::DEFAULT_MAX_NUMBER,
      params: [ 'loginType' => $body['loginType'], 'name' => $body['name'], 'password' => $body['password'] ],
      saltLength: SessionController::SALT_LENGTH
    )));
  }

  public static function createPersonSessionChallenge(Request $request, Response $response): Response {
    $body = RequestHelper::getFields($request, [
      'code' => 'REQUIRED'
    ]);
    return $response->withJson((new Altcha(SystemConfig::$server_key))->createChallenge(new ChallengeOptions(
      algorithm: Algorithm::SHA256,
      maxNumber: BaseChallengeOptions::DEFAULT_MAX_NUMBER,
      params: [ 'code' => $body['code'] ],
      saltLength: SessionController::SALT_LENGTH
    )));
  }

  private static function createAdminSession(Request $request, string $name, string $password): AccessSet {

    $token = self::adminDAO()->createAdminToken($name, $password);
    if (is_a($token, FailedLogin::class)) {
      throw new HttpError("No login with this password.", 400);
    }

    $admin = self::adminDAO()->getAdmin($token);
    $workspaces = self::adminDAO()->getWorkspaces($token);
    $accessSet = AccessSet::createFromAdminToken($admin, ...$workspaces);
    if (!$accessSet->hasAccessType(AccessObjectType::WORKSPACE_ADMIN)
        && !$accessSet->hasAccessType(AccessObjectType::SUPER_ADMIN))
    {
      throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 204);
    }
    return $accessSet;
  }

  private static function createLoginSession(Request $request, string $name, string $password): AccessSet {

    $loginSession = self::sessionDAO()->getOrCreateLoginSession($name, $password);
    if (!is_a($loginSession, LoginSession::class)) {
      $userName = htmlspecialchars($name);
      throw new HttpBadRequestException($request, "No Login for `$userName` with this password.");
    }

    if ($loginSession->getLogin()->isCodeRequired()) {
      return AccessSet::createFromLoginSession($loginSession);
    }

    $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, '');
    $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
    $groupMonitors = self::sessionDAO()->getGroupMonitors($personSession);
    $sysChecks = self::sessionDAO()->getSysChecksOfPerson($personSession);
    self::registerDependantSessions($loginSession);
    return AccessSet::createFromPersonSession($personSession, ...$testsOfPerson, ...$groupMonitors, ...$sysChecks);
  }

  public static function createPersonSession(string $token, string $code): AccessSet {

    $loginSession = self::sessionDAO()->getLoginSessionByToken($token);
    $personSession = self::sessionDAO()->createOrUpdatePersonSession($loginSession, $code);
    $testsOfPerson = self::sessionDAO()->getTestsOfPerson($personSession);
    return AccessSet::createFromPersonSession($personSession, ...$testsOfPerson);
  }
}
