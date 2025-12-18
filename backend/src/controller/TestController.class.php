<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class TestController extends Controller {
  public static function put(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $body = RequestBodyParser::getFields($request, [
      'bookletName' => 'REQUIRED'
    ]);

    for ($i = 0; $i < 5; $i++) {
      try {
        $test = self::testDAO()->getTestByPerson($authToken->getId(), $body['bookletName']);

        if (!$test) {
          $workspace = new Workspace($authToken->getWorkspaceId());
          $testName = TestName::fromString($body['bookletName']);
          $bookletLabel = $workspace->getFileById('Booklet', $testName->bookletFileId)->getLabel();

          $test = self::testDAO()->createTest($authToken->getId(), $testName, $bookletLabel);
        }

        break; // success

      } catch (Exception $exception) {
        if ($i === 4) {
          throw new HttpInternalServerErrorException($request, 'Test Session could neither be found nor created.');
        }
      }
    }

    if ($test->locked) {
      throw new HttpException($request, "Test #$test->id `$test->label` is locked.", 423);
    }

    $response->getBody()->write((string) $test->id);
    return $response->withStatus(201);
  }

  public static function get(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');     // auth 1
    $testId = (int) $request->getAttribute('test_id');

    $test = self::testDAO()->getTestById($testId);

    if (!$test) {
      throw new HttpNotFoundException($request, "Test #$testId not found");
    }

    if ($test->locked) {
      throw new HttpException($request, "Test #$testId `$test->label` is locked.", 423);
    }

    $workspace = new Workspace($authToken->getWorkspaceId());
    $bookletFile = $workspace->getFileById('Booklet', $test->bookletFileId);
    $testName = TestName::fromString($test->name);

    // TODO check for Mode::hasCapability('monitorable'))

    if (!$test->running) {
      $personSession = self::sessionDAO()->getPersonSessionByToken($authToken->getToken());
      $message = SessionChangeMessage::session($test->id, $personSession);
      $testState = (array) $test->state;
      $testState['status'] = 'running';
      $message->setTestState($testState, $test->name);
      self::testDAO()->setTestRunning($test->id);
    } else {
      $message = SessionChangeMessage::testState(
        $authToken->getGroup(),
        $authToken->getId(),
        $test->id,
        (array) $test->state,
        $test->name
      );
    }
    BroadcastService::sessionChange($message);

    return $response->withJson([
      'mode' => $authToken->getMode(),
      'laststate' => (array) $test->state,
      'xml' => $bookletFile->getContent(),
      'resources' => $workspace->getBookletResourcePaths($bookletFile->getName()),
      'firstStart' => !$test->running,
      'workspaceId' => $workspace->getId(),
      'presetBookletStates' => $testName->states
    ]);
  }

  public static function getUnit(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $unitName = $request->getAttribute('unit_name');
    $unitAlias = $request->getAttribute('alias');
    $testId = (int) $request->getAttribute('test_id');

    $workspace = new Workspace($authToken->getWorkspaceId());
    /* @var $unitFile XMLFileUnit */
    $unitFile = $workspace->getFileById('Unit', $unitName);

    if (!$unitAlias) {
      $unitAlias = $unitName;
    }

    // TODO check if unit is (still) valid

    // TODO each part could have a different type
    $unitData = self::testDAO()->getDataParts($testId, $unitAlias);
    $unitState = (object) self::testDAO()->getUnitState($testId, $unitAlias);

    return $response->withJson([
      'state' => $unitState,
      'dataParts' => (object) $unitData['dataParts'],
      'unitResponseType' => $unitData['dataType'],
      'definition' => $unitFile->getDefinition(),
      'definitionType' => $unitFile->getDefinitionType()
    ]);
  }

  // TODO move to separate controller bc route starts with /file , not with /test
  public static function getFile(Request $request, Response $response, $args): Response {
    $groupTokenString = $request->getAttribute('group_token');
    $path = $args['path'];
    $workspaceId = (int) $request->getAttribute('ws_id');

    if (!$groupTokenString) {
      throw new HttpUnauthorizedException($request, 'No Token given');
    }
    if (!self::sessionDAO()->groupTokenExists($workspaceId, $groupTokenString)) {
      throw new HttpForbiddenException($request, 'Group-Token not valid');
    }
    if (!str_starts_with($path, 'Resource/')) {
      throw new HttpForbiddenException($request, "Access to file `$path` not allowed with group-token.");
    }

    $workspace = new Workspace($workspaceId);
    $resourceFile = $workspace->getWorkspacePath() . '/' . $path;

    $res = fopen($resourceFile, 'rb');
    if (!$res) {
      throw new HttpNotFoundException($request, "File not found: `$path`");
    }

    header('Content-type: ' . FileExt::getMimeType($resourceFile));
    header('Content-Length: ' . filesize($resourceFile));
    header('X-Source: backend');
    fpassthru($res);
    http_response_code(200);
    fclose($res);
    die();
  }

  public static function putUnitReview(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');
    $unitName = $request->getAttribute('unit_name');

    $review = RequestBodyParser::getFields(
      $request,
      [
        'priority' => 0, // was: p
        'categories' => 0, // was: c
        'entry' => 'REQUIRED',// was: e
        'userAgent' => '',
        'page' => null,
        'pagelabel' => null,
        'originalUnitId' => null
      ],
    );

    $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
      ? (int) $review['priority']
      : 0;

    $personId = self::getPersonIdFromRequest($request);

    self::testDAO()->addUnitReview(
      $testId,
      $unitName,
      $priority,
      $review['categories'],
      $review['entry'],
      $review['userAgent'],
      $review['originalUnitId'] ?? '',
      $personId,
      $review['page'] ?? null,
      $review['pagelabel'] ?? null,
    );

    return $response->withStatus(201);
  }

  public static function putReview(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');

    $review = RequestBodyParser::getFields($request, [
      'priority' => 0, // was: p
      'categories' => 0, // was: c
      'entry' => 'REQUIRED', // was: e
      'userAgent' => ''
    ]);

    $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
      ? (int) $review['priority']
      : 0;
    $personId = self::getPersonIdFromRequest($request);

    self::testDAO()->addTestReview($testId, $priority, $review['categories'], $review['entry'], $review['userAgent'], $personId);

    return $response->withStatus(201);
  }

  public static function getUnitReviews(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');
    $unitName = $request->getAttribute('unit_name');

    if (!self::testDAO()->testExists($testId)) {
      throw new HttpNotFoundException($request, "Test with ID $testId not found");
    }

    if (!self::testDAO()->unitExists($testId, $unitName)) {
      throw new HttpNotFoundException($request, "Unit '$unitName' not found in test $testId");
    }
    $personId = self::getPersonIdFromRequest($request);
    $reviews = self::testDAO()->getUnitReviews($testId, $unitName, $personId);

    return $response->withJson($reviews);
  }

  public static function getReviews(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');

    if (!self::testDAO()->testExists($testId)) {
      throw new HttpNotFoundException($request, "Test with ID $testId not found");
    }
    $personId = self::getPersonIdFromRequest($request);
    $reviews = self::testDAO()->getTestReviews($testId, $personId);

    return $response->withJson($reviews);
  }

  public static function deleteUnitReview(Request $request, Response $response): Response {
    $reviewId = (int) $request->getAttribute('review_id');
    $personId = self::getPersonIdFromRequest($request);
    if (!self::testDAO()->unitReviewExists($reviewId, $personId)) {
      throw new HttpNotFoundException($request, "Review with ID $reviewId not found");
    }

    self::testDAO()->deleteUnitReview($reviewId, $personId);

    return $response->withStatus(204);
  }

  public static function deleteReview(Request $request, Response $response): Response {
    $reviewId = (int) $request->getAttribute('review_id');
    $personId = self::getPersonIdFromRequest($request);

    if (!self::testDAO()->testReviewExists($reviewId, $personId)) {
      throw new HttpNotFoundException($request, "Review with ID $reviewId not found");
    }
    self::testDAO()->deleteTestReview($reviewId, $personId);

    return $response->withStatus(204);
  }

  public static function patchUnitReview(Request $request, Response $response): Response {
    $reviewId = (int) $request->getAttribute('review_id');
    $personId = self::getPersonIdFromRequest($request);

    if (!self::testDAO()->unitReviewExists($reviewId, $personId)) {
      throw new HttpNotFoundException($request, "Review with ID $reviewId not found");
    }

    $review = RequestBodyParser::getFields(
      $request,
      [
        'priority' => 0,
        'categories' => '',
        'entry' => 'REQUIRED',
        'userAgent' => ''
      ]
    );

    $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
      ? (int) $review['priority']
      : 0;
    self::testDAO()->updateUnitReview(
      $reviewId,
      $priority,
      $review['categories'],
      $review['entry'],
      $review['userAgent'],
      $personId
    );

    return $response->withStatus(200);
  }

  public static function patchReview(Request $request, Response $response): Response {
    $reviewId = (int) $request->getAttribute('review_id');
    $personId = self::getPersonIdFromRequest($request);

    if (!self::testDAO()->testReviewExists($reviewId, $personId)) {
      throw new HttpNotFoundException($request, "Review with ID $reviewId not found");
    }

    $review = RequestBodyParser::getFields(
      $request,
      [
        'priority' => 0,
        'categories' => '',
        'entry' => 'REQUIRED',
        'userAgent' => ''
      ]
    );

    $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
      ? (int) $review['priority']
      : 0;

    self::testDAO()->updateTestReview(
      $reviewId,
      $priority,
      $review['categories'],
      $review['entry'],
      $review['userAgent'],
      $personId
    );

    return $response->withStatus(200);
  }

  public static function putUnitResponse(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');
    $unitName = $request->getAttribute('unit_name');

    $unitResponse = RequestBodyParser::getFields($request, [
      'timeStamp' => 'REQUIRED',
      'dataParts' => [],
      'OriginalUnitId' => '',
      'responseType' => 'unknown'
    ]);

    self::testDAO()->updateDataParts(
      $testId,
      $unitName,
      (array) $unitResponse['dataParts'],
      $unitResponse['responseType'],
      $unitResponse['timeStamp']
    );

    return $response->withStatus(201);
  }

  public static function patchState(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $testId = (int) $request->getAttribute('test_id');

    $statePatch = RequestBodyParser::getArrayOfFieldsets($request, [
      'key' => 'REQUIRED',
      'content' => 'REQUIRED',
      'timeStamp' => 'REQUIRED'
    ]);

    $newState = self::testDAO()->updateTestState($testId, $statePatch);

    $testLogs = array_map(
      fn ($entry) => new TestLog(
        $testId,
        $entry['key'],
        $entry['timeStamp'],
        json_encode($entry['content'])
      ),
      $statePatch
    );
    self::testDAO()->addTestLogs($testLogs);

    BroadcastService::sessionChange(
      SessionChangeMessage::testState($authToken->getGroup(), $authToken->getId(), $testId, $newState)
    );

    return $response->withStatus(200);
  }

  public static function putLog(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');

    $logData = RequestBodyParser::getArrayOfFieldsets($request, [
      'key' => 'REQUIRED',
      'content' => '',
      'timeStamp' => 'REQUIRED'
    ]);

    $testLogs = array_map(
      fn ($entry) => new TestLog(
        $testId,
        $entry['key'],
        $entry['timeStamp'],
        json_encode($entry['content'])
      ),
      $logData
    );
    self::testDAO()->addTestLogs($testLogs);

    return $response->withStatus(201);
  }

  public static function patchUnitState(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $testId = (int) $request->getAttribute('test_id');
    $unitName = $request->getAttribute('unit_name');

    $body = JSON::decode($request->getBody()->getContents());
    if (!is_array($body)) {
      // 'not being an array' is the new format
      $statePatch = RequestBodyParser::getArrayOfFieldsets(
        $request,
        [
          'key' => 'REQUIRED',
          'content' => 'REQUIRED',
          'timeStamp' => 'REQUIRED'
        ],
        'newState'
      );
      $originalUnitId = RequestBodyParser::getFieldWithDefault($request, 'originalUnitId', '');
    } else {
      // deprecated
      $statePatch = RequestBodyParser::getArrayOfFieldsets($request, [
        'key' => 'REQUIRED',
        'content' => 'REQUIRED',
        'timeStamp' => 'REQUIRED'
      ]);
      $originalUnitId = '';
    }

    $newState = self::testDAO()->updateUnitState($testId, $unitName, $statePatch, $originalUnitId);

    $unitLogs = array_map(
      fn($entry) => new UnitLog(
        $testId,
        $unitName,
        $entry['key'],
        $entry['timeStamp'],
        $entry['content']
      ),
      $statePatch
    );
    self::testDAO()->addUnitLogs($unitLogs);

    BroadcastService::sessionChange(
      SessionChangeMessage::unitState(
        $authToken->getGroup(),
        $authToken->getId(),
        $testId,
        $unitName,
        $newState
      )
    );

    return $response->withStatus(200);
  }

  public static function putUnitLog(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');
    $unitName = $request->getAttribute('unit_name');

    if (!is_array(JSON::decode($request->getBody()->getContents()))) {
      // 'not being an array' is the new format
      $logData = RequestBodyParser::getArrayOfFieldsets(
        $request,
        [
          'key' => 'REQUIRED',
          'content' => '',
          'timeStamp' => 'REQUIRED'
        ],
        'logEntries');
    } else {
      $logData = RequestBodyParser::getArrayOfFieldsets($request, [
        'key' => 'REQUIRED',
        'content' => '',
        'timeStamp' => 'REQUIRED'
      ]);
    }

    $unitLogs = array_map(
      fn($entry) => new UnitLog(
        $testId,
        $unitName,
        $entry['key'],
        $entry['timeStamp'],
        json_encode($entry['content'])
      ),
      $logData
    );
    self::testDAO()->addUnitLogs($unitLogs);

    return $response->withStatus(201);
  }

  public static function patchLock(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    $testId = (int) $request->getAttribute('test_id');

    $lockEvent = RequestBodyParser::getFields($request, [
      'timeStamp' => 'REQUIRED',
      'message' => ''
    ]);

    self::testDAO()->lockTest($testId);
    self::testDAO()->addTestLogs([new TestLog($testId, $lockEvent['message'], $lockEvent['timeStamp'])]);

    BroadcastService::sessionChange(
      SessionChangeMessage::testState($authToken->getGroup(), $authToken->getId(), $testId, ['status' => 'locked'])
    );

    return $response->withStatus(200);
  }

  public static function getCommands(Request $request, Response $response): Response {
    // TODO do we have to check access to test?
    $testId = (int) $request->getAttribute('test_id');
    $lastCommandId = RequestBodyParser::getFieldWithDefault($request, 'lastCommandId', null);

    $commands = self::testDAO()->getCommands($testId, $lastCommandId);

    $testee = [
      'testId' => $testId,
      'disconnectNotificationUri' => Server::getUrl() . "/test/$testId/connection-lost"
    ];
    if (TestEnvironment::$testMode) {
      $testee['disconnectNotificationUri'] .= '?testMode=' . TestEnvironment::$testMode;
    }
    $token = BroadcastService::registerChannel('testee', $testee);

    if ($token !== null) {
      $response = $response->withHeader('SubscribeToken', $token);
    }

    $testSession = self::testDAO()->getTestSession($testId);
    if (isset($testSession['laststate']['CONNECTION']) && ($testSession['laststate']['CONNECTION'] == 'LOST')) {
      self::updateTestState($testId, $testSession, 'CONNECTION', 'POLLING');
    }

    return $response->withJson($commands);
  }

  private static function updateTestState(int $testId, array $testSession, string $field, string $value): void {
    $newState = self::testDAO()->updateTestState($testId, [['key' => $field, 'content' => $value, 'timeStamp' => 0]]);
    self::testDAO()->addTestLogs([new TestLog($testId, '"' . $field . '"', 0, $value)]);

    $sessionChangeMessage = SessionChangeMessage::testState(
      $testSession['group_name'],
      (int) $testSession['person_id'],
      $testId,
      $newState
    );
    BroadcastService::sessionChange($sessionChangeMessage);
  }

  private static function getPersonIdFromRequest(Request $request): int {
    $authToken = $request->getAttribute('AuthToken');
    $tokenString = $authToken->getToken();

    $session = self::sessionDAO()->getPersonSessionByToken($tokenString);
    return $session->getPerson()->getId();
  }

  public static function patchCommandExecuted(Request $request, Response $response): Response {
    // TODO to we have to check access to test?
    $testId = (int) $request->getAttribute('test_id');
    $commandId = (int) $request->getAttribute('command_id');

    $changed = self::testDAO()->setCommandExecuted($testId, $commandId);

    return $response->withStatus(200, $changed ? 'OK' : 'OK, was already marked as executed');
  }

  public static function postConnectionLost(Request $request, Response $response): Response {
    $testId = (int) $request->getAttribute('test_id');

    $testSession = self::testDAO()->getTestSession($testId);

    if (isset($testSession['laststate']['CONNECTION']) && ($testSession['laststate']['CONNECTION'] == 'LOST')) {
      return $response->withStatus(200, "connection already set as lost");
    }

    self::updateTestState($testId, $testSession, 'CONNECTION', 'LOST');

    return $response->withStatus(200);
  }
}
