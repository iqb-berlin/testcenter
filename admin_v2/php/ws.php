<?php

use Slim\Exception\HttpInternalServerErrorException;

// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

include_once '../webservice.php';
$dbConnection = new DBConnectionAdmin();

$app->add('authWithWorkspace');

$app->get('/filelist', function(Slim\Http\Request $request, Slim\Http\Response $response) {

    $files = getAllFilesFromWorkspace($_SESSION['workspaceDirName']);
    $response->getBody()->write(jsonencode($files));
    return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
});


$app->post('/delete', function(Slim\Http\Request $request, Slim\Http\Response $response) {

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


$app->post('/unlock', function (Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnection) {

    $workspace = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    foreach($groups as $groupName) {
        $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
    }

    $response->getBody()->write('true'); // TODO don't give anything back

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


$app->post('/lock', function (Slim\Http\Request $request, Slim\Http\Response $response) use ($dbConnection) {

    $workspace = $_SESSION['workspace'];
    $requestBody = json_decode($request->getBody());
    $groups = isset($requestBody->g) ? $requestBody->g : [];

    foreach($groups as $groupName) {
        $dbConnection->changeBookletLockStatus($workspace, $groupName, true);
    }

    $response->getBody()->write('true'); // TODO don't give anything back

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}
