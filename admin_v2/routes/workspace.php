<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpInternalServerErrorException;

$dbConnectionAdmin = new DBConnectionAdmin();

$app->add('authWithWorkspace');

$app->get('/php/ws.php/filelist', function(Slim\Http\Request $request, Slim\Http\Response $response) {

    $files = getAllFilesFromWorkspace($_SESSION['workspaceDirName']);
    $response->getBody()->write(jsonencode($files));
    return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
});


$app->post('/php/ws.php/delete', function(Slim\Http\Request $request, Slim\Http\Response $response) {

    $workspaceDirName = $_SESSION['workspaceDirName'];
    $requestBody = json_decode($request->getBody());
    $filesToDelete = isset($requestBody->f) ? $requestBody->f : [];

    $filesToDelete = array_map(function($fileAndFolderName) { // TODO make this unnecessary (provide proper names from frontend)
        return str_replace('::', '/', $fileAndFolderName);
    }, $filesToDelete);

    $deleted = deleteFilesFromWorkspace($workspaceDirName, $filesToDelete);

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

    $response->getBody()->write(jsonencode($returnMessage));  // TODO why encoding a single string as JSON?
    $responseToReturn = $response->withHeader('Content-type', 'application/json;charset=UTF-8');

    return $responseToReturn;
});


$app->post('/php/ws.php/unlock', function (Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnection) {

    $workspace = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    foreach($groups as $groupName) {
        $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
    }

    $response->getBody()->write('true'); // TODO don't give anything back

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


$app->post('/php/ws.php/lock', function (Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnection) {

    $workspace = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    foreach($groups as $groupName) {
        $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
    }

    $response->getBody()->write('true'); // TODO don't give anything back

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


// TODO describe
$app->get('/workspace/{ws_id}/reviews', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

    $groups = explode(",", $request->getParam('groups'));
    $wsId = $request->getAttribute('ws_id');
    $adminToken = $_SESSION['adminToken'];

    if (!$groups) {
        throw new HttpBadRequestException($request, "Parameter groups is missing");
    }

    if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $wsId)) {
        throw new HttpForbiddenException($request,"Access to workspace ws_$wsId is not provided.");
    }

    $reviews = $dbConnectionAdmin->getReviews($wsId, $groups);

    return $response->withJson($reviews);
});

$app->post('/php/getReviews.php', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($app) {

    $workspaceId = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    $response = $app->subRequest('GET', "/workspace/$workspaceId/reviews", 'groups=' . implode(',', $groups));

    return $response->withHeader("Warning", "endpoint deprecated");
});

// TODO describe
$app->get('/workspace/{ws_id}/results', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

    $wsId = $request->getAttribute('ws_id');
    $adminToken = $_SESSION['adminToken'];

    if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $wsId)) {
        throw new HttpForbiddenException($request,"Access to workspace ws_$wsId is not provided.");
    }

    $results = getAssembledResults($wsId);

    return $response->withJson($results);
});


$app->post('/php/getResultData.php', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($app) {

    $workspaceId = $_SESSION['workspace'];

    $response = $app->subRequest('GET', "/workspace/$workspaceId/results");

    return $response->withHeader("Warning", "endpoint deprecated");
});

// TODO describe
$app->get('/workspace/{ws_id}/responses', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnectionAdmin) {

    $wsId = $request->getAttribute('ws_id');
    $adminToken = $_SESSION['adminToken'];
    $groups = explode(",", $request->getParam('groups'));

    if (!$dbConnectionAdmin->hasAdminAccessToWorkspace($adminToken, $wsId)) {
        throw new HttpForbiddenException($request,"Access to workspace ws_$wsId is not provided.");
    }

    $results = $dbConnectionAdmin->getResponses($wsId, $groups);

    return $response->withJson($results);
});


$app->post('/php/getResponses.php', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($app) {

    $workspaceId = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    $response = $app->subRequest('GET', "/workspace/$workspaceId/responses", 'groups=' . implode(',', $groups));

    return $response->withHeader("Warning", "endpoint deprecated");
});
