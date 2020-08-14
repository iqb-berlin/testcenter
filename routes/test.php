<?php
declare(strict_types=1);

use Slim\App;
use Slim\Exception\HttpException;
use Slim\Http\Request;
use Slim\Http\Response;


$app->group('/test', function(App $app) {


    $testDAO = new TestDAO();


    $app->put('', function(Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $body = RequestBodyParser::getElements($request, [
            'bookletName' => null
        ]);

        $bookletsFolder = new BookletsFolder($authToken->getWorkspaceId());
        $bookletLabel = $bookletsFolder->getBookletLabel($body['bookletName']);

        // TODO lock old test if this person already ran one

        $test = $testDAO->getOrCreateTest($authToken->getId(), $body['bookletName'], $bookletLabel);

        if ($test['locked'] == '1') {
            throw new HttpException($request,"Test #{$test['id']} `{$test['label']}` is locked.", 423);
        }

        $testDAO->setTestRunning((int) $test['id']);

        BroadcastService::sessionChange(SessionChangeMessage::testState(
            $authToken,
            (int) $test['id'],
            $test['lastState'] ? json_decode($test['lastState']) : ['status' => 'running'],
            $body['bookletName']
        ));

        $response->getBody()->write($test['id']);
        return $response->withStatus(201);
    });


    $app->get('/{test_id}', function(Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $testId = (int) $request->getAttribute('test_id');

        $bookletName = $testDAO->getBookletName($testId);
        $workspaceController = new WorkspaceController($authToken->getWorkspaceId());
        $bookletFile = $workspaceController->getXMLFileByName('Booklet', $bookletName);

        return $response->withJson([ // TODO include running, use only one query
            'mode' => $authToken->getMode(),
            'laststate' => $testDAO->getTestLastState($testId),
            'locked' => $testDAO->isTestLocked($testId),
            'xml' => $bookletFile->xmlfile->asXML()
        ]);
    });


    $app->get('/{test_id}/unit/{unit_name}', function(Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $unitName = $request->getAttribute('unit_name');
        $testId = (int) $request->getAttribute('test_id');

        $workspaceController = new WorkspaceController($authToken->getWorkspaceId());
        $unitFile = $workspaceController->getXMLFileByName('Unit', $unitName);

        $unit = [
            'laststate' => $testDAO->getUnitLastState($testId, $unitName),
            'restorepoint' => $testDAO->getRestorePoint($testId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unit);
    });


    $app->get('/{test_id}/resource/{resource_name}', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $resourceName = $request->getAttribute('resource_name');
        $skipSubVersions = $request->getQueryParam('v', 'f') != 'f'; // TODO rename

        $workspaceController = new WorkspaceController($authToken->getWorkspaceId());
        $resourceFile = $workspaceController->getResourceFileByName($resourceName, $skipSubVersions);

        $response->getBody()->write($resourceFile->getContent());

        return $response->withHeader('Content-type', 'text/plain');
    });


    $app->put('/{test_id}/unit/{unit_name}/review', function (Request $request, Response $response) use ($testDAO) {

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

        $testDAO->addUnitReview($testId, $unitName, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/{test_id}/review', function (Request $request, Response $response) use ($testDAO) {

        $testId = (int) $request->getAttribute('test_id');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? (int) $review['priority']
            : 0;

        $testDAO->addTestReview($testId, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/{test_id}/unit/{unit_name}/response', function (Request $request, Response $response) use ($testDAO) {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $unitResponse = RequestBodyParser::getElements($request, [
            'timestamp' => null,
            'response' => null,
            'responseType' => 'unknown'
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $testDAO->addResponse($testId, $unitName, $unitResponse['response'], $unitResponse['responseType'], $unitResponse['timestamp']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->patch('/{test_id}/unit/{unit_name}/restorepoint', function (Request $request, Response $response) use ($testDAO) {

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'timestamp' => null,
            'restorePoint' => null
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $testDAO->updateRestorePoint($testId, $unitName, $body['restorePoint'], $body['timestamp']);

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->patch('/{test_id}/unit/{unit_name}/state', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $testDAO->updateUnitLastState($testId, $unitName, $body['key'], $body['value']);

        BroadcastService::sessionChange(
            SessionChangeMessage::unitState($authToken, $testId, $unitName, [$body['key'] => $body['value']])
        );

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->patch('/{test_id}/state', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $testDAO->updateTestLastState($testId, $body['key'], $body['value']);

        BroadcastService::sessionChange(
            SessionChangeMessage::testState($authToken, $testId, [$body['key'] => $body['value']])
        );

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->put('/{test_id}/unit/{unit_name}/log', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        // TODO check if unit exists in this booklet https://github.com/iqb-berlin/testcenter-iqb-php/issues/106

        $testDAO->addUnitLog($testId, $unitName, $body['entry'], $body['timestamp']);

        BroadcastService::sessionChange(SessionChangeMessage::unitState(
            $authToken, $testId, $unitName, $testDAO->log2itemState($body['entry']))
        );

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/{test_id}/log', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        $testDAO->addBookletLog($testId, $body['entry'], $body['timestamp']);

        BroadcastService::sessionChange(
            SessionChangeMessage::testState($authToken, $testId, $testDAO->log2itemState($body['entry']))
        );

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->patch('/{test_id}/lock', function (Request $request, Response $response) use ($testDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $testId = (int) $request->getAttribute('test_id');

        $testDAO->lockBooklet($testId);

        BroadcastService::sessionChange(
            SessionChangeMessage::testState($authToken, $testId, ['status' => 'locked'])
        );

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    // TODO add spec
    $app->get('/{test_id}/commands', function(Request $request, Response $response) use ($testDAO) {

        // TODO to we have to check access to test?
        $testId = (int) $request->getAttribute('test_id');
        $lastCommandId = RequestBodyParser::getElementWithDefault($request,'lastCommandId', null);

        $commands = $testDAO->getCommands($testId, $lastCommandId);

        $bsUrl = BroadcastService::registerChannel('register/test', ['testId' => $testId]);

        if ($bsUrl === null) {

            $response = $response->withHeader('SubscribeURI', $bsUrl);
        }

        return $response->withJson($commands);
    });
})
    ->add(new RequireToken('person'));
