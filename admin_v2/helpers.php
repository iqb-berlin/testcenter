<?php

use Slim\Http\Request as Request;
use Slim\Http\Response;

/**
 * a set of recurrent helper functions
 */


function jsonencode($obj) {
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}



/**
 * Provisional: a generic exeception handler. will be removed, slim app is defined globally once
 * renderer are used.
 * TODO make this unnecessary
 *
 * @param Request $request
 * @param Response $response
 * @param Throwable $ex
 * @return Response
 */
function errorOut(Slim\Http\Request $request, Slim\Http\Response $response, Throwable $ex) : Slim\Http\Response {

    error_log("[Error: " . $ex->getCode() . "]". $ex->getMessage());
    error_log("[Error: " . $ex->getCode() . "]".  $ex->getFile() . ' | line ' . $ex->getLine());

    if (!is_a($ex, "Slim\Exception\HttpException")) {
        $ex = new \Slim\Exception\HttpException($request, $ex->getMessage(), 500, $ex);
    }

    error_log("[Error: " . $ex->getCode() . "]". $ex->getTitle());
    error_log("[Error: " . $ex->getCode() . "]". $ex->getDescription());

    return $response
        ->withStatus($ex->getCode())
        ->withHeader('Content-Type', 'text/html')
        ->write($ex->getMessage() ? $ex->getMessage() : $ex->getDescription());
}

/**
 *
 * TODO move this to a better place... maybe filefactory?
 *
 * @param $workspaceDirPath
 * @return array
 */
function getAllFilesFromWorkspace($workspaceDirPath) {

    $fileList = array();

    $workspaceDirHandle = opendir($workspaceDirPath);
    while (($subDir = readdir($workspaceDirHandle)) !== false) {
        if (($subDir === '.') or ($subDir === '..')) {
            continue;
        }

        $fullSubDirPath = $workspaceDirPath . '/' . $subDir;

        if (!is_dir($fullSubDirPath)) {
            continue;
        }

        $subDirHandle = opendir($fullSubDirPath);
        while (($entry = readdir($subDirHandle)) !== false) {
            $fullFilePath = $fullSubDirPath . '/' . $entry;
            if (!is_file($fullFilePath)) {
                continue;
            }

            $rs = new ResourceFile($entry, filemtime($fullFilePath), filesize($fullFilePath));

            error_log("PUSH" .  $rs->getFileName());
            array_push($fileList, [
                'filename' => $rs->getFileName(),
                'filesize' => $rs->getFileSize(),
                'filesizestr' => $rs->getFileSizeString(), // TODO is this used?
                'filedatetime' => $rs->getFileDateTime(),
                'filedatetimestr' => $rs->getFileDateTimeString(), // TODO is this used?
                'type' => $subDir,
                'typelabel' => $subDir // TODO is this used?
            ]);

        }

    }

    return $fileList;
}

/**
 * @param $workspaceDirPath
 * @param $filesToDelete - array of relative file paths
 * @return integer
 */
function deleteFilesFromWorkspace($workspaceDirPath, $filesToDelete) {
    $deleted = 0;
    foreach($filesToDelete as $fileToDelete) {
        $fileToDeletePath = $workspaceDirPath . '/' . $fileToDelete;
        if (file_exists($fileToDeletePath)
            and (realpath($fileToDeletePath) === $fileToDeletePath) // to avoid hacks like ..::../README.md
            and unlink($fileToDeletePath)) {
                $deleted += 1;
        }
    }
    return $deleted;
}


