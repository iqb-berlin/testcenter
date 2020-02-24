<?php

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('', function(App $app) {

    $dbConnectionTC = new DBConnectionTC();

    // was: [GET] /bookletdata
    $app->get('/test/{test_id}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken TestAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getLoginToken();
        $testId = $request->getAttribute('test_id');

        $bookletName = $dbConnectionTC->getBookletName($testId);
        $workspaceId = $dbConnectionTC->getWorkspaceId($loginToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $bookletFile = $workspaceController->getXMLFileByName('booklet', $bookletName);

        $test = [
            'laststate' => $dbConnectionTC->getBookletLastState($testId),
            'locked' => $dbConnectionTC->isBookletLocked($testId),
            'xml' => $bookletFile->xmlfile->asXML()
        ];

        return $response->withJson($test);
    }); // checked in original for $personToken != '' although it's not used at all


    // was /unitdata/{unit_id}
    $app->get('/test/{test_id}/unit/{unit_name}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken TestAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getLoginToken();
        $unitName = $request->getAttribute('unit_name');
        $testId = $request->getAttribute('test_id');

        $workspaceId = $dbConnectionTC->getWorkspaceId($loginToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $unitFile = $workspaceController->getXMLFileByName('unit', $unitName);

        $unit = [
            'laststate' => $dbConnectionTC->getUnitLastState($testId, $unitName),
            'restorepoint' => $dbConnectionTC->getUnitRestorePoint($testId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unit);
    }); // checked in original for $personToken != '' although it's not used at all


    $app->get('/resource/{resource_name}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken TestAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getLoginToken();

        $resourceName = $request->getAttribute('resource_name');
        $skipSubVersions = $request->getQueryParam('v', 'f') != 'f'; // TODO rename

        $workspaceId = $dbConnectionTC->getWorkspaceId($loginToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $resourceFile = $workspaceController->getResourceFileByName($resourceName, $skipSubVersions);

        $response->getBody()->write($resourceFile->getContent());

        return $response->withHeader('Content-type', 'text/plain');
    }); // checked in original for $loginToken != ''


    // was: [POST] /review
    $app->put('/test/{test_id}/unit/{unit_name}/review', function (Request $request, Response $response) use ($dbConnectionTC) {

        $testId = $request->getAttribute('test_id');
        $unitName = $request->getAttribute('unit_name');

        $review = RequestBodyParser::getElementsWithDefaults($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => '' // was: e
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

        $review = RequestBodyParser::getElementsWithDefaults($request, [
            'priority' => 0, // was: p
            'categories' => 0, // was: c
            'entry' => '' // was: e
        ]);

        // TODO check if a) test exists and b) unit exists there and c) user is allowed to review
        // a) leads to SQLerror at least, b) review gets written

        $priority = (is_numeric($review['priority']) and ($review['priority'] < 4) and ($review['priority'] >= 0))
            ? $review['priority']
            : 0;


        $dbConnectionTC->addBookletReview($testId, $priority, $review['categories'], $review['entry']);

        return $response->withStatus(201);
    });


})
    ->add(new RequireToken());
