<?php

/**
 * status: new endpoints, refactored and new routes. old endpoint exist and point to here
 * TODO describe those new routes
 */

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Stream;
use Slim\App;


$app->group('/workspace', function(App $app) {

    $dbConnectionAdmin = new DBConnectionAdmin();

    $app->get('/{ws_id}/reviews', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $groups = explode(",", $request->getParam('groups'));
        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];

        if (!$groups) {
            throw new HttpBadRequestException($request, "Parameter groups is missing");
        }

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $reviews = $dbConnectionAdmin->getReviews($workspaceId, $groups);

        return $response->withJson($reviews);
    });

    $app->get('/{ws_id}/results', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $workspaceController = new WorkspaceController($workspaceId);

        $results = $workspaceController->getAssembledResults($workspaceId);

        return $response->withJson($results);
    });


    $app->get('/{ws_id}/responses', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];
        $groups = explode(",", $request->getParam('groups'));

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $results = $dbConnectionAdmin->getResponses($workspaceId, $groups);

        return $response->withJson($results);
    });


    $app->get('/{ws_id}/status', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $workspaceController = new WorkspaceController($workspaceId);

        return $response->withJson($workspaceController->getTestStatusOverview());
    });

    $app->get('/{ws_id}/logs', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];
        $groups = explode(",", $request->getParam('groups'));

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $results = $dbConnectionAdmin->getLogs($workspaceId, $groups);

        return $response->withJson($results);
    });

    $app->get('/{ws_id}/booklets/started', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];
        $groups = explode(",", $request->getParam('groups'));

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $bookletsStarted = array();
        foreach($dbConnectionAdmin->getBookletsStarted($workspaceId) as $booklet) {
            if (in_array($booklet['groupname'], $groups)) {
                if ($booklet['locked'] == '1') {
                    $booklet['locked'] = true;
                } else {
                    $booklet['locked'] = false;
                }
                array_push($bookletsStarted, $booklet);
            }
        }

        return $response->withJson($bookletsStarted);
    });

    $app->get('/{ws_id}/validation', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $adminToken = $_SESSION['adminToken'];

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $workspaceValidator = new workspaceValidator($workspaceId);
        $report = $workspaceValidator->validate();

        return $response->withJson($report);
    });

    $app->get('/{ws_id}/file/{type}/{filename}', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id', 0);
        $fileType = $request->getAttribute('type', '[type missing]'); // TODO basename
        $filename = $request->getAttribute('filename', '[filename missing]');
        $adminToken = $_SESSION['adminToken'];

        if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $workspaceId)) {
            throw new HttpForbiddenException($request,"Access to workspace ws_$workspaceId is not provided.");
        }

        $fullFilename = ROOT_DIR . "/vo_data/ws_$workspaceId/$fileType/$filename";
        if (!file_exists($fullFilename)) {
            throw new HttpNotFoundException($request, "File not found:" . $fullFilename);
        }

        $response->withHeader('Content-Description', 'File Transfer');
        $response->withHeader('Content-Type', ($fileType == 'Resource') ? 'application/octet-stream' : 'text/xml' );
        $response->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->withHeader('Expires', '0');
        $response->withHeader('Cache-Control', 'must-revalidate');
        $response->withHeader('Pragma', 'public');
        $response->withHeader('Content-Length', filesize($fullFilename));

        $fileHandle = fopen($fullFilename, 'rb');

        $fileStream = new Stream($fileHandle);

        return $response->withBody($fileStream);
    });

})->add('auth');
