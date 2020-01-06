<?php

/**
 * status: completely new endpoints
 */

use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Route;
use Slim\Http\Request;
use Slim\Http\Response;


$app->get('/list/routes', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    return $response->withJson($routes);
});

$app->get('/specstatus', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    sort($routes);

    $status = array();

    $specs = SpecCollector::collect(__DIR__);

    foreach ($routes as $route) {
        $status[$route] = isset($specs[$route]) ? $specs[$route] : "<spec missing>";
    }

    return $response->withJson($status);
});


$app->post('/login', function(Request $request, Response $response) use ($app) {

    $dbConnection = new DBConnectionAdmin();

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
        error_log("Rejected login attempt with: " . $request->getBody());
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

