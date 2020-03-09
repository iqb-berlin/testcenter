<?php

use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('', function(App $app) {

    $dbConnectionTC = new DBConnectionTC();

    // was: [GET] /bookletdata
    $app->get('/test/{test_id}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();
        $testId = $request->getAttribute('test_id');

        $bookletName = $dbConnectionTC->getBookletName($testId);
        $workspaceId = $dbConnectionTC->getWorkspaceId($personToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $bookletFile = $workspaceController->getXMLFileByName('Booklet', $bookletName);

        $test = [
            'laststate' => $dbConnectionTC->getBookletLastState($testId),
            'locked' => $dbConnectionTC->isBookletLocked($testId),
            'xml' => $bookletFile->xmlfile->asXML()
        ];

        return $response->withJson($test);
    }); // checked in original for $personToken != '' although it's not used at all


    // was /unitdata/{unit_id}
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
            'restorepoint' => $dbConnectionTC->getUnitRestorePoint($testId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unit);
    }); // checked in original for $personToken != '' although it's not used at all


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
    }); // checked in original for $loginToken != ''


    // was: [POST] /review
    $app->put('/test/{test_id}/unit/{unit_name}/review', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        // TODO check if a) test exists and b) unit exists there and c) user is allowed to review
        // a) leads to SQLerror at least, b) review gets written

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? $review['priority']
            : 0;

        $dbConnectionTC->addUnitReview($testId, $unitName, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    });


    $app->put('/test/{test_id}/review', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $review = RequestBodyParser::getElements($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => null // was: e
        ]);

        // TODO check if a) test exists and b) unit exists there and c) user is allowed to review
        // a) leads to SQLerror at least, b) review gets written

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? $review['priority']
            : 0;


        $dbConnectionTC->addBookletReview($testId, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    });


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
    });


    $app->patch('/test/{test_id}/unit/{unit_name}/restorepoint', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'timestamp' => null,
            'restorePoint' => null
        ]);

        $dbConnectionTC->updateRestorePoint($testId, $unitName, $body['restorePoint'], $body['timestamp']);

        return $response->withStatus(200);
    });


    $app->patch('/test/{test_id}/unit/{unit_name}/state', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $dbConnectionTC->updateUnitLastState($testId, $unitName, $body['key'], $body['value']);

        return $response->withStatus(200);
    });


    $app->patch('/test/{test_id}/state', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'key' => null,
            'value' => null
        ]);

        $dbConnectionTC->updateTestLastState($testId, $body['key'], $body['value']);

        return $response->withStatus(200);
    });


    $app->put('/test/{test_id}/unit/{unit_name}/log', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        $dbConnectionTC->addUnitLog($testId, $unitName, $body['entry'], $body['timestamp']);

        return $response->withStatus(201);
    });


    $app->put('/test/{test_id}/log', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $body = RequestBodyParser::getElements($request, [
            'entry' => null, // was e
            'timestamp' => null // was t
        ]);

        $dbConnectionTC->addBookletLog($testId, $body['entry'], $body['timestamp']);

        return $response->withStatus(201);
    });


    $app->post('/test/{test_id}/lock', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');

        $dbConnectionTC->lockBooklet($testId);

        return $response->withStatus(200);
    });
})
    ->add(new RequirePersonToken());

// was /startbooklet

/**
 * TODO this should as well RequirePersonToken instead of RequireGroupToken
 * after https://github.com/iqb-berlin/testcenter-iqb-ng/issues/52 is resolved,
 * remove PersonTokenCreation from here
 */

$app->put('/test', function(Request $request, Response $response) {

    /* @var $authToken GroupAuthToken */
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
    ->add(new RequireGroupToken());
