<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use Slim\Exception\HttpException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\Stream;


class TestController extends Controller {

    public static function put(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $body = RequestBodyParser::getElements($request, [
            'bookletName' => null
        ]);

        $bookletsFolder = new BookletsFolder($authToken->getWorkspaceId());
        $bookletLabel = $bookletsFolder->getBookletLabel($body['bookletName']);

        // TODO lock old test if this person already ran one

        $test = self::testDAO()->getOrCreateTest($authToken->getId(), $body['bookletName'], $bookletLabel);

        if ($test['locked'] == '1') {
            throw new HttpException($request,"Test #{$test['id']} `{$test['label']}` is locked.", 423);
        }

        self::testDAO()->setTestRunning((int) $test['id']);

        // TODO check for Mode::hasCapability('monitorable'))
        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup(), (int) $test['id']);
        if ($test['_newlyCreated']) {
            // can happen when mode is run-hot-return for example
            $personLogin = self::sessionDAO()->getPersonLogin($authToken->getToken());
            $message->setLogin(
                $personLogin->getLogin()->getName(),
                $authToken->getMode(),
                $personLogin->getLogin()->getGroupLabel(),
                $personLogin->getPerson()->getCode()
            );
        }
        $message->setTestState(
            isset($test['lastState']) && $test['lastState'] ? json_decode($test['lastState']) : ['status' => 'running'],
            $body['bookletName']
        );
        BroadcastService::sessionChange($message);

        $response->getBody()->write($test['id']);
        return $response->withStatus(201);
    }


    public static function get(Request $request, Response $response) : Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $testId = (int) $request->getAttribute('test_id');

        $bookletName = self::testDAO()->getBookletName($testId);
        $workspaceController = new Workspace($authToken->getWorkspaceId());
        $bookletFile = $workspaceController->findFileById('Booklet', $bookletName);

        if (self::testDAO()->isTestLocked($testId)) {
            throw new HttpException($request,"Test #$testId `{$bookletFile->getLabel()}` is locked.", 423);
        }

        return $response->withJson([ // TODO include running, use only one query
            'mode' => $authToken->getMode(),
            'laststate' => self::testDAO()->getTestState($testId),
            'xml' => $bookletFile->xml->asXML()
        ]);
    }


    public static function getUnit(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $unitName = $request->getAttribute('unit_name');
        $unitAlias = $request->getAttribute('alias');
        $testId = (int) $request->getAttribute('test_id');

        $workspaceController = new Workspace($authToken->getWorkspaceId());
        /* @var $unitFile XMLFileUnit */
        $unitFile = $workspaceController->findFileById('Unit', $unitName);

        if (!$unitAlias) {
            $unitAlias = $unitName;
        }

        // TODO check if unit is (still) valid

        $unit = [
            'state' => self::testDAO()->getUnitState($testId, $unitAlias),
            'data' => self::testDAO()->getDataParts($testId, $unitAlias),
            'playerId' => $unitFile->getPlayerId(),
        ];

        $definitionRef = $unitFile->getDefinitionRef();
        if ($definitionRef) {
            $unit['definitionRef'] = $definitionRef;
        }
        $definition = $unitFile->getDefinition();
        if ($definition) {
            $unit['definition'] = $definition;
        }



        return $response->withJson($unit);
    }


    public static function getResource(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $resourceName = $request->getAttribute('resource_name');
        $skipSubVersions = $request->getQueryParam('v', 'f') != 'f'; // TODO rename

        $workspaceController = new Workspace($authToken->getWorkspaceId());
        $resourceFile = $workspaceController->findFileById('Resource', $resourceName, $skipSubVersions);

        return $response
            ->withBody(new Stream(fopen($resourceFile->getPath(), 'rb')))
            ->withHeader('Content-type', 'application/octet-stream') // TODO find out why it only works with pdf or octet-stream
            ->withHeader('Content-length', $resourceFile->getSize());
    }


    public static function putUnitReview(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? (int) $review['priority']
            : 0;

        self::testDAO()->addUnitReview($testId, $unitName, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    }


    public static function putReview(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? (int) $review['priority']
            : 0;

        self::testDAO()->addTestReview($testId, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    }


    public static function putUnitResponse(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $unitResponse = RequestBodyParser::getElements($request, [
            'timeStamp' => null,
            'response' => null,
            'responseType' => 'unknown'
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        self::testDAO()->addResponse($testId, $unitName, $unitResponse['response'], $unitResponse['responseType'], $unitResponse['timeStamp']);

        return $response->withStatus(201);
    }


    public static function patchState(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');

        $stateData = RequestBodyParser::getElementsArray($request, [
            'key' => null,
            'content' => null,
            'timeStamp' => null
        ]);

        $statePatch = TestController::stateArray2KeyValue($stateData);

        $newState = self::testDAO()->updateTestState($testId, $statePatch);

        foreach ($stateData as $entry) {
            self::testDAO()->addTestLog($testId, $entry['key'], $entry['timeStamp'], json_encode($entry['content']));
        }

        BroadcastService::sessionChange(
            SessionChangeMessage::testState($authToken, $testId, $newState)
        );

        return $response->withStatus(200);
    }


    public static function putLog(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');

        $logData = RequestBodyParser::getElementsArray($request, [
            'key' => null,
            'content' => '',
            'timeStamp' => null
        ]);

        foreach ($logData as $entry) {
            self::testDAO()->addTestLog($testId, $entry['key'], $entry['timeStamp'], json_encode($entry['content']));
        }

        return $response->withStatus(201);
    }


    public static function putUnitState(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $stateData = RequestBodyParser::getElementsArray($request, [
            'key' => null,
            'content' => null,
            'timeStamp' => null
        ]);

        $statePatch = TestController::stateArray2KeyValue($stateData);

        $newState = self::testDAO()->updateUnitState($testId, $unitName, $statePatch);

        foreach ($stateData as $entry) {
            self::testDAO()->addUnitLog($testId, $unitName, $entry['key'], $entry['timeStamp'], $entry['content']);
        }

        BroadcastService::sessionChange(
            SessionChangeMessage::unitState($authToken, $testId, $unitName, $newState)
        );

        return $response->withStatus(200);
    }


    public static function putUnitLog(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $logData = RequestBodyParser::getElementsArray($request, [
            'key' => null,
            'content' => '',
            'timeStamp' => null
        ]);

        foreach ($logData as $entry) {
            self::testDAO()->addUnitLog($testId, $unitName, $entry['key'], $entry['timeStamp'], json_encode($entry['content']));
        }

        return $response->withStatus(201);
    }


    public static function patchLock(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');

        self::testDAO()->lockTest($testId);

        BroadcastService::sessionChange(
            SessionChangeMessage::testState($authToken, $testId, ['status' => 'locked'])
        );

        return $response->withStatus(200);
    }


    public static function getCommands(Request $request, Response $response): Response {

        // TODO do we have to check access to test?
        $testId = (int) $request->getAttribute('test_id');
        $lastCommandId = RequestBodyParser::getElementWithDefault($request,'lastCommandId', null);

        $commands = self::testDAO()->getCommands($testId, $lastCommandId);

        $testee = [
            'testId' => $testId,
            'disconnectNotificationUri' => Server::getUrl() . "/test/{$testId}/connection-lost"
        ];
        $bsUrl = BroadcastService::registerChannel('testee', $testee);

        if ($bsUrl !== null) {

            $response = $response->withHeader('SubscribeURI', $bsUrl);
        }

        $testSession = self::testDAO()->getTestSession($testId);
        if (isset($testSession['laststate']['CONNECTION']) && ($testSession['laststate']['CONNECTION'] == 'LOST')) {

            self::updateTestState($testId, $testSession, 'CONNECTION', 'POLLING');
        }

        return $response->withJson($commands);
    }


    private static function updateTestState(int $testId, array $testSession, string $field, string $value) {

        $newState = self::testDAO()->updateTestState($testId, [$field => $value]);
        self::testDAO()->addTestLog($testId, '"' . $field . '"', 0, $value);

        $sessionChangeMessage = new SessionChangeMessage((int) $testSession['person_id'], $testSession['group_name'], $testId);
        $sessionChangeMessage->setTestState($newState);
        BroadcastService::sessionChange($sessionChangeMessage);
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


    // TODO replace this and use proper data-class
    private static function stateArray2KeyValue(array $stateData): array {
        $statePatch = [];
        foreach ($stateData as $stateEntry) {
            $statePatch[$stateEntry['key']] = is_object($stateEntry['content'])
                ? json_encode($stateEntry['content'])
                : $stateEntry['content'];
        }
        return $statePatch;
    }
}
