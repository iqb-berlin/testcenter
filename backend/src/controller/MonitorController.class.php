<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class MonitorController extends Controller {
  /**
   * @deprecated
   */
  public static function getGroup(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $groupName = $request->getAttribute('group_name');

    $group = self::adminDAO()->getGroup($groupName);

    if (!$group) {
      throw new HttpNotFoundException($request, "Group `$groupName` not found.");
    }

    // currently a group-monitor can always only monitor it's own group
    if ($groupName !== $authToken->getGroup()) {
      throw new HttpForbiddenException($request, "Group `$groupName` not allowed.");
    }

    return $response
      ->withHeader("Deprecation", "true")
      ->withJson($group);
  }

  public static function getTestSessions(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $groupName = $request->getAttribute('group_name');
    $groupNames = $groupName ? [$groupName] : array_keys($request->getAttribute('groups'));

    $sessionChangeMessages = self::adminDAO()->getTestSessions($authToken->getWorkspaceId(), $groupNames);

    $bsUrl = BroadcastService::registerChannel('monitor', ["groups" => $groupNames]);

    if ($bsUrl !== null) {
      foreach ($sessionChangeMessages as $sessionChangeMessage) {
        BroadcastService::sessionChange($sessionChangeMessage);
      }

      $response = $response->withHeader('SubscribeURI', $bsUrl);
    }

    return $response->withJson($sessionChangeMessages->asArray());
  }

  public static function putCommand(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $personId = $authToken->getId();

    $body = RequestBodyParser::getElementsFromRequest($request, [
      'keyword' => 'REQUIRED',
      'arguments' => [],
      'timestamp' => 'REQUIRED',
      'testIds' => []
    ]);

    $command = new Command(-1, $body['keyword'], (int) $body['timestamp'], ...$body['arguments']);

    foreach (array_unique($body['testIds']) as $testId) {
      if (!self::adminDAO()->getTest($testId)) {
        throw new HttpNotFoundException(
          $request, "Test `$testId` not found. `{$command->getKeyword()}` not committed."
        );
      }
    }

    foreach ($body['testIds'] as $testId) {
      $commandId = self::adminDAO()->storeCommand($personId, (int) $testId, $command);
      $command->setId($commandId);
    }

    BroadcastService::send('command', json_encode([
      'command' => $command,
      'testIds' => $body['testIds']
    ]));

    return $response->withStatus(201);
  }

  public static function postUnlock(Request $request, Response $response): Response {
    $groupName = $request->getAttribute('group_name');
    $testIds = RequestBodyParser::getElementWithDefault($request, 'testIds', []);

    foreach ($testIds as $testId) {
      // TODO check if test is in group
      self::testDAO()->changeTestLockStatus((int) $testId);

      $testSession = self::testDAO()->getTestSession($testId);
      BroadcastService::sessionChange(
        SessionChangeMessage::testState(
          $groupName,
          (int) $testSession['person_id'],
          $testId,
          $testSession['laststate']
        )
      );
    }

    return $response->withStatus(200);
  }

  public static function postLock(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $groupName = $request->getAttribute('group_name');
    $testIds = RequestBodyParser::getElementWithDefault($request, 'testIds', []);

    foreach ($testIds as $testId) {
      // TODO check if test is in group
      self::testDAO()->changeTestLockStatus((int) $testId, false);

      $testSession = self::testDAO()->getTestSession($testId);
      self::testDAO()->addTestLog($testId, 'locked by monitor', 0, (string) $authToken->getId());
      BroadcastService::sessionChange(
        SessionChangeMessage::testState(
          $groupName,
          (int) $testSession['person_id'],
          $testId,
          $testSession['laststate']
        )
      );
    }

    return $response->withStatus(200);
  }

  public static function getProfile(Request $request, Response $response): Response {
    $authToken = $request->getAttribute('AuthToken');
    /** @var $authToken AuthToken */

    $profileId = $groupName = $request->getAttribute('profile_id');
    $session = self::sessionDAO()->getPersonSessionByToken($authToken->getToken());
    $profiles = $session->getLoginSession()->getLogin()->getProfiles();
    foreach ($profiles as $profile) {
      if ($profile['id'] == $profileId) {
        return $response->withJson((object) $profile);
      }
    }
    throw new HttpNotFoundException($request, "Profile not found `$profileId`");
  }
}
