<?php

use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('', function(App $app) {

    $dbConnectionTC = new DBConnectionTC();

    $app->get('/test/{test_id}', function(Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();
        $testId = $request->getAttribute('test_id');

        $bookletName = $dbConnectionTC->getBookletName($testId);
        $workspaceId = $dbConnectionTC->getWorkspaceId($personToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $bookletFile = $workspaceController->getXMLFileByName('Booklet', $bookletName);

        $test = [
            'laststate' => $dbConnectionTC->getTestLastState($testId),
            'locked' => $dbConnectionTC->isTestLocked($testId),
            'xml' => $bookletFile->xmlfile->asXML()
        ];

        return $response->withJson($test);
    });


    $app->get('/test/{test_id}/unit/{unit_name}', function(Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();
        $unitName = $request->getAttribute('unit_name');
        $testId = $request->getAttribute('test_id');

        $workspaceId = $dbConnectionTC->getWorkspaceId($personToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $unitFile = $workspaceController->getXMLFileByName('Unit', $unitName);

        $unit = [
            'laststate' => $dbConnectionTC->getUnitLastState($testId, $unitName),
            'restorepoint' => $dbConnectionTC->getRestorePoint($testId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unit);
    });


    $app->get('/resource/{resource_name}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        $resourceName = $request->getAttribute('resource_name');
        $skipSubVersions = $request->getQueryParam('v', 'f') != 'f'; // TODO rename

        $workspaceId = $dbConnectionTC->getWorkspaceId($personToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $resourceFile = $workspaceController->getResourceFileByName($resourceName, $skipSubVersions);

        $response->getBody()->write($resourceFile->getContent());

        return $response->withHeader('Content-type', 'text/plain');
    });


    $app->put('/test/{test_id}/unit/{unit_name}/review', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        // TODO check if unit exists in this booklet

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? $review['priority']
            : 0;

        $dbConnectionTC->addUnitReview($testId, $unitName, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/test/{test_id}/review', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? $review['priority']
            : 0;

        $dbConnectionTC->addTestReview($testId, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/test/{test_id}/unit/{unit_name}/response', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $review = RequestBodyParser::getElements($request, [
            'timestamp' => null,
            'response' => null,
            'responseType' => 'unknown'
        ]);

        $dbConnectionTC->addResponse($testId, $unitName, $review['response'], $review['responseType'], $review['timestamp']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->patch('/test/{test_id}/unit/{unit_name}/restorepoint', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'timestamp' => null,
            'restorePoint' => null
        ]);

        // TODO check if unit exists in this booklet

        $dbConnectionTC->updateRestorePoint($testId, $unitName, $body['restorePoint'], $body['timestamp']);

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->patch('/test/{test_id}/unit/{unit_name}/state', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $dbConnectionTC->updateUnitLastState($testId, $unitName, $body['key'], $body['value']);

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->patch('/test/{test_id}/state', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $dbConnectionTC->updateTestLastState($testId, $body['key'], $body['value']);

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());


    $app->put('/test/{test_id}/unit/{unit_name}/log', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        // TODO check if unit exists in this booklet

        $dbConnectionTC->addUnitLog($testId, $unitName, $body['entry'], $body['timestamp']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->put('/test/{test_id}/log', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        $dbConnectionTC->addBookletLog($testId, $body['entry'], $body['timestamp']);

        return $response->withStatus(201);
    })
        ->add(new IsTestWritable());


    $app->post('/test/{test_id}/lock', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $dbConnectionTC->lockBooklet($testId);

        return $response->withStatus(200);
    })
        ->add(new IsTestWritable());
})
    ->add(new RequirePersonToken());

// was /startbooklet

/**
 * TODO this should as well RequirePersonToken instead of RequireLoginToken
 * after https://github.com/iqb-berlin/testcenter-iqb-ng/issues/52 is resolved,
 * remove PersonTokenCreation from here
 */

$app->put('/test', function(Request $request, Response $response) {

    /* @var $authToken LoginAuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $loginToken = $authToken->getToken();

    $body = RequestBodyParser::getElements($request, [
        'code' => 0, // was: c
        'bookletLabel' => '¿Testheft?', // was: bl
        'bookletName' => null // was: b
    ]);

    $dbConnectionStart = new DBConnectionStart();

    /* TODO instead work with personToken and delete from here ... */
    $loginId = $dbConnectionStart->getLoginId($loginToken);

    if ($loginId == null) {
        throw new HttpForbiddenException($request);
    }

    $person = $dbConnectionStart->getOrCreatePerson($loginId, $body['code']);
    /* ... to here ... */

    $person = $dbConnectionStart->getPerson($person['token']);

    if ($person == null) {
        throw new HttpForbiddenException($request);
    }


    $test = $dbConnectionStart->getOrCreateTest($person['id'], $body['bookletName'], $body['bookletLabel']);

    if ($test['locked'] == '1') {
        throw new HttpException($request,"Test #{$test['id']} `{$test['label']}` is locked.", 423);
    }

    return $response->withJson([
        'testId' => $test['id'],
        'personToken' => $person['token'] // person token
    ])->withStatus(201);
})
    ->add(new RequireLoginToken());
