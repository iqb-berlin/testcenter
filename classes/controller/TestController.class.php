<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use Slim\Exception\HttpException;
use Slim\Http\Request;
use Slim\Http\Response;


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

        BroadcastService::sessionChange(SessionChangeMessage::testState(
            $authToken,
            (int) $test['id'],
            isset($test['lastState']) && $test['lastState'] ? json_decode($test['lastState']) : ['status' => 'running'],
            $body['bookletName']
        ));

        $response->getBody()->write($test['id']);
        return $response->withStatus(201);
    }


    public static function get(Request $request, Response $response) : Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $testId = (int) $request->getAttribute('test_id');

        $bookletName = self::testDAO()->getBookletName($testId);
        $workspaceController = new Workspace($authToken->getWorkspaceId());
        $bookletFile = $workspaceController->getXMLFileByName('Booklet', $bookletName);

        return $response->withJson([ // TODO include running, use only one query
            'mode' => $authToken->getMode(),
            'laststate' => self::testDAO()->getTestState($testId),
            'locked' => self::testDAO()->isTestLocked($testId),
            'xml' => $bookletFile->xmlfile->asXML()
        ]);
    }


    public static function getUnit(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $unitName = $request->getAttribute('unit_name');
        $testId = (int) $request->getAttribute('test_id');

        $workspaceController = new Workspace($authToken->getWorkspaceId());
        $unitFile = $workspaceController->getXMLFileByName('Unit', $unitName);

        $unit = [
            'laststate' => self::testDAO()->getUnitState($testId, $unitName),
            'restorepoint' => self::testDAO()->getRestorePoint($testId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unit);
    }


    public static function getResource(Request $request, Response $response): Response {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $resourceName = $request->getAttribute('resource_name');
        $skipSubVersions = $request->getQueryParam('v', 'f') != 'f'; // TODO rename

        $workspaceController = new Workspace($authToken->getWorkspaceId());
        $resourceFile = $workspaceController->getResourceFileByName($resourceName, $skipSubVersions);

        $response->getBody()->write($resourceFile->getContent());

        return $response->withHeader('Content-type', 'text/plain');
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


    public static function patchUnitRestorepoint(Request $request, Response $response): Response {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'timeStamp' => null,
            'restorePoint' => null
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        self::testDAO()->updateRestorePoint($testId, $unitName, $body['restorePoint'], $body['timeStamp']);

        return $response->withStatus(200);
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

        error_log('OUT OUT OUT:' . print_r($statePatch, true));

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

        self::testDAO()->lockBooklet($testId);

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

        $bsUrl = BroadcastService::registerChannel('testee', ['testId' => $testId]);

        if ($bsUrl !== null) {

            $response = $response->withHeader('SubscribeURI', $bsUrl);
        }

        return $response->withJson($commands);
    }


    public static function patchCommandExecuted(Request $request, Response $response): Response {

        // TODO to we have to check access to test?
        $testId = (int) $request->getAttribute('test_id');
        $commandId = (int) $request->getAttribute('command_id');

        $changed = self::testDAO()->setCommandExecuted($testId, $commandId);

        return $response->withStatus(200, $changed ? 'OK' : 'OK, was already marked as executed');
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
