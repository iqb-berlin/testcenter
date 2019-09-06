<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;

$dbConnectionAdmin = new DBConnectionAdmin();

$app->add('authWithWorkspace');

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
