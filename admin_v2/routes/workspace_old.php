<?php

/**
 * status: all routes starting with /php/ws.php -> endpoints are refactored but route is still the old one
 */

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php/ws.php', function(App $app) {

    $dbConnection = new DBConnectionAdmin();

    $app->get('/filelist', function(/** @noinspection PhpUnusedParameterInspection */ Request $req, Response $response) {

        $workspaceId = $_SESSION['workspace'];
        $workspaceController = new WorkspaceController($workspaceId);
        $files = $workspaceController->getAllFiles();
        return $response->withJson($files);
    });


    $app->post('/delete', function(Request $request, Response $response) {

        $requestBody = json_decode($request->getBody());
        $filesToDelete = isset($requestBody->f) ? $requestBody->f : [];

        $filesToDelete = array_map(function($fileAndFolderName) { // TODO make this unnecessary (provide proper names from frontend)
            return str_replace('::', '/', $fileAndFolderName);
        }, $filesToDelete);

        $workspaceId = $_SESSION['workspace'];
        $workspaceController = new WorkspaceController($workspaceId);

        $deleted = $workspaceController->deleteFiles($filesToDelete);

        if (!$deleted) { // TODO is this ok?
            throw new HttpInternalServerErrorException($request, "Konnte keine Dateien löschen.");
        }

        $returnMessage = "";

        if ($deleted == 1) {
            $returnMessage = 'Eine Datei gelöscht.'; // TODO should't these messages be business of the frontend?
        }

        if ($deleted == count($filesToDelete)) {
            $returnMessage = "Erfolgreich $filesToDelete Dateien gelöscht.";
        }

        if ($deleted < count($filesToDelete)) { // TODO check if it makes sense that this still returns 200
            $returnMessage = 'Konnte ' . (count($filesToDelete) - $deleted) . ' Dateien nicht löschen.';
        }

        $response->getBody()->write(json_encode($returnMessage, JSON_UNESCAPED_UNICODE));  // TODO why encoding a single string as JSON?
        $responseToReturn = $response->withHeader('Content-type', 'application/json;charset=UTF-8');

        return $responseToReturn;
    });


    $app->post('/unlock', function (Request $request, Response $response) use ($dbConnection) {

        $workspace = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        foreach($groups as $groupName) {
            $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
        }

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });


    $app->post('/lock', function (Request $request, Response $response) use ($dbConnection) {

        $workspace = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        foreach($groups as $groupName) {
            $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
        }

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });

})->add(new NormalAuthWithWorkspaceInHeader());


$app->group('/php/sys.php', function(App $app) {

    $dbConnection = new DBConnectionSuperadmin();

    $app->get('/workspaces', function (Request $request, Response $response) use ($dbConnection) {

        $user = $request->getQueryParam('u', '');
        if (strlen($user) > 0) {
            $workspaces = $dbConnection->getWorkspacesByUser($user);
        } else {
            $workspaces = $dbConnection->getWorkspaces();
        }

        return $response->withJson($workspaces);
    });

    $app->post('/workspace/add', function (Request $request, Response $response) use ($dbConnection) { // TODO use PUT

        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->n)) { // TODO It made them required. is that okay?
            throw new HttpBadRequestException($request, "New workspace name (n) missing");
        }

        $dbConnection->addWorkspace($requestBody->n);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });


    $app->post('/workspace/rename', function (Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());

        if (!isset($requestBody->ws) or !isset($requestBody->n)) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "Workspace ID (ws) or new name (n) is missing");
        }

        $dbConnection->renameWorkspace($requestBody->ws, $requestBody->n);

        $response->getBody()->write('true'); // TODO don't give anything back


        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
    });


    $app->post('/workspaces/delete', function (Request $request, Response $response) use ($dbConnection) { // todo use [del]
        $bodyData = json_decode($request->getBody());
        $workspaceList = isset($bodyData->ws) ? $bodyData->ws : []; // TODO is it clever to allow emptyness?

        $dbConnection->deleteWorkspaces($workspaceList);

        $response->getBody()->write('true'); // TODO don't give anything back

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return number of deleted?
    });


    $app->post('/workspace/users', function (Request $request, Response $response) use ($dbConnection) {

        $requestBody = json_decode($request->getBody());

        if (!isset($requestBody->ws) or !isset($requestBody->u) or (!count($requestBody->u))) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request, "Workspace ID (ws) or user-list (u) is missing");
        }

        $dbConnection->setUsersByWorkspace($requestBody->ws, $requestBody->u);

        $response->getBody()->write('true'); // TODO don't give anything back | number of updated rows?

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back or return number of deleted?
    });

})->add(new NormalAuth());
