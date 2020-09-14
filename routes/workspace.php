<?php
declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;
use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;


$app->group('/workspace', function(App $app) {



    $app->get('/{ws_id}', [WorkspaceController::class, 'get'])
        ->add(new IsWorkspacePermitted('MO'));

    $app->get('/{ws_id}/reviews', [WorkspaceController::class, 'getReviews'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/results', [WorkspaceController::class, 'getResults'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/responses', [WorkspaceController::class, 'getResponses'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/responses', [WorkspaceController::class, 'deleteResponses'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/logs', [WorkspaceController::class, 'getLogs'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/validation', [WorkspaceController::class, 'validation'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->get('/{ws_id}/file/{type}/{filename}', [WorkspaceController::class, 'getFile'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->post('/{ws_id}/file', [WorkspaceController::class, 'postFile'])
        ->add(new IsWorkspacePermitted('RW'));

    $app->get('/{ws_id}/files', [WorkspaceController::class, 'getFiles'])
        ->add(new IsWorkspacePermitted('RO'));

    $app->delete('/{ws_id}/files', [WorkspaceController::class, 'deleteFiles'])
        ->add(new IsWorkspacePermitted('RW'));

    // TODO move the rest of functions to WorkspaceController

    $adminDAO = new AdminDAO();
    $app->get('/{ws_id}/sys-check/reports', function(Request $request, Response $response) use ($adminDAO) {

        $checkIds = explode(',', $request->getParam('checkIds', ''));
        $delimiter = $request->getParam('delimiter', ';');
        $lineEnding = $request->getParam('lineEnding', '\n');
        $enclosure = $request->getParam('enclosure', '"');

        $workspaceId = (int) $request->getAttribute('ws_id');

        $sysChecks = new SysChecksFolder($workspaceId);
        $reports = $sysChecks->collectSysCheckReports($checkIds);

        # TODO remove $acceptWorkaround if https://github.com/apiaryio/api-elements.js/issues/413 is resolved
        $acceptWorkaround = $request->getParam('format', 'json') == 'csv';

        if (($request->getHeaderLine('Accept') == 'text/csv') or $acceptWorkaround) {

            $flatReports = array_map(function(SysCheckReportFile $report) {return $report->getFlat();}, $reports);
            $response->getBody()->write(CSV::build($flatReports, [], $delimiter, $enclosure, $lineEnding));
            return $response->withHeader('Content-type', 'text/csv');
        }

        $reportsArrays = array_map(function(SysCheckReportFile $report) {return $report->get();}, $reports);

        return $response->withJson($reportsArrays);

    })->add(new IsWorkspacePermitted('RO'));


    $app->get('/{ws_id}/sys-check/reports/overview', function(Request $request, Response $response) use ($adminDAO) {

        $workspaceId = (int) $request->getAttribute('ws_id');

        $sysChecksFolder = new SysChecksFolder($workspaceId);
        $reports = $sysChecksFolder->getSysCheckReportList();

        return $response->withJson($reports);

    })->add(new IsWorkspacePermitted('RO'));


    $app->delete('/{ws_id}/sys-check/reports', function(Request $request, Response $response) use ($adminDAO) {

        $workspaceId = (int) $request->getAttribute('ws_id');
        $checkIds = RequestBodyParser::getElementWithDefault($request,'checkIds', []);

        $sysChecksFolder = new SysChecksFolder($workspaceId);
        $fileDeletionReport = $sysChecksFolder->deleteSysCheckReports($checkIds);

        return $response->withJson($fileDeletionReport)->withStatus(207);

    })->add(new IsWorkspacePermitted('RW'));


})->add(new RequireToken('admin'));

$app->group('/workspace', function(App $app) {

    $superAdminDAO = new SuperAdminDAO();

    $app->put('', function (Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        if (!isset($requestBody->name)) {
            throw new HttpBadRequestException($request, "New workspace name missing");
        }

        $superAdminDAO->createWorkspace($requestBody->name);

        return $response->withStatus(201);
    });

    $app->patch('/{ws_id}', function (Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $workspaceId = (int) $request->getAttribute('ws_id');

        if (!isset($requestBody->name) or (!$requestBody->name)) {
            throw new HttpBadRequestException($request, "New name (name) is missing");
        }

        $superAdminDAO->setWorkspaceName($workspaceId, $requestBody->name);

        return $response;
    });

    $app->patch('/{ws_id}/users', function (Request $request, Response $response) use ($superAdminDAO) {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $workspaceId = (int) $request->getAttribute('ws_id');

        if (!isset($requestBody->u) or (!count($requestBody->u))) {
            throw new HttpBadRequestException($request, "User-list (u) is missing");
        }

        $superAdminDAO->setUserRightsForWorkspace($workspaceId, $requestBody->u);

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8');
    });

    $app->get('/{ws_id}/users', function (Request $request, Response $response) use ($superAdminDAO) {

        $workspaceId = (int) $request->getAttribute('ws_id');

        return $response->withJson($superAdminDAO->getUsersByWorkspace($workspaceId));
    });

})
    ->add(new IsSuperAdmin())
    ->add(new RequireToken('admin'));


$app->get('/workspace/{ws_id}/sys-check/{sys-check_name}', function(Request $request, Response $response) use ($app) {

    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');

    $workspaceController = new Workspace($workspaceId);
    /* @var XMLFileSysCheck $xmlFile */
    $xmlFile = $workspaceController->getXMLFileByName('SysCheck', $sysCheckName);

    return $response->withJson(new SysCheck([
        'name' => $xmlFile->getId(),
        'label' => $xmlFile->getLabel(),
        'canSave' => $xmlFile->hasSaveKey(),
        'hasUnit' => $xmlFile->hasUnit(),
        'questions' => $xmlFile->getQuestions(),
        'customTexts' => (object) $xmlFile->getCustomTexts(),
        'skipNetwork' => $xmlFile->getSkipNetwork(),
        'downloadSpeed' => $xmlFile->getSpeedtestDownloadParams(),
        'uploadSpeed' => $xmlFile->getSpeedtestUploadParams(),
        'workspaceId' => $workspaceId
    ]));
});


$app->get('/workspace/{ws_id}/sys-check/{sys-check_name}/unit-and-player', function(Request $request, Response $response) use ($app) {

    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');

    $workspaceController = new Workspace($workspaceId);
    /* @var XMLFileSysCheck $xmlFile */
    $xmlFile = $workspaceController->getXMLFileByName('SysCheck', $sysCheckName);

    return $response->withJson($xmlFile->getUnitData());
});


$app->put('/workspace/{ws_id}/sys-check/{sys-check_name}/report', function(Request $request, Response $response) {

    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');
    $report = new SysCheckReport(JSON::decode($request->getBody()->getContents()));

    $sysChecksFolder = new SysChecksFolder($workspaceId);

    /* @var XMLFileSysCheck $xmlFile */
    $xmlFile = $sysChecksFolder->getXMLFileByName('SysCheck', $sysCheckName);

    if (strlen($report->keyPhrase) <= 0) {

        throw new HttpBadRequestException($request,"No key `$report->keyPhrase`");
    }

    if (strtoupper($report->keyPhrase) !== strtoupper($xmlFile->getSaveKey())) {

        throw new HttpError("Wrong key `$report->keyPhrase`", 400);
    }

    $report->checkId = $sysCheckName;
    $report->checkLabel = $xmlFile->getLabel();

    $sysChecksFolder->saveSysCheckReport($report);

    return $response->withStatus(201);
});


$app->group('/workspace', function(App $app) {

    $adminDAO = new AdminDAO();

    $app->patch('/{ws_id}/tests/unlock', function(Request $request, Response $response) use ($adminDAO) { // TODO name more RESTful

        $groups = RequestBodyParser::getRequiredElement($request, 'groups');
        $workspaceId = (int) $request->getAttribute('ws_id');

        foreach($groups as $groupName) {
            $adminDAO->changeBookletLockStatus($workspaceId, $groupName, false);
        }

        return $response;

    });


    $app->patch('/{ws_id}/tests/lock', function(Request $request, Response $response) use ($adminDAO) { // TODO name more RESTful

        $groups = RequestBodyParser::getRequiredElement($request, 'groups');
        $workspaceId = (int) $request->getAttribute('ws_id');

        foreach($groups as $groupName) {
            $adminDAO->changeBookletLockStatus($workspaceId, $groupName, true);
        }

        return $response;

    });


    $app->get('/{ws_id}/status', function(Request $request, Response $response) use ($adminDAO) {

        $workspaceId = (int) $request->getAttribute('ws_id');
        $bookletsFolder = new BookletsFolder($workspaceId);

        return $response->withJson($bookletsFolder->getTestStatusOverview($adminDAO->getBookletsStarted($workspaceId)));

    });


    $app->get('/{ws_id}/booklets/started', function(Request $request, Response $response) use ($adminDAO) {

        $workspaceId = (int) $request->getAttribute('ws_id');
        $groups = explode(",", $request->getParam('groups', ''));

        $bookletsStarted = [];
        foreach($adminDAO->getBookletsStarted($workspaceId) as $booklet) {
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




})
    ->add(new IsWorkspaceMonitor())
    ->add(new RequireToken('person'));

