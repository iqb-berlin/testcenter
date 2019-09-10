<?php

/**
 * status: all routes starting with /php -> endpoints are refactored and new route exists. old endpoint points to new one
 */

use Slim\App;

$app->group('/php', function(App $app) {

    $app->post('/getReviews.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/reviews", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getResultData.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/results", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getResponses.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/responses", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getMonitorData.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/status", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getLogs.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/logs", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/getBookletsStarted.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];
        $requestBody = json_decode($request->getBody());
        $groups = isset($requestBody->g) ? $requestBody->g : [];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/bookletsStarted", 'groups=' . implode(',', $groups), $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/checkWorkspace.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

        $workspaceId = $_SESSION['workspace'];

        $response = $app->subRequest('GET', "/workspace/$workspaceId/validate", '', $request->getHeaders());

        return $response->withHeader("Warning", "endpoint deprecated");
    });


})->add('authWithWorkspace');

$app->get('/php/getFile.php', function(Slim\Http\Request $request, /** @noinspection PhpUnusedParameterInspection */ Slim\Http\Response $res) use ($app) {

    $workspaceId = $request->getQueryParam('ws', 0);
    $fileType = $request->getQueryParam('t', '[parameter missing: t]'); // TODO basename
    $filename = $request->getQueryParam('fn', '[parameter missing: fn]');
    $adminToken = $request->getQueryParam('at', '[parameter missing at]');

    // in this endpoint at is not given in header but as get parameter!
    $_SESSION['adminToken'] = $adminToken;

    $headers = array(
      'AuthToken' => jsonencode(array(
         'at' => $adminToken,
         'ws' => $workspaceId
      )),
      'Accept' => '*/*'
    );

    $response = $app->subRequest('GET', "/workspace/$workspaceId/file/$fileType/$filename",'', $headers);

    return $response->withHeader("Warning", "endpoint deprecated");
}); // no auth middleware!
