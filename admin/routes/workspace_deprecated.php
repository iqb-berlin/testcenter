<?php

/**
 * status: all routes starting with /php -> endpoints are refactored and new route exists. old endpoint points to new one
 */

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/php', function(App $app) {

    $app->post('/getReviews.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/reviews", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getResultData.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/results", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getResponses.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/responses", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getMonitorData.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/status", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getLogs.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/logs", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getBookletsStarted.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/booklets/started", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/checkWorkspace.php', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/validation", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/uploadFile.php', function(Request $request, Response $response) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        UploadedFilesHandler::handleUploadedFiles($request, 'fileforvo', $workspaceId);

        return $response->withJson('OK (valide)')->withHeader("Warning", "endpoint deprecated");
    });

})->add(new NormalAuthWithWorkspaceInHeader());

$app->group('/php', function(App $app) {

    $app->get('/getFile.php', function (Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $res) use ($app) {

        $workspaceId = $request->getQueryParam('ws', 0);
        $fileType = $request->getQueryParam('t', '[parameter missing: t]'); // TODO basename
        $filename = $request->getQueryParam('fn', '[parameter missing: fn]');
        $adminToken = $request->getQueryParam('at', '[parameter missing at]');

        // in this endpoint at is not given in header but as get parameter!
        $_SESSION['adminToken'] = $adminToken;

        $headers = array(
            'AuthToken' => json_encode(array(
                'at' => $adminToken,
                'ws' => $workspaceId
            )),
            'Accept' => '*/*'
        , JSON_UNESCAPED_UNICODE);

        $response = $app->subRequest('GET', "/workspace/$workspaceId/file/$fileType/$filename", '', $headers);

        return $response->withHeader("Warning", "endpoint deprecated");
    }); // no auth middleware!

});
