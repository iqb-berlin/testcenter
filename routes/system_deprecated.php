<?php


use Slim\Exception\NotFoundException;
use Slim\Http\Response;
use Slim\App;
use Slim\Http\Request;

$app->group('/php/sys.php', function(App $app) {

    $app->get('/workspaces', function (Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $user = $request->getQueryParam('u', '');
        if (strlen($user) > 0) {
            $response = $app->subRequest('GET', "/user/{$user}/workspaces", '', $request->getHeaders());
        } else {
            $response = $app->subRequest('GET', "/workspaces", '', $request->getHeaders());
        }

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/workspace/add', function (Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $requestBody = JSON::decode($request->getBody());
        $name = isset($requestBody->n) ? $requestBody->n : "";

        $response = $app->subRequest(
            'PUT',
            "/workspace",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            json_encode(array('name' => $name))
        );

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/workspace/rename', function (Request $request, Response $response) use ($app) {

        $requestBody = JSON::decode($request->getBody());
        $name = isset($requestBody->n) ? $requestBody->n : '';
        $workspaceId = isset($requestBody->ws) ? $requestBody->ws : '';

        if (!$workspaceId) {
            throw new NotFoundException($request, $response);
        }

        $response = $app->subRequest(
            'PATCH',
            "/workspace/$workspaceId",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            json_encode(array('name' => $name))
        );

        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/workspaces/delete', function (Request $request,  /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $requestBody = JSON::decode($request->getBody());
        $workspaceList = isset($requestBody->ws) ? $requestBody->ws : []; // TODO is it clever to allow emptyness?

        $response = $app->subRequest(
            'DELETE',
            "/workspaces",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            json_encode(array('ws' => $workspaceList))
        );

        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->post('/workspace/users', function (Request $request,  Response $response) use ($app) {

        $requestBody = JSON::decode($request->getBody());
        $workspaceId = isset($requestBody->ws) ? $requestBody->ws : '';

        if (!$workspaceId) {
            throw new NotFoundException($request, $response);
        }

        $response = $app->subRequest(
            'PATCH',
            "/workspace/{$workspaceId}/users",
            '',
            $request->getHeaders(),
            $request->getCookieParams(),
            $request->getBody()
        );
        $response->getBody()->write('true');
        return $response->withHeader("Warning", "endpoint deprecated");
    });

    $app->get('/users', function(Request $request, /** @noinspection PhpUnusedParameterInspection */ Response $response) use ($app) {

        $workspaceId = $request->getQueryParam('ws', 0);
        if ($workspaceId > 0) {
            $response = $app->subRequest('GET', "/workspace/{ws_id}/users", '', $request->getHeaders());
        } else {
            $response = $app->subRequest('GET', "/users", '', $request->getHeaders());
        }

        return $response->withHeader("Warning", "endpoint deprecated");
    });

})->add(new RequireAdminToken());
