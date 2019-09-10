<?php

/**
 * status: completely new endpoints
 */


use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Route;


$app->get('/list/routes', function(/** @noinspection PhpUnusedParameterInspection */ Slim\Http\Request $request, Slim\Http\Response $response) use ($app) {

    $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    return $response->withJson($routes);
});


$app->post('/login', function(Slim\Http\Request $request, Slim\Http\Response $response) use ($app, $dbConnection) {

    $requestBody = json_decode($request->getBody());

    if (isset($requestBody->n) and isset($requestBody->p)) {
        $token = $dbConnection->login($requestBody->n, $requestBody->p);
    } else if (isset($requestBody->at)) {
        $token = $requestBody->at;
    } else {
        throw new HttpForbiddenException($request, "Authentication credentials missing.");
    }

    $userName = $dbConnection->getLoginName($token);

    if (!isset($userName) or (strlen($userName) == 0)) { // TODO not necessary if dbC would throw Exception
        error_log("Login attempt with: " . $request->getBody());
        throw new HttpForbiddenException($request, "Wrong authentication credentials");
    }

    $workspaces = $dbConnection->getWorkspaces($token);
    $isSuperAdmin = $dbConnection->isSuperAdmin($token);

    if ((count($workspaces) == 0) and !$isSuperAdmin) {
        throw new HttpException($request, "You don't any workspaces and are not allowed to create some.", 406);
    }

    return $response->withJson([
        'admintoken' => $token,
        'name' => $userName,
        'workspaces' => $workspaces,
        'is_superadmin' => $isSuperAdmin
    ]);
});

