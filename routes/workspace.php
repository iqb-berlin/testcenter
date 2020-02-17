<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Stream;
use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;


$app->group('/workspace', function(App $app) {

    $dbConnectionAdmin = new DBConnectionAdmin();

    $app->get('/{ws_id}/reviews', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $groups = explode(",", $request->getParam('groups'));
        $workspaceId = $request->getAttribute('ws_id');

        if (!$groups) {
            throw new HttpBadRequestException($request, "Parameter groups is missing");
        }

        $reviews = $dbConnectionAdmin->getReviews($workspaceId, $groups);

        return $response->withJson($reviews);
    });

    $app->get('/{ws_id}/results', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');

        $results = $dbConnectionAdmin->getAssembledResults($workspaceId);

        return $response->withJson($results);
    });

    $app->get('/{ws_id}/responses', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $groups = explode(",", $request->getParam('groups'));

        $results = $dbConnectionAdmin->getResponses($workspaceId, $groups);

        return $response->withJson($results);
    });

    $app->delete('/{ws_id}/responses', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $groups = RequestBodyParser::getRequiredElement($request, 'groups');

        foreach ($groups as $group) {
            $dbConnectionAdmin->deleteResultData($workspaceId, $group);
        }

        return $response;
    });

    $app->get('/{ws_id}/status', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');

        $workspaceController = new WorkspaceController($workspaceId);

        return $response->withJson($workspaceController->getTestStatusOverview($dbConnectionAdmin->getBookletsStarted($workspaceId)));
    });

    $app->get('/{ws_id}/logs', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $groups = explode(",", $request->getParam('groups'));

        $results = $dbConnectionAdmin->getLogs($workspaceId, $groups);

        return $response->withJson($results);
    });

    $app->get('/{ws_id}/booklets/started', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $groups = explode(",", $request->getParam('groups'));

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

    $app->get('/{ws_id}/validation', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');

        $workspaceValidator = new WorkspaceValidator($workspaceId);
        $report = $workspaceValidator->validate();

        return $response->withJson($report);
    });

    $app->get('/{ws_id}/file/{type}/{filename}', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id', 0);
        $fileType = $request->getAttribute('type', '[type missing]');
        $filename = $request->getAttribute('filename', '[filename missing]');

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

    $app->post('/{ws_id}/file', function(Request $request, Response $response) {

        $workspaceId = $request->getAttribute('ws_id');

        $importedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'fileforvo', $workspaceId);

        return $response->withJson($importedFiles); // TODO return 201
    });

    $app->get('/{ws_id}/files', function(Request $request, Response $response) {

        $workspaceId = $request->getAttribute('ws_id');

        $workspaceController = new WorkspaceController($workspaceId);
        $files = $workspaceController->getAllFiles();
        return $response->withJson($files);
    });

    $app->delete('/{ws_id}/files', function(Request $request, Response $response) {

        $workspaceId = $request->getAttribute('ws_id');

        $filesToDelete = RequestBodyParser::getRequiredElement($request, 'f');

        $workspaceController = new WorkspaceController($workspaceId);

        $deletionReport = $workspaceController->deleteFiles($filesToDelete);

        return $response->withJson($deletionReport)->withStatus(207);
    });

    $app->post('/{ws_id}/unlock', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $groups = RequestBodyParser::getRequiredElement($request, 'groups');
        $workspaceId = $request->getAttribute('ws_id');

        foreach($groups as $groupName) {
            $dbConnectionAdmin->changeBookletLockStatus($workspaceId, $groupName, false);
        }

        return $response;
    });


    $app->post('/{ws_id}/lock', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $groups = RequestBodyParser::getRequiredElement($request, 'groups');
        $workspaceId = $request->getAttribute('ws_id');

        foreach($groups as $groupName) {
            $dbConnectionAdmin->changeBookletLockStatus($workspaceId, $groupName, true);
        }

        return $response;
    });

    $app->get('/{ws_id}/syscheck-reports', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $checkIds = explode(',', $request->getParam('checkIds', ''));
        $delimiter = $request->getParam('delimiter', ';');
        $lineEnding = $request->getParam('lineEnding', '\n');
        $enclosure = $request->getParam('enclosure', '"');

        $workspaceId = $request->getAttribute('ws_id');

        $workspaceController = new WorkspaceController($workspaceId);
        $reports = $workspaceController->collectSysCheckReports($checkIds);

        # TODO remove $acceptWorkaround if https://github.com/apiaryio/api-elements.js/issues/413 is resolved
        $acceptWorkaround = $request->getParam('format', 'json') == 'csv';

        if (($request->getHeaderLine('Accept') == 'text/csv') or $acceptWorkaround) {

            $flatReports = array_map(function(SysCheckReport $report) {return $report->getFlat();}, $reports);
            $response->getBody()->write(CSV::build($flatReports, array(), $delimiter, $enclosure, $lineEnding));
            return $response->withHeader('Content-type', 'text/csv;charset=UTF-8');
        }

        $reportsArrays = array_map(function(SysCheckReport $report) {return $report->get();}, $reports);

        return $response->withJson($reportsArrays);
    });


    $app->get('/{ws_id}/syscheck-reports/overview', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $workspaceController = new WorkspaceController($workspaceId);
        $reports = $workspaceController->getSysCheckReportList();
        return $response->withJson($reports);
    });


    $app->delete('/{ws_id}/syscheck-reports', function(Request $request, Response $response) use ($dbConnectionAdmin) {

        $workspaceId = $request->getAttribute('ws_id');
        $checkIds = RequestBodyParser::getElementWithDefault($request,'checkIds', []);

        $workspaceController = new WorkspaceController($workspaceId);
        $fileDeletionReport = $workspaceController->deleteSysCheckReports($checkIds);
        return $response->withJson($fileDeletionReport)->withStatus(207);
    });


})
    ->add(new IsWorkspacePermitted())
    ->add(new RequireAdminToken());

$app->group('/workspace', function(App $app) {

    $dbConnectionSuperAdmin = new DBConnectionSuperAdmin();

    $app->put('', function (Request $request, Response $response) use ($dbConnectionSuperAdmin) {

        $requestBody = JSON::decode($request->getBody());
        if (!isset($requestBody->name)) {
            throw new HttpBadRequestException($request, "New workspace name missing");
        }

        $dbConnectionSuperAdmin->addWorkspace($requestBody->name);

        return $response; // TODO return 201
    });

    $app->patch('/{ws_id}', function (Request $request, Response $response) use ($dbConnectionSuperAdmin) {

        $requestBody = JSON::decode($request->getBody());
        $workspaceId = $request->getAttribute('ws_id');

        if (!isset($requestBody->name) or (!$requestBody->name)) {
            throw new HttpBadRequestException($request, "New name (name) is missing");
        }

        $dbConnectionSuperAdmin->setWorkspaceName($workspaceId, $requestBody->name);

        return $response;
    });

    $app->patch('/{ws_id}/users', function (Request $request, Response $response) use ($dbConnectionSuperAdmin) {

        $requestBody = JSON::decode($request->getBody());
        $workspaceId = $request->getAttribute('ws_id');

        if (!isset($requestBody->u) or (!count($requestBody->u))) {
            throw new HttpBadRequestException($request, "User-list (u) is missing");
        }

        $dbConnectionSuperAdmin->setUserRightsForWorkspace($workspaceId, $requestBody->u);

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8');
    });

    $app->get('/{ws_id}/users', function (Request $request, Response $response) use ($dbConnectionSuperAdmin) {

        $workspaceId = $request->getAttribute('ws_id');

        return $response->withJson($dbConnectionSuperAdmin->getUsersByWorkspace($workspaceId));
    });

})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());
