<?php

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('', function(App $app) {

    $dbConnectionTC = new DBConnectionTC();

    // was: [GET] /bookletdata
    $app->get('/booklet/{booklet_id}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken TestAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getLoginToken();
        $bookletDbId = $request->getAttribute('booklet_id');

        $bookletName = $dbConnectionTC->getBookletName($bookletDbId);
        $workspaceId = $dbConnectionTC->getWorkspaceId($loginToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $bookletFile = $workspaceController->getXMLFileByName('booklet', $bookletName);

        $bookletContainer = [
            'laststate' => $dbConnectionTC->getBookletLastState($bookletDbId),
            'locked' => $dbConnectionTC->isBookletLocked($bookletDbId),
            'xml' => $bookletFile->xmlfile->asXML()
        ];

        return $response->withJson($bookletContainer);
    }); // checked in original for $personToken != '' although it's not used at all


    // was /unitdata/{unit_id}
    $app->get('/booklet/{booklet_id}/unit/{unit_name}', function (Request $request, Response $response) use ($dbConnectionTC) {

        /* @var $authToken TestAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getLoginToken();
        $unitName = $request->getAttribute('unit_name');
        $bookletDbId = $request->getAttribute('booklet_id');

        $workspaceId = $dbConnectionTC->getWorkspaceId($loginToken);
        $workspaceController = new WorkspaceController($workspaceId);
        $unitFile = $workspaceController->getXMLFileByName('unit', $unitName);

        $unitContainer = [
            'laststate' => $dbConnectionTC->getUnitLastState($bookletDbId, $unitName),
            'restorepoint' => $dbConnectionTC->getUnitRestorePoint($bookletDbId, $unitName),
            'xml' => $unitFile->xmlfile->asXML()
        ];

        return $response->withJson($unitContainer);
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
        // TODO wrap into JSOn object analogous to other endpoints
        return $response->withHeader('Content-type', 'text/plain');
    }); // checked in original for $loginToken != ''

})
    ->add(new RequireToken());
